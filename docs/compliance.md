# Record checks and their sources

Checked 13 October 2026. `npm run sponsorship -- compliance` runs every check below. This is a record tool. It does not decide whether a partner is lawful, whether an advertisement breaches a code, or how much GST you owe. You and your adviser decide that. A finding is a reminder to look.

| Check | What the data shows | Basis |
|---|---|---|
| NZ-SFERPA-S29 | A live or pipeline deal with a partner whose category is on the prohibited list (tobacco and vaping by default) | NZ: Smokefree Environments and Regulated Products Act 1990 s29. AU: Public Health (Tobacco and Other Products) Act 2023 |
| ADULT-ONLY-ON-JUNIOR | A partner in an adult-only category (alcohol and gambling by default) holding an asset whose audience is junior, on a deal still running | NZ: ASA Alcohol Advertising and Promotion Code, Principle 3. AU: ABAC Responsible Alcohol Marketing Code Part 3 (b)(i), for marketing drawn from the sponsorship. Gambling: your own policy |
| ADULT-ONLY-AT-JUNIOR-EVENT | The same partner with a per-event asset due at an upcoming event marked junior | As above |
| GST-CONTRA | A signed deal with contra (value in kind) and no contra invoice recorded | NZ: Goods and Services Tax Act 1985 s10(2). AU: ATO, barter and trade exchanges |
| NOT-A-GIFT | A sponsorship recorded as receipted as a donation | NZ: Income Tax Act 2007 LD 3 and IRD donation guidance. AU: ATO, gift or contribution |
| PROOF-NEEDS-EVIDENCE | A delivery that claims a reach figure with no evidence recorded | NZ: Fair Trading Act 1986 s9. AU: Australian Consumer Law s18 |
| LOCAL-UNSIGNED | Deliveries against a deal with no signed date | Your contracting policy |
| LOCAL-EXCLUSIVITY | A partner holds a category exclusively and another deal in that category overlaps its term | The exclusivity clause in your agreement |
| LOCAL-OVERSOLD | An asset sold on signed deals more times than it exists this season | Your inventory |
| LOCAL-FULFILMENT | An entitlement behind the clock (15 points by default), past its due date, or owed after the deal ended | Your agreement |
| LOCAL-PROOF-REPORT | A deal that has ended with no proof of performance report sent (due 30 days after the end by default) | Your agreement and your renewal process |

Change any number or category list in `settings` with `update settings`. Change a rule with /customise.

## Tobacco and vaping sponsors

New Zealand: a manufacturer, importer, distributor or retailer of regulated products (tobacco, vaping and smokeless tobacco products) must not sponsor an organised activity that uses a regulated product trade mark, or any part of a company name in one, in the name of the activity or on anything other than the product ([Smokefree Environments and Regulated Products Act 1990 s29](https://legislation.govt.nz/act/public/1990/108/en/latest/)). Section 31 also bars using those trade marks to identify a service, activity or event.

Australia: the Public Health (Tobacco and Other Products) Act 2023 prohibits tobacco and e-cigarette advertising and sponsorship. A sponsorship is any contribution, financial or otherwise, to an event, activity or person that promotes or is likely to promote those products ([Department of Health, advertising and sponsorship bans](https://www.health.gov.au/topics/smoking-vaping-and-tobacco/tobacco-control/advertising-bans)).

The check reads the partner's `category` against `settings.prohibited_categories` (`tobacco,vaping`). A vape shop with a different trading name is still a vape shop: set the category to what the partner sells.

## Alcohol and gambling partners near juniors

New Zealand: alcohol sponsorship advertising and promotion must target adults and primarily promote the sponsored party (ASA Alcohol Advertising and Promotion Code, Principle 3, with Rule 3(a) headed "Targeting Adults"). The code applies to material bearing the alcohol advertiser's logo or trade mark in the context of the sponsorship agreement. Adults are people aged 18 and over ([ASA Alcohol Advertising and Promotion Code](https://www.asa.co.nz/codes/codes/alcohol-advertising-and-promotion-code/)).

Australia: the ABAC Responsible Alcohol Marketing Code does not apply to the sponsorship itself, such as a logo on a uniform (Part 2 (a)(v)). Marketing drawn from the sponsorship, such as social media posts, must not have strong or evident appeal to minors (Part 3 (b)(i)) ([ABAC determinations](https://abac.org.au/)). Your sport's governing body may set stricter rules for junior grades.

Gambling: the default list includes gambling as a house rule, not a cited law. Check your code of conduct and your governing body's rules, and remove it from `settings.adult_only_categories` if it does not apply to you.

Mark each asset's `audience` (`adult`, `junior`, `mixed`) and each event's `audience`. The checks flag an adult-only partner on a junior asset, or due at a junior event. /draft-proposal leaves junior assets off an adult-only partner's list.

## Contra and GST

Contra (goods or services instead of cash, often called value in kind) is a supply both ways. New Zealand: where consideration is not in money, the value of the supply is its open market value ([Goods and Services Tax Act 1985 s10(2)](https://www.legislation.govt.nz/act/public/1985/141/en/latest/)). Australia: barter and trade exchanges get the same income tax and GST treatment as cash or credit transactions, usually at the cash price you would charge a stranger ([ATO, barter and trade exchanges](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/rules-for-specific-transactions/barter-and-trade-exchanges)).

The check flags a signed deal with `contra_value` and no invoice of kind `contra`. Record the contra invoice at the value your adviser agrees.

## Sponsorship is not a donation

A sponsor receives something back: naming, signage, hospitality, posts. Australia: "If you are a business and you support a DGR through advertising or sponsorship this is generally not a gift" ([ATO, is it a gift or contribution](https://www.ato.gov.au/businesses-and-organisations/not-for-profit-organisations/gifts-and-fundraising/tax-deductible-donations/is-it-a-gift-or-contribution)). New Zealand: a donation that earns a tax credit or deduction is a gift with no material benefit to the donor ([IRD, donations](https://www.ird.govt.nz/income-tax/income-tax-for-individuals/individual-tax-credits/donation-tax-credits)). A charity, school or club that issues a donation receipt for a sponsorship gives the sponsor a deduction they may not be entitled to. The check flags any deal with `receipted_as_donation` set to yes.

## Proof of performance claims

A proof of performance report is a statement in trade. New Zealand: no person shall, in trade, engage in conduct that is misleading or deceptive or likely to mislead or deceive ([Fair Trading Act 1986 s9](https://www.legislation.govt.nz/act/public/1986/121/en/latest/)). Australia: the same rule under the Australian Consumer Law s18 ([Competition and Consumer Act 2010 Schedule 2](https://www.legislation.gov.au/C2004A00109/latest/text)). The check flags any delivery with a `reach` figure and no `evidence`, so a number goes to the partner only when you can show where it came from.

## Your own rules

The LOCAL checks are house rules most properties already work to: deliver only against a signed agreement, honour exclusivity, do not sell what you do not have, keep pace with what was promised, and send the proof of performance report within a month of the end. The thresholds live in `settings`.
