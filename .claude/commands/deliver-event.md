---
description: Record one delivery for every per-event entitlement still owed at an event, after it is held.
---

Read CLAUDE.md. Run npm run sponsorship -- deliver-event <event> [--skip="Partner: Asset;Partner: Asset"] --actor=<name>. Use --json when you need to work further with the rows. Never invent a record, a date, an amount or a delivery that is not in the records.

Ask the operator what did not go out and pass it in --skip. Reach is taken from the event attendance when it is recorded. The event is marked held. Confirm the record and values with the operator first. Every write needs --actor. Before update, sign, proof-sent or renew, read show and pass --expected-version. If a name matches more than one record, list them and ask which one.
