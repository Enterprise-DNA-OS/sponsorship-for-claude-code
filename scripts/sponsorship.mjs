#!/usr/bin/env node
// The one CLI for sponsorship. Every slash command in .claude/commands drives it.
//   npm run sponsorship -- <command> [entity] [record] --field=value --actor=Name [--json]
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const entities={
 partners:['name','owner','category','contact_name','contact_email','status'],
 assets:['name','owner','kind','location','unit','quantity_available','rate','audience','status'],
 deals:['name','owner','partner_id','stage','start_on','end_on','signed_on','currency','cash_value','contra_value','contra_description','probability','exclusive_category','receipted_as_donation','renewal_status','lost_reason','proof_sent_on'],
 entitlements:['deal_id','asset_id','quantity','unit_value','due_on','notes'],
 events:['name','owner','held_on','venue','audience','attendance','broadcast','status'],
 deliveries:['entitlement_id','event_id','delivered_on','quantity','reach','evidence','notes'],
 invoices:['name','owner','deal_id','kind','amount','due_on','issued_on','paid_on','status'],
 tasks:['name','owner','deal_id','due_on','done_on','status'],
 settings:['season_start','season_end','renewal_lead_days','fulfilment_tolerance_pct','proof_report_days','quiet_days','prohibited_categories','adult_only_categories']
};
// Foreign keys by entity: the field and the entity it points at.
const REFS={deals:{partner_id:'partners'},entitlements:{deal_id:'deals',asset_id:'assets'},deliveries:{entitlement_id:'entitlements',event_id:'events'},invoices:{deal_id:'deals'},tasks:{deal_id:'deals'}};
const DATES=['start_on','end_on','signed_on','proof_sent_on','due_on','held_on','delivered_on','issued_on','paid_on','done_on','season_start','season_end'];
const BOOLS=['receipted_as_donation','broadcast'];
const INTEGERS=['quantity_available','probability','quantity','attendance','reach','renewal_lead_days','fulfilment_tolerance_pct','proof_report_days','quiet_days'];
const MONEY=['rate','cash_value','contra_value','unit_value','amount'];
const LOWER=['category','exclusive_category'];

export const reads={
 inventory:'select name,kind,location,unit,audience,available,sold,pipeline,unsold,rate,unsold_value,partners from inventory order by unsold_value desc,name',
 unsold:'select name,kind,unit,audience,unsold,rate,unsold_value from inventory where unsold>0 order by unsold_value desc,name',
 fulfilment:"select partner,deal,asset,unit,promised,delivered,remaining,delivered_pct,elapsed_pct,last_delivered,state from entitlement_status where state<>'delivered' order by case state when 'owed after the deal ended' then 0 when 'past its due date' then 1 when 'behind' then 2 else 3 end,elapsed_pct-delivered_pct desc,partner,asset",
 behind:"select partner,deal,asset,promised,delivered,remaining,delivered_pct,elapsed_pct,state from entitlement_status where state in ('behind','past its due date','owed after the deal ended') order by elapsed_pct-delivered_pct desc,partner",
 renewals:'select name,partner,owner,end_on,days_to_end,total,currency,renewal_status,delivered_pct,last_note from renewals order by end_on,name',
 pipeline:'select name,partner,owner,stage,start_on,total,probability,weighted,currency,last_note from pipeline order by weighted desc,name',
 partners:"select p.name,p.category,p.status,p.owner,p.contact_name,(select count(*)::int from deals d where d.partner_id=p.id and d.stage='contracted') as signed_deals from partners p order by p.status,p.name",
 deals:'select name,partner,stage,start_on,end_on,signed_on,total,currency,promised,delivered,invoiced,paid,renewal_status from deal_summary order by stage,end_on nulls last,name',
 assets:"select name,kind,location,unit,quantity_available,rate,audience,status from assets order by status,kind,name",
 events:"select name,held_on,venue,audience,attendance,broadcast,status from events order by held_on",
 upcoming:"select e.name,e.held_on,e.held_on-current_date as days_away,e.venue,e.audience,(select count(*)::int from event_deliverables d where d.event_id=e.id and d.remaining>0 and not d.recorded) as deliverables from events e where e.status='scheduled' and e.held_on between current_date and current_date+30 order by e.held_on",
 invoices:"select name,partner,deal,kind,amount,currency,due_on,issued_on,state,days_overdue from invoice_status where state not in ('paid','void') order by days_overdue desc nulls last,due_on",
 'partner-value':'select deal,partner,currency,paid_value,promised_value,delivered_value,value_ratio,reach from partner_value order by value_ratio nulls last,deal',
 clashes:'select exclusive_partner,category,exclusive_deal,clashing_partner,clashing_deal,overlap_from,overlap_to from category_clashes order by category,clashing_partner',
 contra:"select d.name as deal,d.partner,d.contra,d.currency,x.contra_description,(select coalesce(sum(i.amount),0)::float8 from invoices i where i.deal_id=d.id and i.kind='contra' and i.status<>'void') as contra_invoiced from deal_summary d join deals x on x.id=d.id where d.contra>0 and d.stage in ('contracted','ended') order by d.name",
 tasks:"select t.name,t.owner,d.name as deal,t.due_on,t.due_on-current_date as days_left from tasks t left join deals d on d.id=t.deal_id where t.status='open' order by t.due_on nulls last,t.name",
 compliance:'select rule,record,area,finding from compliance_findings order by rule,record',
 attention:`select 'Rule finding: '||rule as issue,record from compliance_findings where rule not like 'LOCAL-FULFILMENT'
  union all select 'Behind on what was promised',partner||': '||asset from entitlement_status where state in ('behind','past its due date','owed after the deal ended')
  union all select 'Renewal with no conversation started',name from renewals where renewal_status='not-started'
  union all select 'Invoice overdue',name||' ('||partner||', '||days_overdue||' days)' from invoice_status where state='overdue'
  union all select 'Task overdue',name from tasks where status='open' and due_on<current_date
  union all select 'Live partner gone quiet',d.name from deal_summary d where d.live
   and coalesce((select max(x.delivered_on) from deliveries x join entitlements e on e.id=x.entitlement_id where e.deal_id=d.id),d.start_on)<current_date-(select quiet_days from settings)
   and coalesce((select max(n.created_at)::date from notes n where n.entity='deals' and n.record_id=d.id),d.start_on)<current_date-(select quiet_days from settings)
  union all select 'Event in the next 14 days with deliverables',name||' ('||held_on||')' from events e where status='scheduled' and held_on between current_date and current_date+14 and exists(select 1 from event_deliverables d where d.event_id=e.id and d.remaining>0 and not d.recorded)
  order by issue,record`,
 settings:'select season_start,season_end,renewal_lead_days,fulfilment_tolerance_pct,proof_report_days,quiet_days,prohibited_categories,adult_only_categories,version from settings',
 history:'select entity,record_id,action,actor,created_at from audit_log order by created_at desc,id'
};
export const commands=[...Object.keys(reads),'show','add','update','log','deliver','match-day','deliver-event','sign','proof-sent','renew','import','export','weekly-review','draft-proof','draft-proposal','draft-renewal','help'];

