-- Fictional demo records for Northern Harbour Rugby, a provincial union with a home ground (Harbour Park) and a junior grade. NZD. Dates move with today.
-- Deliberate problems: a beer brand on the junior jersey and on the big screen at the junior festival, a vape shop in the pipeline,
-- a credit union pitched into a bank's exclusive category, a jersey sleeve sold three times when there are two, contra with no invoice,
-- a sponsorship receipted as a donation, signage up before the agreement is signed, a partner behind on social posts, an overdue invoice,
-- a deal that ended with posts still owed and no proof of performance sent, a reach figure with no evidence, and renewals coming due.
begin;
select set_config('app.actor','Demo seed',true);
update settings set season_start=current_date-200, season_end=current_date+165 where id=1 and season_start is distinct from current_date-200;

insert into partners(id,name,owner,category,contact_name,contact_email,status) values
('10000000-0000-0000-0000-000000000001','Coastline Bank','Aroha','banking','Michelle Tan','michelle.tan@coastline.example','active'),
('10000000-0000-0000-0000-000000000002','Kiwi Lager Co','Aroha','alcohol','Dean Walsh','dean@kiwilager.example','active'),
('10000000-0000-0000-0000-000000000003','Harbour Motors','Sam','automotive','Priya Shah','priya@harbourmotors.example','active'),
('10000000-0000-0000-0000-000000000004','Fresh Fields Supermarket','Sam','grocery','Tom Reid','tom.reid@freshfields.example','active'),
('10000000-0000-0000-0000-000000000005','Tasman Credit Union','Aroha','banking','Lena Ford','lena@tasmancu.example','prospect'),
('10000000-0000-0000-0000-000000000006','Vapour Lounge','Sam','vaping','Jay Kim','jay@vapourlounge.example','prospect'),
('10000000-0000-0000-0000-000000000007','Pacific Energy','Aroha','energy','Grant Hughes','grant@pacificenergy.example','lapsed'),
('10000000-0000-0000-0000-000000000008','Summit Insurance','Aroha','insurance','Nina Patel','nina@summitins.example','prospect'),
('10000000-0000-0000-0000-000000000009','Ridgeway Physio','Sam','health','Mark Ellis','mark@ridgewayphysio.example','active'),
('10000000-0000-0000-0000-000000000010','Northern Fuel','Aroha','fuel','Kate Moana','kate@northernfuel.example','prospect') on conflict(id) do nothing;

insert into assets(id,name,owner,kind,location,unit,quantity_available,rate,audience) values
('20000000-0000-0000-0000-000000000001','Ground naming rights','Aroha','naming-rights','Harbour Park','per-season',1,180000,'mixed'),
('20000000-0000-0000-0000-000000000002','Perimeter signage panel','Sam','signage','Harbour Park','per-season',12,6000,'mixed'),
('20000000-0000-0000-0000-000000000003','Big screen advert','Sam','digital','Harbour Park','per-event',40,800,'mixed'),
('20000000-0000-0000-0000-000000000004','Senior jersey front','Aroha','apparel',null,'per-season',1,60000,'adult'),
('20000000-0000-0000-0000-000000000005','Senior jersey sleeve','Aroha','apparel',null,'per-season',2,15000,'adult'),
('20000000-0000-0000-0000-000000000006','Junior grade jersey sleeve','Sam','apparel',null,'per-season',1,5000,'junior'),
('20000000-0000-0000-0000-000000000007','Corporate box','Sam','hospitality','Harbour Park','per-event',10,2500,'adult'),
('20000000-0000-0000-0000-000000000008','Social media post','Sam','social',null,'per-item',100,400,'mixed'),
('20000000-0000-0000-0000-000000000009','Season ticket','Sam','tickets','Harbour Park','per-item',200,180,'mixed'),
('20000000-0000-0000-0000-000000000010','Junior holiday clinic naming','Sam','experiential',null,'per-season',1,8000,'junior'),
('20000000-0000-0000-0000-000000000011','Match programme half page','Sam','print','Harbour Park','per-event',40,500,'mixed') on conflict(id) do nothing;

insert into events(id,name,owner,held_on,venue,audience,attendance,broadcast,status) values
('40000000-0000-0000-0000-000000000001','Round 1 v Southland','Sam',current_date-168,'Harbour Park','mixed',6200,true,'held'),
('40000000-0000-0000-0000-000000000002','Round 3 v Otago','Sam',current_date-140,'Harbour Park','mixed',5400,false,'held'),
('40000000-0000-0000-0000-000000000003','Round 5 v Taranaki','Sam',current_date-112,'Harbour Park','mixed',4800,false,'held'),
('40000000-0000-0000-0000-000000000004','Round 7 v Waikato','Sam',current_date-84,'Harbour Park','mixed',7100,true,'held'),
('40000000-0000-0000-0000-000000000005','Round 9 v Canterbury','Sam',current_date-56,'Harbour Park','mixed',8300,true,'held'),
('40000000-0000-0000-0000-000000000006','Round 11 v Hawke''s Bay','Sam',current_date-28,'Harbour Park','mixed',6900,false,'held'),
('40000000-0000-0000-0000-000000000007','Quarter-final','Sam',current_date+4,'Harbour Park','mixed',null,true,'scheduled'),
('40000000-0000-0000-0000-000000000008','Junior Festival Day','Sam',current_date+11,'Harbour Park','junior',null,false,'scheduled'),
('40000000-0000-0000-0000-000000000009','Semi-final','Sam',current_date+18,'Harbour Park','mixed',null,true,'scheduled') on conflict(id) do nothing;

