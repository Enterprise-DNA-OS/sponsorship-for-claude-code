---
description: Bring assets, agreements and fulfilment across from KORE report exports.
---

Read CLAUDE.md. Run npm run sponsorship -- import kore-assets --file=<export.csv> --actor=<name> --dry-run. Use --json when you need to work further with the rows. Never invent a record, a date, an amount or a delivery that is not in the records.

Always rehearse with --dry-run first and compare counts. Order: kore-assets, then kore-deals (creates partners by account name), then kore-fulfilment (contracted and fulfilled quantities; the fulfilled count is recorded as one delivery dated --delivered-on). Renamed headings: copy examples/mapping.json and pass --mapping. Dates written DD/MM/YYYY need --day-first. Never add --update-existing until the changed rows have been compared. See docs/replace-kore.md.
