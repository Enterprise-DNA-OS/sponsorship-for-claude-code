---
description: Add a partner, asset, deal, entitlement, event, delivery, invoice or task.
---

Read CLAUDE.md. Run npm run sponsorship -- add <entity> --field=value --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date, an amount or a delivery that is not in the records.

Run help for the fields of each entity. An entitlement is the line of a deal: --deal-id=<deal> --asset-id=<asset> --quantity=N. Confirm the record and values with the operator first. Every write needs --actor. Before update, sign, proof-sent or renew, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