insert into deals(id,name,owner,partner_id,stage,start_on,end_on,signed_on,cash_value,contra_value,contra_description,probability,exclusive_category,receipted_as_donation,renewal_status,proof_sent_on) values
('30000000-0000-0000-0000-000000000001','Coastline Bank naming rights','Aroha','10000000-0000-0000-0000-000000000001','contracted',current_date-200,current_date+60,current_date-230,180000,0,null,null,'banking',false,'not-started',null),
('30000000-0000-0000-0000-000000000002','Kiwi Lager Co pouring and signage','Aroha','10000000-0000-0000-0000-000000000002','contracted',current_date-200,current_date+60,current_date-210,45000,0,null,null,null,false,'talking',null),
('30000000-0000-0000-0000-000000000003','Harbour Motors vehicle partner','Sam','10000000-0000-0000-0000-000000000003','contracted',current_date-200,current_date+165,current_date-205,20000,30000,'Two club vehicles for the season, at the dealer''s retail lease rate',null,null,false,'not-started',null),
('30000000-0000-0000-0000-000000000004','Fresh Fields community partner','Sam','10000000-0000-0000-0000-000000000004','contracted',current_date-200,current_date+165,current_date-215,35000,0,null,null,null,false,'not-started',null),
('30000000-0000-0000-0000-000000000005','Tasman Credit Union junior programme','Aroha','10000000-0000-0000-0000-000000000005','negotiating',current_date-30,current_date+300,null,25000,0,null,50,null,false,'not-started',null),
('30000000-0000-0000-0000-000000000006','Vapour Lounge match day','Sam','10000000-0000-0000-0000-000000000006','prospect',current_date+100,current_date+465,null,15000,0,null,null,null,false,'not-started',null),
('30000000-0000-0000-0000-000000000007','Pacific Energy community partner','Aroha','10000000-0000-0000-0000-000000000007','contracted',current_date-380,current_date-45,current_date-390,30000,0,null,null,null,false,'not-renewing',null),
('30000000-0000-0000-0000-000000000008','Summit Insurance signage','Aroha','10000000-0000-0000-0000-000000000008','verbal',current_date-20,current_date+345,null,22000,0,null,80,null,false,'not-started',null),
('30000000-0000-0000-0000-000000000009','Ridgeway Physio programme partner','Sam','10000000-0000-0000-0000-000000000009','contracted',current_date-190,current_date+40,current_date-190,6000,0,null,null,null,true,'talking',null),
('30000000-0000-0000-0000-000000000010','Northern Fuel jersey front','Aroha','10000000-0000-0000-0000-000000000010','proposal',current_date+165,current_date+530,null,60000,0,null,25,null,false,'not-started',null) on conflict(id) do nothing;

insert into entitlements(id,deal_id,asset_id,quantity,unit_value,due_on) values
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,null,null),
('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',8,null,null),
('50000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000007',8,null,null),
('50000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000008',20,null,null),
('50000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000009',40,null,current_date-190),
('50000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',4,null,null),
('50000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000005',1,null,null),
('50000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000006',1,null,null),
('50000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003',8,null,null),
('50000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',2,null,null),
('50000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000005',1,null,null),
('50000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000008',20,null,null),
('50000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000011',8,null,null),
('50000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002',3,null,null),
('50000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000005',1,null,null),
('50000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000010',1,null,null),
('50000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000008',15,null,null),
('50000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000010',1,null,null),
('50000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000003',8,null,null),
('50000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000002',2,null,null),
('50000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000008',12,null,null),
('50000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002',1,null,null),
('50000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000011',8,null,null),
('50000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000004',1,null,null) on conflict(id) do nothing;

-- What went out. Per-event items follow the held matches in order; everything else is spread across the term.
insert into deliveries(id,entitlement_id,event_id,delivered_on,quantity,reach,evidence,recorded_by)
select md5('nhr-'||v.e||'-'||g.i)::uuid, v.e::uuid, ev.id, coalesce(ev.held_on,current_date+v.base+(g.i-1)*v.step), 1,
 case when v.reach>0 then v.reach end, case when ev.id is not null then 'Drive/Partners/Match photos/'||ev.name else 'Drive/Partners/Proof/'||v.e||'-'||g.i end, 'Demo seed'