const fail=message=>{throw Error(message);};
const today=()=>new Date().toISOString().slice(0,10);
const iso=v=>v instanceof Date?v.toISOString().slice(0,10):v==null?null:String(v).slice(0,10);
export function parse(args){
 const positional=[],opts={};
 for(const a of args){if(!a.startsWith('--')){positional.push(a);continue;}const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i).replaceAll('-','_');if(k in opts)fail(`Duplicate option ${k}`);opts[k]=i<0?true:a.slice(i+1);}
 return {positional,opts};
}
const FLAGS=['json','dry_run','update_existing','day_first'];
function allowed(o,keys){for(const k of Object.keys(o))if(![...keys,'json'].includes(k))fail(`Unknown option --${k.replaceAll('_','-')}`);for(const k of FLAGS)if(k in o&&o[k]!==true)fail(`--${k.replaceAll('_','-')} takes no value`);}
function required(v,name){if(typeof v!=='string'||!v.trim())fail(`${name} is required`);return v.trim();}
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail(`Expected a real date YYYY-MM-DD: ${v}`);return v;}
function yesNo(v,name){const s=String(v).trim().toLowerCase();if(!['yes','no'].includes(s))fail(`${name} is yes or no`);return s==='yes';}
function amount(v,name){const s=String(v).replace(/[$,\s]|NZD|AUD|USD/gi,'');if(!/^\d+(\.\d{1,2})?$/.test(s))fail(`${name} must be an amount like 1500 or 1500.50`);return s;}
function known(t){if(!entities[t])fail(`Unknown entity ${t}`);return t;}

