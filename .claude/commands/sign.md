---
description: Record a signed agreement: the deal becomes contracted and the partner active.
---

Read CLAUDE.md. Run npm run sponsorship -- sign <deal> [--signed-on=YYYY-MM-DD] --expected-version=N --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date, an amount or a delivery that is not in the records.

A deal needs a start date, an end date and at least one entitlement before it can be signed. Check /clashes first. Confirm the record and values with the operator first. Every write needs --actor. Before update, sign, proof-sent or renew, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