from (values
 ('50000000-0000-0000-0000-000000000001',1,false,-198,0,0),('50000000-0000-0000-0000-000000000002',6,true,0,0,0),('50000000-0000-0000-0000-000000000003',6,true,0,0,0),
 ('50000000-0000-0000-0000-000000000004',8,false,-190,20,9000),('50000000-0000-0000-0000-000000000005',40,false,-192,0,0),
 ('50000000-0000-0000-0000-000000000006',4,false,-196,0,0),('50000000-0000-0000-0000-000000000007',1,false,-196,0,0),('50000000-0000-0000-0000-000000000008',1,false,-196,0,0),('50000000-0000-0000-0000-000000000009',6,true,0,0,0),
 ('50000000-0000-0000-0000-000000000010',2,false,-196,0,0),('50000000-0000-0000-0000-000000000011',1,false,-196,0,0),('50000000-0000-0000-0000-000000000012',4,false,-185,30,4000),('50000000-0000-0000-0000-000000000013',2,true,0,0,0),
 ('50000000-0000-0000-0000-000000000014',3,false,-196,0,0),('50000000-0000-0000-0000-000000000015',1,false,-196,0,0),('50000000-0000-0000-0000-000000000016',1,false,-120,0,0),('50000000-0000-0000-0000-000000000017',11,false,-180,12,6500),
 ('50000000-0000-0000-0000-000000000020',2,false,-375,0,0),('50000000-0000-0000-0000-000000000021',9,false,-370,30,3000),
 ('50000000-0000-0000-0000-000000000022',1,false,-15,0,0),('50000000-0000-0000-0000-000000000023',6,true,0,0,0)
) v(e,n,at_event,base,step,reach)
cross join lateral generate_series(1,v.n) g(i)
left join lateral (select id,held_on,name from events where v.at_event and status='held' order by held_on offset g.i-1 limit 1) ev on true
on conflict(id) do nothing;
insert into deliveries(id,entitlement_id,event_id,delivered_on,quantity,reach,evidence,notes,recorded_by) values
('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004',null,current_date-6,1,12000,null,'Reach from the partner''s own count, not ours','Demo seed') on conflict(id) do nothing;

insert into invoices(id,name,owner,deal_id,kind,amount,due_on,issued_on,paid_on,status) values
('70000000-0000-0000-0000-000000000001','INV-1001','Aroha','30000000-0000-0000-0000-000000000001','cash',90000,current_date-190,current_date-220,current_date-185,'paid'),
('70000000-0000-0000-0000-000000000002','INV-1002','Aroha','30000000-0000-0000-0000-000000000001','cash',90000,current_date+10,current_date-10,null,'issued'),
('70000000-0000-0000-0000-000000000003','INV-1003','Aroha','30000000-0000-0000-0000-000000000002','cash',45000,current_date-180,current_date-205,current_date-170,'paid'),
('70000000-0000-0000-0000-000000000004','INV-1004','Sam','30000000-0000-0000-0000-000000000003','cash',20000,current_date-170,current_date-200,current_date-160,'paid'),
('70000000-0000-0000-0000-000000000005','INV-1005','Sam','30000000-0000-0000-0000-000000000004','cash',17500,current_date-180,current_date-210,current_date-178,'paid'),
('70000000-0000-0000-0000-000000000006','INV-1006','Sam','30000000-0000-0000-0000-000000000004','cash',17500,current_date-20,current_date-50,null,'issued'),
('70000000-0000-0000-0000-000000000007','INV-0990','Aroha','30000000-0000-0000-0000-000000000007','cash',30000,current_date-360,current_date-385,current_date-350,'paid'),
('70000000-0000-0000-0000-000000000008','INV-1007','Sam','30000000-0000-0000-0000-000000000009','cash',6000,current_date-160,current_date-185,current_date-150,'paid') on conflict(id) do nothing;

insert into tasks(id,name,owner,deal_id,due_on,done_on,status) values
('80000000-0000-0000-0000-000000000001','Coastline Bank renewal pitch with this season''s numbers','Aroha','30000000-0000-0000-0000-000000000001',current_date+7,null,'open'),
('80000000-0000-0000-0000-000000000002','Harbour Motors social post calendar for the rest of the term','Sam','30000000-0000-0000-0000-000000000003',current_date-5,null,'open'),
('80000000-0000-0000-0000-000000000003','Fresh Fields finals signage artwork','Sam','30000000-0000-0000-0000-000000000004',current_date-30,current_date-32,'done'),
('80000000-0000-0000-0000-000000000004','Summit Insurance agreement back signed','Aroha','30000000-0000-0000-0000-000000000008',current_date-3,null,'open') on conflict(id) do nothing;

insert into notes(id,entity,record_id,body,actor,created_at) values
('90000000-0000-0000-0000-000000000001','deals','30000000-0000-0000-0000-000000000002','Dean keen to renew if the pourage numbers hold through the finals.','Aroha',now()-interval '12 days'),
('90000000-0000-0000-0000-000000000002','deals','30000000-0000-0000-0000-000000000005','Lena wants the junior programme for three seasons. Check the bank''s exclusivity first.','Aroha',now()-interval '9 days'),
('90000000-0000-0000-0000-000000000003','deals','30000000-0000-0000-0000-000000000008','Signage went up for the last home game while the lawyers finish the agreement.','Aroha',now()-interval '15 days') on conflict(id) do nothing;
commit;
