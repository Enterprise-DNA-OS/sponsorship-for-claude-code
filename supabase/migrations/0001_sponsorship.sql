-- Sponsorship: partners, the inventory of assets you sell, deals and the entitlements in each,
-- what was delivered and when, the events you deliver at, invoices (cash and contra) and tasks.
-- Dates are calendar dates. Money is in the currency on the deal. Every write carries an actor and lands in audit_log.

create table partners (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 category text not null default 'other', contact_name text, contact_email text, status text not null default 'prospect' check (status in ('prospect','active','lapsed')),
 source_id text unique, source_data jsonb);

create table assets (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 kind text not null default 'signage' check (kind in ('naming-rights','signage','apparel','digital','social','broadcast','hospitality','tickets','experiential','print','other')),
 location text, unit text not null default 'per-season' check (unit in ('per-season','per-event','per-item')), quantity_available integer not null default 1 check (quantity_available>=0),
 rate numeric(12,2) check (rate>=0), audience text not null default 'adult' check (audience in ('adult','junior','mixed')), status text not null default 'active' check (status in ('active','retired')),
 source_id text unique, source_data jsonb);

create table deals (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 partner_id uuid not null references partners(id), stage text not null default 'prospect' check (stage in ('prospect','proposal','negotiating','verbal','contracted','ended','lost')),
 start_on date, end_on date, signed_on date, currency text not null default 'NZD' check (currency ~ '^[A-Z]{3}$'),
 cash_value numeric(12,2) not null default 0 check (cash_value>=0), contra_value numeric(12,2) not null default 0 check (contra_value>=0), contra_description text,
 probability integer check (probability between 0 and 100), exclusive_category text, receipted_as_donation boolean not null default false,
 renewal_status text not null default 'not-started' check (renewal_status in ('not-started','talking','renewed','not-renewing')), lost_reason text, proof_sent_on date,
 source_id text unique, source_data jsonb, check (end_on is null or start_on is null or end_on>=start_on), check (stage<>'contracted' or (start_on is not null and end_on is not null)));

create table entitlements (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 deal_id uuid not null references deals(id), asset_id uuid not null references assets(id), quantity integer not null default 1 check (quantity>0), unit_value numeric(12,2) check (unit_value>=0),
 due_on date, notes text, source_id text unique, source_data jsonb, unique (deal_id,asset_id));

create table events (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 held_on date not null, venue text, audience text not null default 'adult' check (audience in ('adult','junior','mixed')), attendance integer check (attendance>=0), broadcast boolean not null default false,
 status text not null default 'scheduled' check (status in ('scheduled','held','cancelled')));

create table deliveries (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 entitlement_id uuid not null references entitlements(id), event_id uuid references events(id), delivered_on date not null, quantity integer not null default 1 check (quantity>0),
 reach integer check (reach>=0), evidence text, notes text, recorded_by text);

create table invoices (id uuid primary key default gen_random_uuid(), name text not null unique check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 deal_id uuid not null references deals(id), kind text not null default 'cash' check (kind in ('cash','contra')), amount numeric(12,2) not null check (amount>=0),
 due_on date not null, issued_on date, paid_on date, status text not null default 'scheduled' check (status in ('scheduled','issued','paid','void')), check (status<>'paid' or paid_on is not null));

create table tasks (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name))>0), owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
 deal_id uuid references deals(id), due_on date, done_on date, status text not null default 'open' check (status in ('open','done')), check (status<>'done' or done_on is not null));

-- The rules the team works to. One row. Change it with /customise or update settings.
create table settings (id integer primary key default 1 check (id=1),
 season_start date, season_end date, renewal_lead_days integer not null default 120, fulfilment_tolerance_pct integer not null default 15,
 proof_report_days integer not null default 30, quiet_days integer not null default 30,
 prohibited_categories text not null default 'tobacco,vaping', adult_only_categories text not null default 'alcohol,gambling',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1);
insert into settings(id,season_start,season_end) values (1,date_trunc('year',current_date)::date,(date_trunc('year',current_date)+interval '1 year - 1 day')::date);