const LABEL={
 entitlements:"select e.*,d.name||': '||a.name as name from entitlements e join deals d on d.id=e.deal_id join assets a on a.id=e.asset_id order by name,e.id",
 deliveries:"select x.*,d.name||': '||a.name||' on '||x.delivered_on as name from deliveries x join entitlements e on e.id=x.entitlement_id join deals d on d.id=e.deal_id join assets a on a.id=e.asset_id order by name,x.id"
};
async function match(db,t,q){
 known(t);
 if(t==='settings')return (await db.query('select * from settings where id=1'))[0];
 required(q,'record');
 const all=await db.query(LABEL[t]||`select * from ${t} order by name,id`);
 const s=q.toLowerCase();
 const keys=r=>[r.name,t==='partners'?r.contact_email:null].filter(Boolean).map(x=>String(x).toLowerCase());
 let hits=all.filter(r=>r.id===q||keys(r).includes(s));
 if(!hits.length)hits=all.filter(r=>r.id.startsWith(q)||keys(r).some(k=>k.includes(s)));
 if(hits.length!==1)fail(`${hits.length?'Ambiguous':'No match'} ${t}: ${q}\n${(hits.length?hits:all).slice(0,20).map(r=>r.id+' '+r.name).join('\n')}`);
 return hits[0];
}
async function transaction(db,actor,fn,dry=false){required(actor,'actor');await db.exec('BEGIN');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function values(db,t,o){
 const v={};
 for(const k of entities[t]){
  if(!(k in o))continue;let x=o[k];if(x===true)fail(`${k} needs a value`);x=x.trim()||null;
  if(x===null){v[k]=x;continue;}
  if(DATES.includes(k))date(x);
  if(BOOLS.includes(k))x=yesNo(x,k);
  if(INTEGERS.includes(k)){if(!/^\d+$/.test(x))fail(`${k} must be a whole number`);x=Number(x);}
  if(MONEY.includes(k))x=amount(x,k);
  if(LOWER.includes(k))x=x.toLowerCase();
  if(k==='currency')x=x.toUpperCase();
  const ref=REFS[t]?.[k];if(ref)x=(await match(db,ref,x)).id;
  v[k]=x;
 }
 return v;
}
async function insert(db,t,v){const keys=Object.keys(v);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(v)))[0];}
async function update(db,t,id,v,expected){const keys=Object.keys(v);if(!keys.length)fail('No editable fields supplied');const rows=await db.query(`update ${t} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} and version=$${keys.length+2} returning *`,[...Object.values(v),id,expected]);if(!rows.length)fail('Record changed; read show again');return rows[0];}
function expectVersion(o,r){if(!/^\d+$/.test(String(o.expected_version))||Number(o.expected_version)!==r.version)fail('Expected version required or record changed; read show');}

// ---------------------------------------------------------------- the weekly work

