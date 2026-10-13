# Sponsorship for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR BUSINESS]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [the one or two outcomes you care about]

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| Find what needs attention: rule findings, partners owed, renewals not started, overdue invoices and tasks, quiet partners and events coming up | /attention |
| Check the records against the sponsorship rules (prohibited categories, adult-only categories on junior assets, contra and GST, sponsorship receipted as a donation, proof of performance claims) and your own rules, with sources | /compliance |
| Draft the Monday partnerships review | /weekly-review |
| Show every asset this season: available, sold on signed deals, in the pipeline, unsold and its value at rate card | /inventory |
| List the inventory still for sale this season, highest rate card value first | /unsold |
| Show every entitlement on signed deals against the clock: promised, delivered, and how far through the term we are | /fulfilment |
| List what partners are owed: entitlements behind, past their due date, or owed after the deal ended | /behind |
| List what has to go out at one event: every per-event entitlement live that day, and whether it has been recorded | /match-day |
| Record one delivery for every per-event entitlement still owed at an event, after it is held | /deliver-event |
| Record a delivery against a deal: a post, a ticket allocation, a signage install, a hospitality box | /deliver |
| List signed deals ending inside the renewal window with no renewal decision | /renewals |
| Draft the renewal conversation for a deal: what was promised, what went out, and the value at rate card | /draft-renewal |
| Start the next term: a new proposal deal with the same partner and entitlements, and the old deal marked talking | /renew |
| Read open deals by stage with weighted value | /pipeline |
| Draft a proposal outline for a partner from the inventory still available, with the category checks done first | /draft-proposal |
| Record a signed agreement: the deal becomes contracted and the partner active | /sign |
| Draft the proof of performance report for a partner: what was promised, what went out, reach, evidence and value | /draft-proof |
| Record that the proof of performance report went to the partner | /proof-sent |
| Show value delivered at rate card against what each partner pays | /partner-value |
| List category exclusivity clashes: a partner holding a category and another deal in that category overlapping its term | /clashes |
| List contra (value in kind) on signed deals and how much has been invoiced | /contra |
| List invoices not yet paid: overdue first, then due soon | /invoices |
| List events in the next 30 days and how many deliverables each has | /upcoming |
| List open tasks, overdue first | /tasks |
| Read partners with category, status and signed deals | /partners |
| Read every deal with stage, term, value, promised and delivered counts, invoiced and paid | /deals |
| Read the asset list with kind, unit, quantity and rate card | /assets |
| Read the event calendar | /events |
| Read one record with its history and notes: a deal with entitlements and invoices, a partner with deals, an event with its deliverables | /show |
| Add a partner, asset, deal, entitlement, event, delivery, invoice or task | /add |
| Update a record with a version check | /update |
| Add a note to any record | /log |
| Bring assets, agreements and fulfilment across from KORE report exports | /import |
| Export every record, note and change | /export |
| Read every recorded change and who made it | /history |
| Read the rules the checks use: season dates, renewal window, fulfilment tolerance, proof report days, quiet days, category lists | /settings |
| Read the CLI commands and editable fields | /help |
| Make this system yours in plain language. Add a field, rename stages, change a rule, add a column to a document. Writes the migration, applies it, updates the commands that touch it | /customise |
| Add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the operator's brand by `npm run view` | /new-view |

If an ask fits nothing here, run the CLI directly (`npm run sponsorship -- help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off KORE Software.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/kore

## Sponsorship rules

- Read `docs/compliance.md` before explaining a finding. A finding is a reminder to look, not a ruling. Never tell the operator a partner or an advertisement is lawful: they and their adviser decide that.
- Never record a delivery that did not happen, or a reach figure without asking where the evidence lives. A proof of performance report claims only what the records show.
- Never mark a deal signed until the operator says the agreement is signed. Never invent a stage, a date, an amount or a probability.
- Partner-facing output (proposals, renewal letters, proof of performance reports, statements) is drafted to `drafts/` or rendered by `npm run docs`. A person reads it and sends it.
- Contra and donation receipts: show the finding and the source. The operator's accountant decides the value and the treatment.
- Use `--actor` for writes and `--expected-version` for updates. Never run tests against real records.
