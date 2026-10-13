# Moving off KORE Software

KORE sells Sponsorship, Activate and Evaluate as modules installed inside the CRM you already run, usually Salesforce or Microsoft Dynamics. That means your sponsorship records come out the way any CRM records do: as report exports to CSV. Three exports cover the move.

## 1. Export from your CRM

Build three reports in the CRM KORE runs inside and export each to CSV:

| Export | One row per | Headings the importer reads |
|---|---|---|
| Assets | inventory item | Asset Name, Asset Type, Location, Unit of Measure, Quantity Available, Rate Card, Audience |
| Agreements | sponsorship agreement | Agreement ID, Agreement Name, Account Name, Industry, Owner, Stage, Start Date, End Date, Signed Date, Cash Value, Trade Value |
| Fulfilment | asset on an agreement | Agreement Name, Asset Name, Contracted Quantity, Fulfilled Quantity, Rate |

Common alternative headings are understood (Inventory Item, Deal Name, Opportunity Name, Value in Kind, Quantity Fulfilled and more: see `IMPORTS` in `scripts/sponsorship.mjs`). If your report uses other headings, copy `examples/mapping.json`, point each field at your heading, and pass `--mapping=<file>`. The files in `examples/` show the shape.

## 2. Rehearse, then load

Order matters: assets, then agreements (which create partners from the account name), then fulfilment (which needs both).

```bash
npm run sponsorship -- import kore-assets --file=assets.csv --actor="Your Name" --dry-run
npm run sponsorship -- import kore-assets --file=assets.csv --actor="Your Name"
npm run sponsorship -- import kore-deals --file=agreements.csv --currency=NZD --actor="Your Name" --dry-run
npm run sponsorship -- import kore-deals --file=agreements.csv --currency=NZD --actor="Your Name"
npm run sponsorship -- import kore-fulfilment --file=fulfilment.csv --delivered-on=2026-09-30 --actor="Your Name"
```

- `--dry-run` runs the whole import inside a transaction and rolls it back. Compare the counts with your CRM before the real run.
- Dates written DD/MM/YYYY need `--day-first`. ISO dates need nothing.
- Re-running an import is safe: unchanged rows are skipped. A row that changed stops the import until you compare it and add `--update-existing`.
- A whole file loads or nothing does.

## What maps

| KORE | Here |
|---|---|
| Inventory items and rate card | `assets` (kind and unit read from the words in the export) |
| Accounts | `partners` (category from Industry) |
| Agreements, stages, terms, cash and trade values | `deals` (Closed Won becomes contracted, Negotiation becomes negotiating, Closed Lost becomes lost) |
| Assets on each agreement | `entitlements` |
| Fulfilled quantity | one `deliveries` row per entitlement for the count fulfilled so far, dated `--delivered-on` |

## What does not carry over

- **Fulfilment history line by line.** The export gives a fulfilled count, so the history before the move is one line per entitlement. Every delivery after the move is its own dated line with its evidence.
- **Proof of performance photos and files.** They stay where they are (your drive, your CRM files). Record where each one lives in the `evidence` field when you need it on a report.
- **Partner portals and Tableau connections.** KORE can give partners their own view. Here the proof of performance report is a branded document you send (`npm run docs`). A partner portal is a customisation Enterprise DNA builds.
- **Ticketing and hospitality sales.** KORE sells ticketing separately. This system records tickets and boxes that belong to a sponsorship, not ticket sales to the public.

## After the move

1. Set the season dates: `npm run sponsorship -- update settings --season-start=YYYY-MM-DD --season-end=YYYY-MM-DD --expected-version=1 --actor="Your Name"`.
2. Mark each asset's `audience` and each event's `audience`. The alcohol and junior checks depend on them.
3. Add your event calendar (`add events`), then run /attention and /compliance.

Want it done for you, including the CRM reports? https://enterprisedna.co/omni/instead-of/kore