// Record what went out for one entitlement on a deal: --asset names it, --event ties it to a match day.
async function deliver(db,q,o){
 allowed(o,['asset','quantity','event','on','reach','evidence','notes','actor']);
 return transaction(db,o.actor,async()=>{
  const d=await match(db,'deals',q);const a=await match(db,'assets',required(o.asset,'asset'));
  const e=(await db.query('select * from entitlements where deal_id=$1 and asset_id=$2',[d.id,a.id]))[0];
  if(!e)fail(`${d.name} has no entitlement for ${a.name}: add it first`);
  if(!['contracted','verbal'].includes(d.stage))fail(`${d.name} is ${d.stage}; deliver only against a signed or verbal deal`);
  const ev=o.event?await match(db,'events',required(o.event,'event')):null;
  const v={entitlement_id:e.id,delivered_on:o.on?date(o.on):ev?iso(ev.held_on):today(),quantity:o.quantity===undefined?1:/^[1-9]\d*$/.test(o.quantity)?Number(o.quantity):fail('quantity must be a whole number above 0'),recorded_by:o.actor};
  if(ev)v.event_id=ev.id;if(o.reach!==undefined){if(!/^\d+$/.test(String(o.reach)))fail('reach must be a whole number');v.reach=Number(o.reach);}
  if(typeof o.evidence==='string')v.evidence=o.evidence.trim()||null;if(typeof o.notes==='string')v.notes=o.notes.trim()||null;
  const done=(await db.query('select coalesce(sum(quantity),0)::int as n from deliveries where entitlement_id=$1',[e.id]))[0].n;
  const row=await insert(db,'deliveries',v);
  return {deal:d.name,asset:a.name,delivered_on:v.delivered_on,quantity:v.quantity,delivered:done+v.quantity,promised:e.quantity,over:done+v.quantity>e.quantity,id:row.id};
 });
}
async function matchDay(db,q){
 const ev=await match(db,'events',q);
 return db.query('select partner,deal,asset,kind,remaining,recorded from event_deliverables where event_id=$1 and (remaining>0 or recorded) order by recorded,partner,asset',[ev.id]);
}
// After the match: one delivery for every per-event entitlement still owed, except the ones named in --skip ("Partner: Asset;...").
async function deliverEvent(db,q,o){
 allowed(o,['skip','reach','actor']);
 return transaction(db,o.actor,async()=>{
  const ev=await match(db,'events',q);if(ev.status==='cancelled')fail(`${ev.name} was cancelled`);
  const due=await db.query('select * from event_deliverables where event_id=$1 and remaining>0 and not recorded order by partner,asset',[ev.id]);
  if(!due.length)fail(`Nothing left to record for ${ev.name}`);
  const skip=typeof o.skip==='string'?o.skip.split(';').map(s=>s.trim().toLowerCase()).filter(Boolean):[];
  for(const s of skip)if(!due.some(d=>`${d.partner}: ${d.asset}`.toLowerCase()===s))fail(`Nothing due at ${ev.name} matches "${s}" (use "Partner: Asset")`);
  const recorded=[];
  for(const d of due){
   if(skip.includes(`${d.partner}: ${d.asset}`.toLowerCase()))continue;
   await insert(db,'deliveries',{entitlement_id:d.entitlement_id,event_id:ev.id,delivered_on:iso(ev.held_on),quantity:1,reach:ev.attendance??(o.reach?Number(o.reach):null),evidence:null,recorded_by:o.actor});
   recorded.push(`${d.partner}: ${d.asset}`);
  }
  if(ev.status==='scheduled'&&iso(ev.held_on)<=today())await update(db,'events',ev.id,{status:'held'},ev.version);
  return {event:ev.name,recorded,skipped:skip.length};
 });
}
async function sign(db,q,o){
 allowed(o,['signed_on','actor','expected_version']);
 return transaction(db,o.actor,async()=>{
  const d=await match(db,'deals',q);expectVersion(o,d);
  if(['contracted','ended','lost'].includes(d.stage))fail(`${d.name} is already ${d.stage}`);
  if(!d.start_on||!d.end_on)fail(`${d.name} needs a start_on and end_on before it is signed`);
  const n=(await db.query('select count(*)::int as n from entitlements where deal_id=$1',[d.id]))[0].n;if(!n)fail(`${d.name} has no entitlements: add what was sold first`);
  const out=await update(db,'deals',d.id,{stage:'contracted',signed_on:o.signed_on?date(o.signed_on):today()},d.version);
  const p=(await db.query('select * from partners where id=$1',[d.partner_id]))[0];if(p.status!=='active')await update(db,'partners',p.id,{status:'active'},p.version);
  return out;
 });
}
async function proofSent(db,q,o){
 allowed(o,['on','actor','expected_version']);
 return transaction(db,o.actor,async()=>{const d=await match(db,'deals',q);expectVersion(o,d);if(!['contracted','ended'].includes(d.stage))fail(`${d.name} is ${d.stage}`);return update(db,'deals',d.id,{proof_sent_on:o.on?date(o.on):today()},d.version);});
}
// Start next term's deal from this one: same partner and entitlements, a proposal for the new dates.
async function renew(db,q,o){
 allowed(o,['start_on','end_on','cash_value','name','actor','expected_version']);
 const start=date(required(o.start_on,'start_on')),end=date(required(o.end_on,'end_on'));if(end<start)fail('end_on is before start_on');
 return transaction(db,o.actor,async()=>{
  const d=await match(db,'deals',q);expectVersion(o,d);
  if(d.stage!=='contracted')fail(`${d.name} is ${d.stage}; renew a signed deal`);
  const name=typeof o.name==='string'?required(o.name,'name'):`${d.name} ${start.slice(0,4)}`;
  const next=await insert(db,'deals',{name,owner:d.owner,partner_id:d.partner_id,stage:'proposal',start_on:start,end_on:end,currency:d.currency,cash_value:o.cash_value?amount(o.cash_value,'cash_value'):d.cash_value,
   contra_value:d.contra_value,contra_description:d.contra_description,exclusive_category:d.exclusive_category});
  const ents=await db.query('select * from entitlements where deal_id=$1',[d.id]);
  for(const e of ents)await insert(db,'entitlements',{deal_id:next.id,asset_id:e.asset_id,quantity:e.quantity,unit_value:e.unit_value});
  await update(db,'deals',d.id,{renewal_status:'talking'},d.version);
  return {renewal:next.name,stage:next.stage,start_on:start,end_on:end,entitlements:ents.length};
 });
}

// ---------------------------------------------------------------- imports from KORE (CSV report exports from the CRM it runs inside)

const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
const canonical=x=>JSON.stringify(sorted(x));
function importDate(v,dayFirst,name){
 v=String(v||'').trim();if(!v)return null;
 if(/^\d{4}-\d{2}-\d{2}/.test(v))return date(v.slice(0,10));
 const m=v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
 if(m){if(!dayFirst)fail(`${name} "${v}" is ambiguous: add --day-first for DD/MM/YYYY exports`);return date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);}
 fail(`${name} is not a date: ${v}`);
}
function stage(v){v=String(v||'').trim().toLowerCase();if(!v)return 'prospect';if(/lost|declin|cancel/.test(v))return 'lost';if(/won|signed|contract|active|executed/.test(v))return 'contracted';if(/expired|ended|complete|closed/.test(v))return 'ended';
 if(/verbal|commit/.test(v))return 'verbal';if(/negotiat/.test(v))return 'negotiating';if(/proposal|quote|pitch|present/.test(v))return 'proposal';if(/prospect|qualif|lead|new/.test(v))return 'prospect';fail('Unknown stage: '+v);}
