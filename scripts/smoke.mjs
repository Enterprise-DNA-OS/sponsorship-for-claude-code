// npm test: a temporary database, the migration, the seed, every CLI command, the three importers, the reports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {migrate} from './migrate.mjs';
import {execute,reads,commands} from './sponsorship.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sponsorship-test-'));
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL||'';process.env.DATA_DIR=path.join(temp,'db');process.env.OUTPUT_DIR=temp;
let db,checks=0;const covered=new Set();
const ok=(x,label)=>{assert.ok(x,label);checks++;};
const eq=(a,b,label)=>{assert.equal(a,b,label);checks++;};
const run=(...args)=>{covered.add(args[0]);return execute(db,args);};
const rejects=async(args,re)=>{covered.add(args[0]);await assert.rejects(()=>execute(db,args),re);checks++;};
const child=(file,args=[],expected=0)=>{const p=spawnSync(process.execPath,[file,...args],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(p.status,expected,p.stderr||p.stdout);checks++;return p;};
const ex=f=>path.join(REPO_ROOT,'examples',f);
const day=v=>v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10);
const today=new Date().toISOString().slice(0,10);
try{
 db=await getDb();if(db.mode==='postgres')ok((await db.query("select table_name from information_schema.tables where table_schema='public'")).length===0,'Test database must be empty');
 await migrate(db);ok((await migrate(db)).ran.length===0,'Migration repeats safely');
 const seed=fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);const logs=(await run('history')).length;await db.exec(seed);
 eq((await run('deals')).length,10,'Seed is idempotent');eq((await run('history')).length,logs,'Seed repetition adds no audit events');
 for(const c of Object.keys(reads))ok(Array.isArray(await run(c)),c);

 // The checks find what the seed hides.
 const comp=await run('compliance');const has=(rule,record)=>comp.some(c=>c.rule===rule&&(!record||c.record===record));
 for(const rule of ['NZ-SFERPA-S29','ADULT-ONLY-ON-JUNIOR','ADULT-ONLY-AT-JUNIOR-EVENT','GST-CONTRA','NOT-A-GIFT','PROOF-NEEDS-EVIDENCE','LOCAL-UNSIGNED','LOCAL-EXCLUSIVITY','LOCAL-OVERSOLD','LOCAL-FULFILMENT','LOCAL-PROOF-REPORT'])ok(has(rule),rule);
 ok(has('NZ-SFERPA-S29','Vapour Lounge match day')&&!has('NZ-SFERPA-S29','Kiwi Lager Co pouring and signage'),'Only prohibited categories');
 ok(has('LOCAL-OVERSOLD','Senior jersey sleeve')&&comp.filter(c=>c.rule==='LOCAL-OVERSOLD').length===1,'Only the oversold asset');
 ok(has('LOCAL-EXCLUSIVITY','Tasman Credit Union junior programme'),'Exclusivity clash in the pipeline');
 const inv=await run('inventory');const a=n=>inv.find(x=>x.name===n);
 ok(a('Senior jersey sleeve').sold===3&&a('Senior jersey sleeve').unsold===-1,'Sold three of two');
 ok(a('Perimeter signage panel').sold===11&&a('Perimeter signage panel').pipeline===1&&a('Perimeter signage panel').unsold_value===6000,'Signage: signed, pipeline and unsold value');
 ok(a('Senior jersey front').sold===0&&a('Senior jersey front').pipeline===1,'Next season proposal is pipeline, not sold');
 ok(!(await run('unsold')).some(x=>x.name==='Ground naming rights'),'Sold-out assets leave the unsold list');
 const fl=await run('fulfilment');const f=(p,s)=>fl.find(x=>x.partner===p&&x.asset===s);
 ok(f('Coastline Bank','Social media post').state==='behind'&&f('Coastline Bank','Social media post').delivered===9,'Behind against the clock');
 ok(f('Pacific Energy','Social media post').state==='owed after the deal ended','Owed after the end');
 ok(f('Fresh Fields Supermarket','Social media post').state==='on track','Ahead of the clock is on track');
 ok(!fl.some(x=>x.state==='delivered'),'Delivered lines leave the fulfilment list');
 eq((await run('behind')).length,4,'Four lines behind');
 const ren=await run('renewals');ok(ren.length===3&&ren[0].name==='Ridgeway Physio programme partner'&&!ren.some(r=>r.name.startsWith('Pacific')),'Renewals inside the window, decided ones out');
 const pipe=await run('pipeline');ok(pipe[0].name==='Summit Insurance signage'&&pipe[0].weighted===17600,'Weighted pipeline');
 ok(pipe.find(x=>x.name==='Vapour Lounge match day').weighted===1500,'Stage default probability');
 const pv=await run('partner-value');ok(pv.find(x=>x.partner==='Coastline Bank').value_ratio===1.23&&pv[0].value_ratio<1,'Value at rate card');
 ok((await run('invoices')).some(i=>i.name==='INV-1006'&&i.state==='overdue'&&i.days_overdue===20),'Overdue invoice');
 ok((await run('contra'))[0].contra_invoiced===0,'Contra with nothing invoiced');
 const up=await run('upcoming');ok(up.length===3&&up[0].name==='Quarter-final'&&up[0].deliverables>0,'Upcoming events with deliverables');
 const att=await run('attention');ok(att.some(x=>x.issue==='Invoice overdue')&&att.some(x=>x.issue==='Renewal with no conversation started'&&x.record==='Coastline Bank naming rights')&&att.some(x=>x.issue==='Live partner gone quiet'),'Attention');

 // Matching and validation.
 const p=await run('add','partners','--name=Harbour Cafe Ltd','--category=Hospitality','--actor=Aroha');eq(p.category,'hospitality','Categories stored lower case');
 eq((await run('show','partners','harbour cafe ltd')).id,p.id,'Case insensitive match');eq((await run('show','partners',p.id.slice(0,8))).id,p.id,'Partial id');
 eq((await run('show','partners','dean@kiwilager.example')).name,'Kiwi Lager Co','Contact email match');
 await rejects(['show','partners','Harbour'],/Ambiguous/);await rejects(['show','partners','Nobody'],/No match/);
 await rejects(['add','partners','--name=No actor'],/actor/);await rejects(['add','events','--name=Bad','--held-on=2026-02-30','--actor=Sam'],/real date/);
 await rejects(['add','assets','--name=Bad','--quantity-available=lots','--actor=Sam'],/whole number/);await rejects(['add','partners','--name=X','--colour=red','--actor=Sam'],/Unknown option/);
 await rejects(['add','events','--name=Y','--held-on=2026-11-01','--broadcast=maybe','--actor=Sam'],/yes or no/);await rejects(['add','settings','--actor=Sam'],/one row/);
 await rejects(['add','assets','--name=Z','--rate=12.345','--actor=Sam'],/amount/);await rejects(['add','deals','--name=Q','--partner-id=Kiwi Lager Co','--probability=150','--actor=Sam'],/check/);
 const asset=await run('add','assets','--name=Goal post pads','--kind=signage','--unit=per-season','--quantity-available=4','--rate=$2,500','--actor=Sam');eq(Number(asset.rate),2500,'Amounts accept dollar signs and commas');

 // A deal from proposal to signed, delivered, proven and renewed.
 const deal=await run('add','deals','--name=Harbour Cafe post pads','--partner-id=Harbour Cafe Ltd','--stage=proposal',`--start-on=${today}`,'--end-on=2099-12-31','--cash-value=9000','--actor=Aroha');
 await rejects(['sign','Harbour Cafe post pads','--actor=Aroha',`--expected-version=${deal.version}`],/no entitlements/);
 const ent=await run('add','entitlements','--deal-id=Harbour Cafe post pads','--asset-id=Goal post pads','--quantity=2','--actor=Aroha');ok(ent.deal_id&&ent.asset_id,'Entitlement by names');
 eq((await run('show','entitlements','Harbour Cafe post pads: Goal post pads')).id,ent.id,'Entitlement match');
 await rejects(['deliver','Harbour Cafe post pads','--asset=Goal post pads','--actor=Sam'],/deliver only against/);
 await rejects(['sign','Harbour Cafe post pads','--actor=Aroha','--expected-version=99'],/version/);
 const signed=await run('sign','Harbour Cafe post pads','--actor=Aroha',`--expected-version=${deal.version}`);ok(signed.stage==='contracted'&&day(signed.signed_on)===today,'Signed today');
 eq((await run('show','partners','Harbour Cafe Ltd')).status,'active','Signing makes the partner active');
 await rejects(['deliver','Harbour Cafe post pads','--asset=Corporate box','--actor=Sam'],/no entitlement/);
 await rejects(['deliver','Harbour Cafe post pads','--asset=Goal post pads','--quantity=0','--actor=Sam'],/above 0/);
 const dl=await run('deliver','Harbour Cafe post pads','--asset=Goal post pads','--quantity=2','--evidence=Drive/Partners/Harbour Cafe/pads.jpg','--actor=Sam');ok(dl.delivered===2&&!dl.over,'Delivery recorded');
 eq((await run('show','deals','Harbour Cafe post pads')).entitlements[0].state,'delivered','Entitlement delivered');
 ok(fs.readFileSync((await run('draft-proof','Harbour Cafe post pads')).file,'utf8').includes('pads.jpg'),'Proof draft lists evidence');
 let hc=await run('show','deals','Harbour Cafe post pads');const ps=await run('proof-sent','Harbour Cafe post pads','--actor=Aroha',`--expected-version=${hc.version}`);eq(day(ps.proof_sent_on),today,'Proof recorded');
 hc=await run('show','deals','Harbour Cafe post pads');await rejects(['renew','Harbour Cafe post pads','--start-on=2100-01-01','--end-on=2099-01-01','--actor=Aroha',`--expected-version=${hc.version}`],/before/);
 const rn=await run('renew','Harbour Cafe post pads','--start-on=2100-01-01','--end-on=2100-12-31','--cash-value=9500','--actor=Aroha',`--expected-version=${hc.version}`);ok(rn.entitlements===1&&rn.stage==='proposal'&&rn.renewal==='Harbour Cafe post pads 2100','Renewal proposal');
 eq((await run('show','deals','Harbour Cafe post pads')).renewal_status,'talking','Old deal marked talking');
 ok(fs.readFileSync((await run('draft-renewal','Coastline Bank naming rights')).file,'utf8').includes('Social media post'),'Renewal draft');
 await rejects(['draft-renewal','Northern Fuel jersey front'],/proposal/);

 // Match day: the run sheet, then one command after the final whistle.
 const md=await run('match-day','Quarter-final');ok(md.length===5&&md.every(x=>!x.recorded),'Run sheet for the quarter-final');
 await rejects(['deliver-event','Quarter-final','--skip=Nobody: Nothing','--actor=Sam'],/matches/);
 const de=await run('deliver-event','Quarter-final','--skip=Coastline Bank: Corporate box','--actor=Sam');eq(de.recorded.length,4,'Four recorded, one skipped');
 ok((await run('match-day','Quarter-final')).filter(x=>x.recorded).length===4,'Recorded lines show on the run sheet');
 const de2=await run('deliver-event','Quarter-final','--actor=Sam');eq(de2.recorded.length,1,'The skipped line can be recorded later');
 await rejects(['deliver-event','Quarter-final','--actor=Sam'],/Nothing left/);

 // Rules clear when the record is put right.
 let ev=await run('deliver','Coastline Bank naming rights','--asset=Social media post','--reach=8000','--actor=Sam');
 ok((await run('compliance')).filter(c=>c.rule==='PROOF-NEEDS-EVIDENCE').length===2,'A new reach claim without evidence is flagged');
 const dlv=(await db.query("select id,version from deliveries where id=$1",[ev.id]))[0];
 await run('update','deliveries',dlv.id,'--evidence=Drive/Partners/Coastline/insights.png','--actor=Sam',`--expected-version=${dlv.version}`);
 eq((await run('compliance')).filter(c=>c.rule==='PROOF-NEEDS-EVIDENCE').length,1,'Evidence clears the finding');
 await run('add','invoices','--name=INV-1008','--deal-id=Harbour Motors vehicle partner','--kind=contra','--amount=30000',`--due-on=${today}`,'--actor=Sam');
 ok(!(await run('compliance')).some(c=>c.rule==='GST-CONTRA'),'Contra invoice clears the GST finding');
 const rp=await run('show','deals','Ridgeway Physio programme partner');await run('update','deals','Ridgeway Physio programme partner','--receipted-as-donation=no','--actor=Sam',`--expected-version=${rp.version}`);
 ok(!(await run('compliance')).some(c=>c.rule==='NOT-A-GIFT'),'Donation receipt finding clears');
 await rejects(['draft-proposal','Vapour Lounge'],/prohibited/);
 const kp=fs.readFileSync((await run('draft-proposal','Kiwi Lager Co')).file,'utf8');ok(!kp.includes('Junior')&&kp.includes('must target adults'),'Adult-only partner sees no junior assets');
 ok(fs.readFileSync((await run('draft-proposal','Tasman Credit Union')).file,'utf8').includes('Coastline Bank holds banking exclusivity'),'Proposal flags exclusivity');
 const st=(await run('settings'))[0];await run('update','settings','--adult-only-categories=gambling','--actor=Sam',`--expected-version=${st.version}`);
 ok(!(await run('compliance')).some(c=>c.rule.startsWith('ADULT-ONLY')),'Settings drive the category rules');
 await run('log','deals','Fresh Fields community partner','--body=Tom happy with the clinic photos','--actor=Sam');eq((await run('show','deals','Fresh Fields community partner')).notes.length,1,'Note on a record');
 ok(!(await run('attention')).some(x=>x.issue==='Live partner gone quiet'&&x.record==='Fresh Fields community partner'),'A note counts as contact');

 // KORE imports.
 const ka=['import','kore-assets',`--file=${ex('kore-assets.csv')}`,'--actor=Sam'];
 const before=(await run('assets')).length;await run(...ka,'--dry-run');eq((await run('assets')).length,before,'Dry run leaves no records');
 const r1=await run(...ka);eq(r1.added,3,'Three assets added');eq((await run(...ka)).unchanged,3,'Assets import is idempotent');
 const sc=await run('show','assets','Scoreboard clock');ok(sc.kind==='signage'&&Number(sc.rate)===12000&&sc.unit==='per-season','Asset words become kinds and units');
 const kz=await run('show','assets','Half-time kids zone');ok(kz.kind==='experiential'&&kz.unit==='per-event'&&kz.audience==='junior','Junior audience from the export');
 const kd=['import','kore-deals',`--file=${ex('kore-deals.csv')}`,'--actor=Aroha'];const r2=await run(...kd);eq(r2.added,2,'Two agreements');eq((await run(...kd)).unchanged,2,'Agreements import is idempotent');
 const bp=await run('show','deals','Bayside Plumbing scoreboard');ok(bp.stage==='contracted'&&Number(bp.cash_value)===14000,'Closed won is contracted');
 eq((await run('show','deals','Harbour Cafe kids zone')).stage,'negotiating','Negotiation stage');eq((await run('show','partners','Bayside Plumbing')).status,'active','Partner created from the account name');
 const kf=['import','kore-fulfilment',`--file=${ex('kore-fulfilment.csv')}`,'--delivered-on=2026-09-30','--actor=Sam'];const r3=await run(...kf);eq(r3.added,2,'Two entitlements');
 const bps=(await run('show','deals','Bayside Plumbing scoreboard')).entitlements;ok(bps.find(x=>x.asset==='Email newsletter banner').delivered===5,'Fulfilled count recorded as delivered');
 eq((await run(...kf)).unchanged,2,'Fulfilment import is idempotent');
 const vfile=path.join(temp,'f.csv');fs.writeFileSync(vfile,'Agreement Name,Asset Name,Contracted Quantity,Fulfilled Quantity\nBayside Plumbing scoreboard,Email newsletter banner,12,8\n');
 await rejects(['import','kore-fulfilment',`--file=${vfile}`,'--actor=Sam'],/already here/);
 eq((await run('import','kore-fulfilment',`--file=${vfile}`,'--update-existing','--actor=Sam')).updated,1,'Explicit update');
 ok((await run('show','deals','Bayside Plumbing scoreboard')).entitlements.find(x=>x.asset==='Email newsletter banner').delivered===8,'Only the extra deliveries are added');
 fs.writeFileSync(vfile,'Agreement Name,Asset Name,Contracted Quantity,Fulfilled Quantity\nBayside Plumbing scoreboard,Email newsletter banner,12,3\n');await rejects(['import','kore-fulfilment',`--file=${vfile}`,'--update-existing','--actor=Sam'],/more than/);
 fs.writeFileSync(vfile,'Agreement Name,Asset Name,Contracted Quantity\nNo Such Deal,Scoreboard clock,1\n');await rejects(['import','kore-fulfilment',`--file=${vfile}`,'--actor=Sam'],/import kore-deals first/);
 fs.writeFileSync(vfile,'Agreement ID,Agreement Name,Account Name,Stage,Start Date,End Date\nA-9,Odd deal,Odd Co,Closed Won,03/11/2026,02/11/2027\n');await rejects(['import','kore-deals',`--file=${vfile}`,'--actor=Sam'],/day-first/);
 eq((await run('import','kore-deals',`--file=${vfile}`,'--day-first','--currency=AUD','--actor=Sam')).added,1,'Day-first dates');
 const odd=await run('show','deals','Odd deal');ok(day(odd.start_on)==='2026-11-03'&&odd.currency==='AUD','Day first parsed, currency set');
 fs.writeFileSync(vfile,'Inventory Item Name,List Price\nCar park banner,900\nCar park banner,950\n');await rejects(['import','kore-assets',`--file=${vfile}`,`--mapping=${ex('mapping.json')}`,'--actor=Sam'],/Duplicate/);
 ok(!(await run('assets')).some(x=>x.name==='Car park banner'),'Failed batch changes nothing');
 fs.writeFileSync(vfile,'Inventory Item Name,List Price\nCar park banner,900\n');eq((await run('import','kore-assets',`--file=${vfile}`,`--mapping=${ex('mapping.json')}`,'--actor=Sam')).added,1,'Custom headers through a mapping');
 fs.writeFileSync(vfile,'Agreement Name,Account Name,Stage\nWeird,Weird Co,Sideways\n');await rejects(['import','kore-deals',`--file=${vfile}`,'--actor=Sam'],/Unknown stage/);
 await rejects(['import','other'],/kore-assets/);

 // Export, drafts, help, privacy, audit.
 const exported=await run('export');ok(exported.notes.length===4&&exported.audit_log.length>logs&&exported.deals.length===15,'Full export');
 const dest=path.join(temp,'export.json');await run('export',`--file=${dest}`);await rejects(['export',`--file=${dest}`],/EEXIST/);
 ok(fs.existsSync((await run('weekly-review')).file),'weekly-review');
 eq((await run('help')).commands.length,commands.length,'Help inventory');
 const missed=commands.filter(c=>!covered.has(c));ok(!missed.length,'Every CLI command covered: '+missed.join(','));
 const names=['partners','assets','deals','entitlements','events','deliveries','invoices','tasks','settings','notes','audit_log'];
 const tables=await db.query(`select relname,relrowsecurity from pg_class where relkind='r' and relname = any($1)`,[names]);ok(tables.length===names.length&&tables.every(x=>x.relrowsecurity),'Tables private by default');
 await assert.rejects(()=>db.query("insert into partners(name) values ('Unaudited')"),/actor/);checks++;
 const fresh=await run('show','partners','Harbour Cafe Ltd');await run('update','partners','Harbour Cafe Ltd','--name=Harbour Cafe <script>alert(1)</script>',`--expected-version=${fresh.version}`,'--actor=Sam');
 await db.close();db=null;
 JSON.parse(child('scripts/sponsorship.mjs',['attention','--json']).stdout);child('scripts/sponsorship.mjs',['show','partners','Harbour'],1);child('scripts/sponsorship.mjs',['oops'],1);
 child('scripts/view.mjs');child('scripts/docs.mjs');
 eq(fs.readdirSync(path.join(temp,'views')).length,2,'Two reports');
 for(const d of ['proof-of-performance','partner-statement','match-day-run-sheet','sponsorship-prospectus'])ok(fs.readdirSync(path.join(temp,'docs-out',d)).length>=1,d);
 const html=fs.readFileSync(path.join(temp,'views','commercial.html'),'utf8');ok(html.includes('Inventory this season')&&!html.includes('<script>alert(1)</script>'),'Reports render and escape');
 const pop=fs.readdirSync(path.join(temp,'docs-out','proof-of-performance')).find(f=>f.startsWith('coastline-bank'));
 ok(fs.readFileSync(path.join(temp,'docs-out','proof-of-performance',pop),'utf8').includes('insights.png'),'Proof of performance lists the evidence');
 console.log(`PASS: ${checks} assertions; ${commands.length} CLI commands exercised; ${process.env.TEST_DATABASE_URL?'Postgres':'PGlite'}; isolated database.`);
}finally{if(db)await db.close();fs.rmSync(temp,{recursive:true,force:true});}
