# CardSmart rewards data audit — V10.10

Checked on 21 August 2026 against official issuer pages and issuer-hosted terms.

## What this release fixes

- Points and miles now accrue in discrete units before conversion to rupees.
- Winner ranking defaults to a conservative redemption value; a higher travel/catalogue value is shown separately.
- Offers are stored and evaluated separately from base rewards and expire automatically.
- Offer calculation supports card inclusion/exclusion, merchant, payment route, minimum spend, fixed/percentage value, coupon, activation and usage limits.
- Results expose the issuer source, data version and verification date.
- SBI Cashback's post-April-2026 cap was corrected from the old split-cap assumption to the official ₹4,000 cumulative statement-cycle cap.

## Priority-card audit status

| Card | Base earn | Redemption | Caps/exclusions | Current status |
|---|---|---|---|---|
| HDFC Swiggy | 10% Swiggy, 5% eligible e-commerce, 1% other | Cashback | Separate accelerated buckets still need bucket-level usage tracking | Verified terms; cap tracking partial |
| SBI Cashback | 5% eligible online, 1% eligible offline | Cashback | ₹4,000 cumulative statement-cycle cap; published exclusions modelled | Verified and corrected |
| Axis Atlas | 2 EDGE Miles/₹100 base, 5/₹100 eligible travel | ₹1 issuer value; partner transfer disclosed separately | No-earn categories modelled; ₹2 lakh travel threshold not inferred without cycle spend | Verified; threshold tracking partial |
| HDFC Millennia | 5% eligible partners, 1% other | CashPoints redeemable at ₹1 against statement | Accelerated and base buckets need separate usage tracking | Verified terms; cap tracking partial |
| Amazon Pay ICICI | 5% Prime / 3% non-Prime Amazon, 2% selected routes, 1% other | Amazon Pay balance | Prime state and the full 2% merchant map are not collected yet | Reviewed; user-context gap |
| HSBC Live+ | 10% dining, food delivery and grocery; 1.5% other eligible | Cashback | ₹1,000 accelerated billing-cycle cap | Verified |
| HDFC Infinia | 5 Reward Points/₹150 | ₹0.30 statement value; up to ₹1 SmartBuy travel value | SmartBuy acceleration excluded until the route is explicitly modelled | Verified base and redemption; acceleration partial |
| Axis ACE | 5% Google Pay utility, 4% Swiggy/Zomato/Ola, 1.5% other | Cashback | Shared accelerated cap modelled conservatively | Verified |
| Axis Magnus | 12 EDGE Points/₹200 below ₹1.5 lakh monthly spend; 5X Travel EDGE | ₹0.20 catalogue value; partner transfer disclosed separately | Higher monthly band requires statement-cycle spend | Verified base; high-spend band partial |
| American Express MRCC | 1 MR Point/₹50 | Conservative and selected-redemption values shown separately | Monthly transaction/spend milestones require counters | Earn rate verified; valuation and milestones reviewed |

## Offer validation included

Two issuer-hosted HSBC offers are seeded as production examples:

1. Lakme Salon: ₹1,100 off on an eligible offline bill of ₹3,000+, once per cardholder per calendar month, unique voucher required, valid through 31 December 2026.
2. Zepto: ₹100 off on eligible orders of ₹999+, code `ZEPHSBC`, once per card per month, valid through 31 December 2026. HSBC Live+/Cashback is explicitly excluded.

These cases prove why offer data cannot be inferred from a headline alone: card variants, routes, activation and usage limits materially change eligibility.

## Remaining blockers before broad public claims

1. Replace one cap-usage number per card with bucket-level usage, for example Swiggy cashback vs e-commerce cashback.
2. Collect user context that changes the rule, starting with Amazon Prime status.
3. Model statement-cycle counters for monthly spend bands and transaction milestones.
4. Expand official-source validation from the current priority set to the next 15 cards before showing them as anything above `indicative`.
5. Keep offers human-approved. Monitoring may propose changes but must never publish them automatically.

## Official sources

- HDFC Swiggy: https://www.hdfc.bank.in/credit-cards/swiggy-hdfc-bank-credit-card
- SBI Cashback FAQ: https://www.sbicard.com/en/faq/cashback-sbi-card-faq.page
- SBI notices: https://www.sbicard.com/en/customer-notices.page
- Axis Atlas: https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card
- HDFC Millennia: https://www.hdfc.bank.in/credit-cards/millennia-credit-card
- Amazon Pay ICICI: https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card
- HSBC Live+: https://www.hsbc.co.in/credit-cards/products/live-plus/
- HDFC Infinia: https://www.hdfc.bank.in/credit-cards/infinia-credit-card
- Axis ACE: https://www.axis.bank.in/cards/credit-card/axis-bank-ace-credit-card
- Axis Magnus: https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card
- American Express MRCC: https://www.americanexpress.com/in/credit-cards/membership-rewards-card/
- HSBC offers: https://www.hsbc.co.in/credit-cards/offers/