const KINDS={naming:'naming-rights',sign:'signage',led:'signage',perimeter:'signage',jersey:'apparel',apparel:'apparel',uniform:'apparel',digital:'digital',screen:'digital',web:'digital',social:'social',broadcast:'broadcast',tv:'broadcast',
 hospitality:'hospitality',suite:'hospitality',box:'hospitality',ticket:'tickets',experien:'experiential',activation:'experiential',print:'print',program:'print'};
function kind(v){v=String(v||'').toLowerCase();for(const [k,x] of Object.entries(KINDS))if(v.includes(k))return x;return 'other';}
function unit(v){v=String(v||'').toLowerCase();if(/event|game|match|fixture/.test(v))return 'per-event';if(/item|post|each|unit/.test(v))return 'per-item';return 'per-season';}
function count(v,name,dflt=null){v=String(v||'').replace(/,/g,'').trim();if(!v)return dflt;if(!/^\d+(\.0+)?$/.test(v))fail(`${name} must be a whole number: ${v}`);return Number(v.split('.')[0]);}
const money=(v,name)=>{v=String(v||'').trim();return v?amount(v,name):null;};

// Header names follow KORE's own field names where its product pages use them (assets, agreements, fulfilment);
// KORE runs inside your Salesforce or Dynamics, so your report headings may differ. Copy examples/mapping.json and pass --mapping.
const IMPORTS={
 'kore-assets':{aliases:{name:['Asset Name','Asset','Inventory Item','Name'],kind:['Asset Type','Asset Category','Type','Category'],location:['Location','Venue','Facility'],unit:['Unit','Unit of Measure','Frequency','Rate Basis'],
  quantity_available:['Quantity Available','Inventory Quantity','Available','Quantity'],rate:['Rate Card','Rate Card Value','Rate','Unit Price','Price'],audience:['Audience']},key:'name'},
 'kore-deals':{aliases:{source_key:['Agreement ID','Deal ID','Opportunity ID','ID'],name:['Agreement Name','Deal Name','Opportunity Name','Name'],partner:['Account Name','Partner','Sponsor','Account'],category:['Partner Category','Industry','Category'],
  owner:['Owner','Account Manager','Deal Owner'],stage:['Stage','Status','Agreement Status'],start_on:['Start Date','Agreement Start','Contract Start','Term Start'],end_on:['End Date','Agreement End','Contract End','Term End'],
  signed_on:['Signed Date','Date Signed','Close Date'],cash_value:['Cash Value','Cash','Amount','Cash Amount'],contra_value:['Trade Value','Contra Value','VIK','Value in Kind','Trade']},key:'source_key'},
 'kore-fulfilment':{aliases:{deal:['Agreement Name','Deal Name','Agreement','Deal'],asset:['Asset Name','Asset','Inventory Item'],quantity:['Contracted Quantity','Quantity','Units Sold','Units'],
  delivered:['Fulfilled Quantity','Quantity Fulfilled','Delivered','Fulfilled'],unit_value:['Rate','Unit Value','Unit Price','Value']},key:'deal_asset'}
};
async function importKore(db,kindName,o){
 allowed(o,['file','mapping','actor','dry_run','update_existing','day_first','delivered_on','currency']);
 const spec=IMPORTS[kindName];
 const rows=parseCsv(fs.readFileSync(required(o.file,'file'),'utf8'));if(!rows.length)fail('CSV has no data rows');
 const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8'))[kindName]||{}:{};
 for(const [k,v] of Object.entries(mapping)){if(!spec.aliases[k]||typeof v!=='string')fail('Invalid mapping field '+k);if(!(v in rows[0]))fail('Mapped header is missing: '+v);}
 const deliveredOn=o.delivered_on?date(required(o.delivered_on,'delivered_on')):today();
 const currency=o.currency?required(o.currency,'currency').toUpperCase():null;if(currency&&!/^[A-Z]{3}$/.test(currency))fail('currency is three letters, for example NZD');
 const seen=new Set();
 const batch=rows.map((row,i)=>{
  const v={};for(const k of Object.keys(spec.aliases))v[k]=String(mapping[k]?row[mapping[k]]:pick(row,...spec.aliases[k])).trim()||null;
  const at=`Row ${i+2}`;
  if(kindName==='kore-assets'){required(v.name,`${at}: Asset Name (use --mapping for custom headers)`);v.kind=kind(v.kind);v.unit=unit(v.unit);v.quantity_available=count(v.quantity_available,`${at} quantity`,1);v.rate=money(v.rate,`${at} rate`);
   v.audience=/junior|youth|kids|child/i.test(v.audience||'')?'junior':/adult|18/i.test(v.audience||'')?'adult':'mixed';}
  if(kindName==='kore-deals'){required(v.name,`${at}: Agreement Name (use --mapping for custom headers)`);required(v.partner,`${at}: Account Name`);v.stage=stage(v.stage);
   for(const k of ['start_on','end_on','signed_on'])v[k]=importDate(v[k],o.day_first,`${at} ${k}`);v.cash_value=money(v.cash_value,`${at} cash`)||'0';v.contra_value=money(v.contra_value,`${at} contra`)||'0';
   v.category=(v.category||'other').toLowerCase();v.source_key=v.source_key||v.name;if(v.stage==='contracted'&&(!v.start_on||!v.end_on))fail(`${at}: a signed agreement needs a start and end date`);}
  if(kindName==='kore-fulfilment'){required(v.deal,`${at}: Agreement Name`);required(v.asset,`${at}: Asset Name`);v.quantity=count(v.quantity,`${at} quantity`)??fail(`${at}: Contracted Quantity is required`);
   if(v.quantity<1)fail(`${at}: quantity must be above 0`);v.delivered=count(v.delivered,`${at} delivered`,0);v.unit_value=money(v.unit_value,`${at} rate`);v.deal_asset=`${v.deal}|${v.asset}`;}
  const key=String(v[spec.key]).toLowerCase();if(seen.has(key))fail(`Duplicate ${spec.key} in file: ${v[spec.key]}`);seen.add(key);v.row=row;return v;
 });
 return transaction(db,o.actor,async()=>{
  const counts={added:0,unchanged:0,updated:0,dry_run:!!o.dry_run};
  for(const v of batch){
   if(kindName==='kore-assets'){
    const {row,...fields}=v;const sid=`kore:${v.name.toLowerCase()}`;
    const old=(await db.query('select * from assets where source_id=$1 or lower(name)=lower($2)',[sid,v.name]))[0];
    if(!old){await insert(db,'assets',{...fields,source_id:sid,source_data:row});counts.added++;continue;}
    if(old.source_data&&canonical(old.source_data)===canonical(row)){counts.unchanged++;continue;}
    if(!o.update_existing)fail(`${v.name} is already here with different details; compare it and use --update-existing`);
    await update(db,'assets',old.id,{...fields,source_id:sid,source_data:row},old.version);counts.updated++;continue;
   }
   if(kindName==='kore-deals'){
    const {row,source_key,partner,category,...fields}=v;const sid=`kore:${source_key.toLowerCase()}`;
    let p=(await db.query('select * from partners where lower(name)=lower($1)',[partner]))[0];
    if(!p)p=await insert(db,'partners',{name:partner,category,status:fields.stage==='contracted'?'active':'prospect',source_id:`kore:${partner.toLowerCase()}`});
    const rec={...fields,partner_id:p.id,source_id:sid,source_data:row};if(currency)rec.currency=currency;
    const old=(await db.query('select * from deals where source_id=$1 or lower(name)=lower($2)',[sid,v.name]))[0];
    if(!old){await insert(db,'deals',rec);counts.added++;continue;}
    if(old.source_data&&canonical(old.source_data)===canonical(row)){counts.unchanged++;continue;}
    if(!o.update_existing)fail(`${v.name} is already here with different details; compare it and use --update-existing`);
    await update(db,'deals',old.id,rec,old.version);counts.updated++;continue;
   }
   const d=(await db.query('select * from deals where lower(name)=lower($1)',[v.deal]))[0];if(!d)fail(`No deal named ${v.deal}: import kore-deals first`);
   const a=(await db.query('select * from assets where lower(name)=lower($1)',[v.asset]))[0];if(!a)fail(`No asset named ${v.asset}: import kore-assets first`);
   const sid=`kore:${v.deal_asset.toLowerCase()}`;
   const old=(await db.query('select * from entitlements where source_id=$1 or (deal_id=$2 and asset_id=$3)',[sid,d.id,a.id]))[0];
   const done=old?(await db.query('select coalesce(sum(quantity),0)::int as n from deliveries where entitlement_id=$1',[old.id]))[0].n:0;
   const rec={deal_id:d.id,asset_id:a.id,quantity:v.quantity,unit_value:v.unit_value,source_id:sid,source_data:v.row};
   let e;
   if(!old){e=await insert(db,'entitlements',rec);counts.added++;}
   else if(old.source_data&&canonical(old.source_data)===canonical(v.row)){counts.unchanged++;continue;}
   else{if(!o.update_existing)fail(`${v.deal}: ${v.asset} is already here with different details; compare it and use --update-existing`);e=await update(db,'entitlements',old.id,rec,old.version);counts.updated++;}
   if(v.delivered<done)fail(`${v.deal}: ${v.asset} already has ${done} delivered here, more than the export's ${v.delivered}`);
   if(v.delivered>done)await insert(db,'deliveries',{entitlement_id:e.id,delivered_on:deliveredOn,quantity:v.delivered-done,notes:'Delivered before the move, from the KORE fulfilment export',recorded_by:o.actor});
  }
  return counts;
 },o.dry_run);
}

