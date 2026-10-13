<h1 align="center">Sponsorship for Claude Code</h1>

<p align="center">
  <strong>The open-source sponsorship system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your KORE Software data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=kore">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/kore?utm_source=github&utm_medium=readme&utm_campaign=kore">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-kore-software">Instead of KORE Software</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Sponsorship for Claude Code does the job you pay KORE Software for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and you can add a new question whenever a partner or your board asks one.

KORE publishes no prices. It sells Sponsorship, Activate (fulfilment) and Evaluate (reporting) as separate modules installed inside the CRM you already pay for, and quotes each case by case: G2 and FitGap both list its pricing as contact the vendor (checked 13 October 2026). The CRM seats underneath are a second bill.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=kore).

Built for the partnerships manager at a sports body, stadium, venue, festival, event or charity that sells sponsorship packages: the person who sells the signage, counts the posts, books the corporate boxes and writes the end-of-season report. It holds partners, the inventory of assets you sell with the rate card, deals and what each one entitles the partner to, the events you deliver at, every delivery with its evidence and reach, invoices (cash and contra) and tasks. It checks the records against the tobacco and vaping sponsorship bans, the alcohol rules for junior audiences, GST on contra, sponsorship receipted as a donation and unbacked reach claims. It does not sell tickets to the public or run a partner portal; Enterprise DNA builds those into your version if you want them.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/sponsorship-for-claude-code.git
cd sponsorship-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type a slash command. Start with /attention, then /fulfilment and /match-day Quarter-final. For real records, choose an empty `DATA_DIR` and run `npm run migrate` without the fictional seed.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

| Command | What it does |
|---|---|
| /attention | Find what needs attention: rule findings, partners owed, renewals not started, overdue invoices and tasks, quiet partners and events coming up |
| /compliance | Check the records against the sponsorship rules (prohibited categories, adult-only categories on junior assets, contra and GST, sponsorship receipted as a donation, proof of performance claims) and your own rules, with sources |
| /weekly-review | Draft the Monday partnerships review |
| /inventory | Show every asset this season: available, sold on signed deals, in the pipeline, unsold and its value at rate card |
| /unsold | List the inventory still for sale this season, highest rate card value first |
| /fulfilment | Show every entitlement on signed deals against the clock: promised, delivered, and how far through the term we are |
| /behind | List what partners are owed: entitlements behind, past their due date, or owed after the deal ended |
| /match-day | List what has to go out at one event: every per-event entitlement live that day, and whether it has been recorded |
| /deliver-event | Record one delivery for every per-event entitlement still owed at an event, after it is held |
| /deliver | Record a delivery against a deal: a post, a ticket allocation, a signage install, a hospitality box |
| /renewals | List signed deals ending inside the renewal window with no renewal decision |
| /draft-renewal | Draft the renewal conversation for a deal: what was promised, what went out, and the value at rate card |
| /renew | Start the next term: a new proposal deal with the same partner and entitlements, and the old deal marked talking |
| /pipeline | Read open deals by stage with weighted value |
| /draft-proposal | Draft a proposal outline for a partner from the inventory still available, with the category checks done first |
| /sign | Record a signed agreement: the deal becomes contracted and the partner active |
| /draft-proof | Draft the proof of performance report for a partner: what was promised, what went out, reach, evidence and value |
| /proof-sent | Record that the proof of performance report went to the partner |
| /partner-value | Show value delivered at rate card against what each partner pays |
| /clashes | List category exclusivity clashes: a partner holding a category and another deal in that category overlapping its term |
| /contra | List contra (value in kind) on signed deals and how much has been invoiced |
| /invoices | List invoices not yet paid: overdue first, then due soon |
| /upcoming | List events in the next 30 days and how many deliverables each has |
| /tasks | List open tasks, overdue first |
| /partners | Read partners with category, status and signed deals |
| /deals | Read every deal with stage, term, value, promised and delivered counts, invoiced and paid |
| /assets | Read the asset list with kind, unit, quantity and rate card |
| /events | Read the event calendar |
| /show | Read one record with its history and notes: a deal with entitlements and invoices, a partner with deals, an event with its deliverables |
| /add | Add a partner, asset, deal, entitlement, event, delivery, invoice or task |
| /update | Update a record with a version check |
| /log | Add a note to any record |
| /import | Bring assets, agreements and fulfilment across from KORE report exports |
| /export | Export every record, note and change |
| /history | Read every recorded change and who made it |
| /settings | Read the rules the checks use: season dates, renewal window, fulfilment tolerance, proof report days, quiet days, category lists |
| /help | Read the CLI commands and editable fields |
| /customise | Make this system yours in plain language. Add a field, rename stages, change a rule, add a column to a document. Writes the migration, applies it, updates the commands that touch it |
| /new-view | Add a read-only HTML view (a dashboard page) from a plain-language description, rendered in the operator's brand by `npm run view` |

