---
description: Check the records against the sponsorship rules (prohibited categories, adult-only categories on junior assets, contra and GST, sponsorship receipted as a donation, proof of performance claims) and your own rules, with sources.
---

1. Run `npm run sponsorship -- compliance`: it runs every check below in one query. Then read `docs/compliance.md`. Each rule has a name, the source it comes from, what a breach looks like in the data, and the check that finds it.
2. Report as a table: rule, count, the worst example, the source. Order by severity: law first (NZ-SFERPA-S29, ADULT-ONLY rules, GST-CONTRA, NOT-A-GIFT, PROOF-NEEDS-EVIDENCE), then your own rules.
3. For anything found, draft the fix the operator can approve: the record to update, the conversation to have with the partner (draft to `drafts/`, never send), or the task to add.
4. If a rule in `docs/compliance.md` is out of date, say so and stop. Do not guess at law. The operator confirms the rule, then you update the doc and the check together.

Nothing here is legal or tax advice. The doc records the rules the operator has told the system to enforce, with sources, and this command checks the data against them.