// ---------------------------------------------------------------- drafts

export function format(value){if(!Array.isArray(value))return JSON.stringify(value,null,2);if(!value.length)return '(none)';return table(value,Object.keys(value[0]).map(k=>({key:k,label:k,width:48,format:x=>x instanceof Date?x.toISOString().slice(0,10):typeof x==='object'&&x!==null?JSON.stringify(x):x})));}
function writeDraft(name,intro,sections){
 const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});
 const file=path.join(dir,name+'-'+randomUUID().slice(0,8)+'.md');
 fs.writeFileSync(file,`# DRAFT: ${name}\n\n${intro}\n\n`+sections.map(s=>'## '+s.title+'\n\n'+(s.text??format(s.rows))).join('\n\n')+'\n',{flag:'wx',mode:0o600});
 return {file};
}
async function draftProof(db,q){
 const d=await match(db,'deals',q);const s=(await db.query('select * from deal_summary where id=$1',[d.id]))[0];
 if(!['contracted','ended'].includes(d.stage))fail(`${d.name} is ${d.stage}; proof of performance follows a signed deal`);
 const ents=await db.query('select asset,promised,delivered,remaining,state from entitlement_status where deal_id=$1 order by asset',[d.id]);
 const log=await db.query("select x.delivered_on,a.name as asset,ev.name as event,x.quantity,x.reach,coalesce(x.evidence,'(no evidence recorded)') as evidence from deliveries x join entitlements e on e.id=x.entitlement_id join assets a on a.id=e.asset_id left join events ev on ev.id=x.event_id where e.deal_id=$1 order by x.delivered_on,a.name",[d.id]);
 const v=(await db.query('select promised_value,delivered_value,value_ratio,reach from partner_value where id=$1',[d.id]))[0];
 return writeDraft('draft-proof',`Proof of performance for ${s.partner}, ${d.name}, ${iso(d.start_on)} to ${iso(d.end_on)}. Not sent. Check every reach figure has evidence behind it before it leaves: a figure you cannot show is a figure you should not send. Record the send with proof-sent.`,
  [{title:'What we promised and what went out',rows:ents},{title:'Value at rate card',rows:[{currency:s.currency,partner_paid:s.total,...v}]},{title:'Delivery log',rows:log}]);
}
async function draftProposal(db,q){
 const p=await match(db,'partners',q);
 const s=(await db.query('select prohibited_categories,adult_only_categories from settings'))[0];
 const list=t=>t.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(list(s.prohibited_categories).includes(p.category.toLowerCase()))fail(`${p.name} is in a prohibited category (${p.category}); no proposal. Read docs/compliance.md`);
 const adultOnly=list(s.adult_only_categories).includes(p.category.toLowerCase());
 const clash=await db.query("select partner as exclusive_partner,end_on from deal_summary where stage='contracted' and end_on>=current_date and lower(exclusive_category)=lower($1) and partner<>$2",[p.category,p.name]);
 const unsold=await db.query(`select name,kind,unit,audience,unsold,rate from inventory where unsold>0${adultOnly?" and audience<>'junior'":''} order by rate desc nulls last`);
 const past=await db.query('select name,stage,start_on,end_on,total,currency from deal_summary where partner=$1 order by start_on desc nulls last',[p.name]);
 const notes=[adultOnly?`- ${p.category} sponsorship must target adults: junior assets are left off this list. Read docs/compliance.md.`:null,
  ...clash.map(c=>`- ${c.exclusive_partner} holds ${p.category} exclusivity until ${iso(c.end_on)}. Check before you pitch.`)].filter(Boolean).join('\n')||'- No category limits on file for this partner.';
 return writeDraft('draft-proposal',`Proposal outline for ${p.name} (${p.category}). Not sent. Pick the assets that fit their goals, then write the pitch in your own words. Rate card values are list prices, not quotes.`,
  [{title:'Checks before you pitch',text:notes},{title:'Inventory still available this season',rows:unsold},{title:'History with this partner',rows:past}]);
}
async function draftRenewal(db,q){
 const d=await match(db,'deals',q);if(d.stage!=='contracted')fail(`${d.name} is ${d.stage}; renewals start from a signed deal`);
 const s=(await db.query('select * from deal_summary where id=$1',[d.id]))[0];
 const ents=await db.query('select asset,promised,delivered,remaining,state from entitlement_status where deal_id=$1 order by asset',[d.id]);
 const v=(await db.query('select delivered_value,value_ratio,reach from partner_value where id=$1',[d.id]))[0];
 return writeDraft('draft-renewal',`Renewal conversation for ${s.partner}: ${d.name} ends ${iso(d.end_on)} (${s.days_to_end} days). Not sent. Lead with what they got this term. Anything still owed is delivered or credited before you ask for the next term.`,
  [{title:'This term',rows:ents},{title:'Value',rows:[{currency:s.currency,paid:s.total,...v}]}]);
}