## Instead of KORE Software

KORE runs inside your CRM, so your records come out as CRM report exports. Three one-command imports, in order: `npm run sponsorship -- import kore-assets --file=assets.csv --actor=You --dry-run`, then again without `--dry-run`; then `import kore-deals --file=agreements.csv` (partners are created from the account name); then `import kore-fulfilment --file=fulfilment.csv` (contracted and fulfilled quantities). Rehearse first, compare counts, then load. Renamed headings go through `examples/mapping.json`. [Switching guide](docs/replace-kore.md).

## Architecture

```
sponsorship-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Sponsorship for Claude Code for your business, migrates your KORE Software data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=kore)
- Read more: [enterprisedna.co/omni/instead-of/kore](https://enterprisedna.co/omni/instead-of/kore?utm_source=github&utm_medium=readme&utm_campaign=kore)

## License

MIT. Copyright (c) 2026 Enterprise DNA.

## How the checks work

Fulfilment runs against the clock. Each entitlement compares the share delivered with the share of the deal's term already gone: more than 15 points behind (settings) is behind; anything still owed after its due date or after the deal ended is flagged. Inventory counts what signed deals overlapping the season have taken from each asset, what the pipeline would take, and what is left at rate card. Category rules read the partner's category against two lists in settings: prohibited (tobacco, vaping) and adult-only (alcohol, gambling), checked against each asset's and each event's audience. [Rules and sources](docs/compliance.md).

Every write needs `--actor`, updates need `--expected-version`, and every change lands in the audit log. Names match case insensitively, partner contact emails and id prefixes work, and ambiguous matches list the candidates and exit 1.

## Reports and paperwork

`npm run view` renders the week (partners owed, events coming up, invoices, rule checks) and the commercial picture (inventory sell-through, renewals, pipeline, value delivered against value paid). `npm run docs` renders a proof of performance report for every deal with deliveries, a partner statement of invoices, a match day partner run sheet for each event in the next 30 days, and a partnership opportunities list from unsold inventory. Edit `brand.json` for your name, logo and colours. Drafts never send.

## Ten questions to ask of your partnerships

Each one is answered by the free version today.

1. What inventory is still unsold this season, and what is it worth at rate card? `unsold`
2. Which partners are behind on what we promised, measured against how far through the deal we are? `behind`
3. What has to go out at Saturday's match, partner by partner? `match-day`
4. Which deals end in the next four months with no renewal conversation started? `renewals`
5. Which partners have had less value than they paid for so far? `partner-value`
6. Which assets have we sold more times than we have? `inventory`
7. Where does an alcohol or gambling partner appear on a junior asset or at a junior event? `compliance`
8. Which contra deals have no invoice recorded for GST? `contra`
9. Who has gone quiet: a live partner with no delivery and no contact in a month? `attention`
10. Would pitching this prospect break another partner's category exclusivity? `draft-proposal`

## Your first hour: ten things to ask for

1. Put our name and logo in brand.json.
2. Set our season dates in settings.
3. Rehearse our KORE asset export, then load it.
4. Load our agreements and fulfilment from KORE.
5. Add this season's fixtures and mark the junior ones.
6. Show me which partners are behind.
7. Give me the run sheet for Saturday.
8. Draft the proof of performance report for our naming rights partner.
9. Draft our Monday partnerships review.
10. Add an activation budget field to deals with /customise.

## Verification

`npm test` creates a temporary database, exercises every CLI command, and checks inventory counts, fulfilment against the clock, renewals, the weighted pipeline, value at rate card, the category rules, contra, donation receipts, reach claims, signing, delivery, match day recording, renewal, transactional imports, unchanged re-imports, version conflicts, audit attribution and escaped reports. Windows and Linux CI run Node 20 and 22, and a separate Postgres 17 job runs the same tests. `TEST_DATABASE_URL` must point to an empty disposable database.