create table notes (id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, body text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table audit_log (id uuid primary key default gen_random_uuid(), entity text not null, record_id text not null, action text not null, actor text not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create function record_change() returns trigger language plpgsql as $$
declare who text;
begin
 who := nullif(current_setting('app.actor', true),'');
 if who is null then raise exception 'An actor is required'; end if;
 insert into audit_log(entity,record_id,action,actor,before_data,after_data) values (TG_TABLE_NAME,NEW.id::text,TG_OP,who,case when TG_OP='UPDATE' then to_jsonb(OLD) else null end,to_jsonb(NEW));
 return NEW;
end $$;
create function touch_record() returns trigger language plpgsql as $$ begin NEW.updated_at=now(); NEW.version=OLD.version+1; return NEW; end $$;

do $$ declare t text; begin
 foreach t in array array['partners','assets','deals','entitlements','events','deliveries','invoices','tasks','settings'] loop
  execute format('create trigger track_%1$s after insert or update on %1$s for each row execute function record_change()', t);
  execute format('create trigger touch_%1$s before update on %1$s for each row execute function touch_record()', t);
 end loop;
 foreach t in array array['partners','assets','deals','entitlements','events','deliveries','invoices','tasks','settings','notes','audit_log'] loop
  execute format('alter table %1$s enable row level security', t);
  execute format('revoke all on %1$s from public', t);
 end loop;
end $$;

-- A deal is live when it is signed and today falls inside its term.
create view deal_summary as
select d.id, d.name, p.name as partner, p.category, d.owner, d.stage, d.start_on, d.end_on, d.signed_on, d.currency,
 d.cash_value::float8 as cash, d.contra_value::float8 as contra, (d.cash_value+d.contra_value)::float8 as total, d.probability, d.renewal_status, d.exclusive_category,
 d.end_on-current_date as days_to_end,
 (select coalesce(sum(e.quantity),0)::int from entitlements e where e.deal_id=d.id) as promised,
 (select coalesce(sum(x.quantity),0)::int from deliveries x join entitlements e on e.id=x.entitlement_id where e.deal_id=d.id) as delivered,
 (select coalesce(sum(i.amount),0)::float8 from invoices i where i.deal_id=d.id and i.status<>'void') as invoiced,
 (select coalesce(sum(i.amount),0)::float8 from invoices i where i.deal_id=d.id and i.status='paid') as paid,
 d.stage='contracted' and current_date between d.start_on and d.end_on as live
from deals d join partners p on p.id=d.partner_id;

-- Each entitlement against the clock: how far through the deal we are, and how much has gone out.
create view entitlement_status as
with s as (select * from settings where id=1),
x as (select entitlement_id, sum(quantity)::int as delivered, max(delivered_on) as last_delivered from deliveries group by entitlement_id)
select e.id, d.id as deal_id, d.name as deal, p.name as partner, a.name as asset, a.kind, a.unit, e.quantity as promised, coalesce(x.delivered,0) as delivered,
 greatest(e.quantity-coalesce(x.delivered,0),0) as remaining, x.last_delivered, e.due_on, d.start_on, d.end_on,
 round(100.0*coalesce(x.delivered,0)/e.quantity)::int as delivered_pct,
 case when d.end_on<=d.start_on then 100 else least(100,greatest(0,round(100.0*(current_date-d.start_on)/(d.end_on-d.start_on))))::int end as elapsed_pct,
 coalesce(e.unit_value,a.rate)::float8 as unit_value,
 case when coalesce(x.delivered,0)>=e.quantity then 'delivered'
  when d.end_on<current_date then 'owed after the deal ended'
  when e.due_on<current_date then 'past its due date'
  when current_date<d.start_on then 'not started'
  when round(100.0*coalesce(x.delivered,0)/e.quantity)+s.fulfilment_tolerance_pct<case when d.end_on<=d.start_on then 100 else 100.0*(current_date-d.start_on)/(d.end_on-d.start_on) end then 'behind'
  else 'on track' end as state
from entitlements e join deals d on d.id=e.deal_id join partners p on p.id=d.partner_id join assets a on a.id=e.asset_id left join x on x.entitlement_id=e.id cross join s
where d.stage in ('contracted','ended');

-- What each asset can sell this season, what is sold on signed deals, what is in the pipeline, and what is left.
create view inventory as
with s as (select * from settings where id=1),
sold as (select e.asset_id, sum(e.quantity) filter (where d.stage='contracted')::int as sold, sum(e.quantity) filter (where d.stage in ('proposal','negotiating','verbal'))::int as pipeline,
  string_agg(distinct p.name, ', ') filter (where d.stage='contracted') as partners
 from entitlements e join deals d on d.id=e.deal_id join partners p on p.id=d.partner_id cross join s
 where d.start_on<=coalesce(s.season_end,d.start_on) and d.end_on>=coalesce(s.season_start,d.end_on) group by e.asset_id)
select a.id, a.name, a.kind, a.location, a.unit, a.audience, a.quantity_available as available, coalesce(sold.sold,0) as sold, coalesce(sold.pipeline,0) as pipeline,
 a.quantity_available-coalesce(sold.sold,0) as unsold, a.rate::float8 as rate, (greatest(a.quantity_available-coalesce(sold.sold,0),0)*coalesce(a.rate,0))::float8 as unsold_value, sold.partners
from assets a left join sold on sold.asset_id=a.id where a.status='active';

-- Signed deals near their end with no renewal decision.
create view renewals as
select d.id, d.name, d.partner, d.owner, d.end_on, d.days_to_end, d.total, d.currency, d.renewal_status,
 case when d.promised=0 then null else round(100.0*d.delivered/d.promised)::int end as delivered_pct,
 (select max(n.created_at)::date from notes n where n.entity='deals' and n.record_id=d.id) as last_note
from deal_summary d where d.stage='contracted' and d.renewal_status in ('not-started','talking')
 and d.end_on<=current_date+(select renewal_lead_days from settings);

create view pipeline as
select d.id, d.name, d.partner, d.owner, d.stage, d.start_on, d.total, d.currency, d.probability,
 round(d.total*coalesce(d.probability,case d.stage when 'prospect' then 10 when 'proposal' then 25 when 'negotiating' then 50 when 'verbal' then 80 end)/100.0)::float8 as weighted,
 (select max(n.created_at)::date from notes n where n.entity='deals' and n.record_id=d.id) as last_note
from deal_summary d where d.stage in ('prospect','proposal','negotiating','verbal');

create view invoice_status as
select i.id, i.name, d.name as deal, p.name as partner, i.kind, i.amount::float8 as amount, d.currency, i.due_on, i.issued_on, i.paid_on,
 case when i.status in ('paid','void') then i.status when i.due_on<current_date then 'overdue' when i.due_on<=current_date+14 then 'due soon' else i.status end as state,
 case when i.status not in ('paid','void') and i.due_on<current_date then current_date-i.due_on end as days_overdue
from invoices i join deals d on d.id=i.deal_id join partners p on p.id=d.partner_id;

-- Value delivered at rate card against what the partner pays. Over 1 means the partner got more than they paid for.
create view partner_value as
select d.id, d.name as deal, d.partner, d.currency, d.total as paid_value,
 (select coalesce(sum(es.delivered*es.unit_value),0)::float8 from entitlement_status es where es.deal_id=d.id) as delivered_value,
 (select coalesce(sum(es.promised*es.unit_value),0)::float8 from entitlement_status es where es.deal_id=d.id) as promised_value,
 (select coalesce(sum(x.reach),0)::int from deliveries x join entitlements e on e.id=x.entitlement_id where e.deal_id=d.id) as reach,
 case when d.total>0 then round(((select coalesce(sum(es.promised*es.unit_value),0) from entitlement_status es where es.deal_id=d.id)/d.total)::numeric,2)::float8 end as value_ratio
from deal_summary d where d.stage in ('contracted','ended');

-- Two signed deals that overlap in time where one holds category exclusivity and the other partner sits in that category.
create view category_clashes as
select a.name as exclusive_deal, a.partner as exclusive_partner, a.exclusive_category as category, b.name as clashing_deal, b.partner as clashing_partner,
 greatest(a.start_on,b.start_on) as overlap_from, least(a.end_on,b.end_on) as overlap_to
from deal_summary a join deal_summary b on b.id<>a.id and lower(b.category)=lower(a.exclusive_category) and b.partner<>a.partner
where a.stage='contracted' and b.stage in ('contracted','verbal','negotiating','proposal') and a.exclusive_category is not null
 and b.start_on<=a.end_on and b.end_on>=a.start_on;

-- What has to go out at an event: per-event entitlements on deals live that day, with what is left to deliver.
create view event_deliverables as
select ev.id as event_id, ev.name as event, ev.held_on, ev.venue, ev.audience, es.id as entitlement_id, es.partner, es.deal, es.asset, es.kind, es.remaining,
 exists(select 1 from deliveries x where x.entitlement_id=es.id and x.event_id=ev.id) as recorded
from events ev join entitlement_status es on es.unit='per-event' and ev.held_on between es.start_on and es.end_on
 join assets a on a.name=es.asset and (a.location is null or ev.venue is null or lower(a.location)=lower(ev.venue))
where ev.status<>'cancelled';

create view compliance_findings as
with s as (select * from settings where id=1)
select 'NZ-SFERPA-S29' as rule, d.name as record, d.partner as area, 'Partner category '||d.category||' is prohibited from sponsoring an organised activity' as finding
 from deal_summary d cross join s where d.stage not in ('lost','ended') and lower(d.category)=any(string_to_array(lower(replace(s.prohibited_categories,' ','')),','))
union all select 'ADULT-ONLY-ON-JUNIOR', es.deal, es.partner, es.asset||' reaches a junior audience; '||p.category||' sponsorship must target adults'
 from entitlement_status es join deals d on d.id=es.deal_id join partners p on p.id=d.partner_id join assets a on a.name=es.asset cross join s
 where a.audience='junior' and es.end_on>=current_date and lower(p.category)=any(string_to_array(lower(replace(s.adult_only_categories,' ','')),','))
union all select 'ADULT-ONLY-AT-JUNIOR-EVENT', ed.deal, ed.event, ed.asset||' is due at a junior event on '||ed.held_on
 from event_deliverables ed join deals d on d.name=ed.deal join partners p on p.id=d.partner_id cross join s
 where ed.audience='junior' and ed.held_on>=current_date and lower(p.category)=any(string_to_array(lower(replace(s.adult_only_categories,' ','')),','))
union all select 'GST-CONTRA', d.name, d.partner, 'Contra worth '||d.contra::numeric(12,2)||' '||d.currency||' with no contra invoice recorded'
 from deal_summary d where d.stage='contracted' and d.contra>0 and not exists(select 1 from invoices i where i.deal_id=d.id and i.kind='contra' and i.status<>'void')
union all select 'NOT-A-GIFT', d.name, d.partner, 'Sponsorship receipted as a donation: the partner receives a benefit in return'
 from deal_summary d join deals x on x.id=d.id where x.receipted_as_donation and d.stage in ('contracted','ended')
union all select 'PROOF-NEEDS-EVIDENCE', es.deal, es.asset, 'Delivery on '||x.delivered_on||' claims a reach of '||x.reach||' with no evidence recorded'
 from deliveries x join entitlement_status es on es.id=x.entitlement_id where x.reach is not null and nullif(trim(coalesce(x.evidence,'')),'') is null
union all select 'LOCAL-UNSIGNED', d.name, d.partner, 'Delivering before the agreement is signed'
 from deal_summary d where d.signed_on is null and d.delivered>0
union all select 'LOCAL-EXCLUSIVITY', c.clashing_deal, c.category, c.exclusive_partner||' holds '||c.category||' exclusivity from '||c.overlap_from||' to '||c.overlap_to from category_clashes c
union all select 'LOCAL-OVERSOLD', i.name, i.kind, 'Sold '||i.sold||' of '||i.available||' available this season' from inventory i where i.sold>i.available
union all select 'LOCAL-FULFILMENT', es.deal, es.asset, es.state||': '||es.delivered||' of '||es.promised||' delivered, '||es.elapsed_pct||'% of the term gone'
 from entitlement_status es where es.state in ('behind','past its due date','owed after the deal ended')
union all select 'LOCAL-PROOF-REPORT', d.name, d.partner, 'Ended '||d.end_on||'; proof of performance was due by '||(d.end_on+s.proof_report_days)||case when d.end_on+s.proof_report_days<current_date then ' (passed)' else '' end
 from deal_summary d join deals x on x.id=d.id cross join s where d.end_on<current_date and d.stage in ('contracted','ended') and x.proof_sent_on is null;