export async function execute(db,args){
 const {positional:p,opts:o}=parse(args);const [cmd='help',t,q]=p;
 if(reads[cmd]){allowed(o,[]);if(p.length!==1)fail('Unexpected arguments');return db.query(reads[cmd]);}
 if(cmd==='help'){allowed(o,[]);return {commands,entities,usage:'sponsorship <command> [entity] [record] --field=value --actor=Name; updates need --expected-version=N from show; dates YYYY-MM-DD; yes/no for true or false fields; amounts like 1500.50'};}
 if(cmd==='show'){
  allowed(o,[]);const r=await match(db,known(t),q);const out={...r,history:await db.query('select action,actor,created_at from audit_log where entity=$1 and record_id=$2 order by created_at',[t,String(r.id)])};
  if(t==='deals'){out.entitlements=await db.query('select asset,promised,delivered,remaining,state from entitlement_status where deal_id=$1 order by asset',[r.id]);out.invoices=await db.query('select name,kind,amount,due_on,state from invoice_status where deal=$1 order by due_on',[r.name]);}
  if(t==='partners')out.deals=await db.query('select name,stage,start_on,end_on,total,currency from deal_summary where partner=$1 order by start_on desc nulls last',[r.name]);
  if(t==='assets')out.inventory=(await db.query('select available,sold,pipeline,unsold,partners from inventory where id=$1',[r.id]))[0]||null;
  if(t==='events')out.deliverables=await matchDay(db,r.id);
  if(t!=='settings')out.notes=await db.query('select body,actor,created_at from notes where entity=$1 and record_id=$2 order by created_at',[t,r.id]);
  return out;
 }
 if(cmd==='add'||cmd==='update'){
  known(t);allowed(o,[...entities[t],'actor','expected_version']);
  if(cmd==='add'&&t==='settings')fail('Settings has one row: use update settings');
  const v=await values(db,t,o);
  if(cmd==='add'&&!['entitlements','deliveries'].includes(t))required(v.name,'name');
  if(cmd==='add'&&t==='deliveries'){v.delivered_on=v.delivered_on||today();v.recorded_by=o.actor;}
  return transaction(db,o.actor,async()=>{
   const old=cmd==='update'?await match(db,t,t==='settings'?'1':q):null;
   if(old)expectVersion(o,old);
   return old?update(db,t,old.id,v,old.version):insert(db,t,v);
  });
 }
 if(cmd==='log'){allowed(o,['body','actor']);return transaction(db,o.actor,async()=>{const r=await match(db,known(t),q);if(t==='settings')fail('Notes go on a record');return insert(db,'notes',{entity:t,record_id:r.id,body:required(o.body,'body'),actor:o.actor});});}
 if(cmd==='deliver'){if(p.length!==2)fail('deliver <deal> --asset=<asset> [--quantity=1] [--event=] [--reach=] [--evidence=]');return deliver(db,t,o);}
 if(cmd==='match-day'){allowed(o,[]);if(p.length!==2)fail('match-day <event>');return matchDay(db,t);}
 if(cmd==='deliver-event'){if(p.length!==2)fail('deliver-event <event> [--skip="Partner: Asset;..."]');return deliverEvent(db,t,o);}
 if(cmd==='sign'){if(p.length!==2)fail('sign <deal> --expected-version=N [--signed-on=YYYY-MM-DD]');return sign(db,t,o);}
 if(cmd==='proof-sent'){if(p.length!==2)fail('proof-sent <deal> --expected-version=N [--on=YYYY-MM-DD]');return proofSent(db,t,o);}
 if(cmd==='renew'){if(p.length!==2)fail('renew <deal> --start-on= --end-on= --expected-version=N');return renew(db,t,o);}
 if(cmd==='import'){if(IMPORTS[t])return importKore(db,t,o);fail('Use import kore-assets, kore-deals or kore-fulfilment with --file=<export.csv>');}
 if(cmd==='export'){allowed(o,['file']);const out={};for(const k of [...Object.keys(entities),'notes','audit_log'])out[k]=await db.query(`select * from ${k} order by id`);if(o.file)fs.writeFileSync(o.file,JSON.stringify(out,null,2)+'\n',{flag:'wx',mode:0o600});return o.file?{file:o.file}:out;}
 if(cmd==='weekly-review'){
  allowed(o,[]);const sections=[];
  for(const c of ['attention','behind','upcoming','renewals','invoices','pipeline'])sections.push({title:c,rows:await execute(db,[c])});
  return writeDraft('weekly-review','Internal review only. Nothing has been sent or changed. Check each item against the agreement before acting.',sections);
 }
 if(cmd==='draft-proof'){allowed(o,[]);return draftProof(db,t);}
 if(cmd==='draft-proposal'){allowed(o,[]);return draftProposal(db,t);}
 if(cmd==='draft-renewal'){allowed(o,[]);return draftRenewal(db,t);}
 fail('Unknown command '+cmd);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
