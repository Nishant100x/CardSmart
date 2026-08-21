# CardSmart V10.11 redemption intelligence audit

Verified: 21 August 2026. Runtime version: `2026.08.21-v10.11`.

## Published redemption routes

| Card | Currency | Route | Published rule | Confidence |
|---|---|---|---|---|
| HDFC Infinia Metal | HDFC Reward Points | Statement credit | Up to ₹0.30 / point | Verified |
| HDFC Infinia Metal | HDFC Reward Points | Products and vouchers | Up to ₹0.50 / point | Verified |
| HDFC Infinia Metal | HDFC Reward Points | Apple / Tanishq via SmartBuy | ₹1 / point; points cover up to 70% | Verified |
| HDFC Infinia Metal | HDFC Reward Points | Flights / hotels via SmartBuy | ₹1 / point; monthly caps apply | Verified |
| HDFC Infinia Metal | HDFC Reward Points | Airmile conversion | Up to 1 airmile / point; rupee value not inferred | Verified |
| Axis Atlas | EDGE Miles | Travel EDGE bookings | ₹1 / EDGE Mile | Verified |
| Axis Atlas | EDGE Miles | Partner transfer | 1 EDGE Mile → 2 partner miles; rupee value not inferred | Verified |
| Axis Magnus | EDGE Reward Points | EDGE catalogue | ₹0.20 / point | Verified |
| Axis Magnus | EDGE Reward Points | Partner transfer | 5 EDGE Points → 2 partner miles for standard Magnus; rupee value not inferred | Verified |
| American Express MRCC | Membership Rewards | Conservative cash-equivalent | ₹0.25 / point | Reviewed |
| American Express MRCC | Membership Rewards | 18 Karat Gold Collection | Taj up to ₹9,000 or selected shopping vouchers up to ₹7,000 for 18,000 points | Verified |
| American Express MRCC | Membership Rewards | 24 Karat Gold Collection | Taj up to ₹14,000; Shoppers Stop ₹10,000; selected ₹8,000 vouchers for 24,000 points | Verified |

## Published milestones

| Card | Period | Threshold | Benefit | Treatment |
|---|---|---:|---|---|
| HDFC Infinia Metal | Card year | ₹10 lakh | ₹12,500 renewal fee waiver | Progress only until crossed |
| Axis Atlas | Card year | ₹3 lakh | 2,500 EDGE Miles | Progress only until crossed |
| Axis Atlas | Card year | ₹7.5 lakh | Additional 2,500 EDGE Miles + Gold tier | Progress only until crossed |
| Axis Atlas | Card year | ₹15 lakh | Additional 5,000 EDGE Miles + Platinum tier | Progress only until crossed |
| Axis Magnus | Card year | ₹25 lakh | ₹12,500 renewal fee waiver | Progress only until crossed |
| American Express MRCC | Calendar month | 4 transactions of ₹1,500+ | 1,000 bonus MR Points | Transaction count required |
| American Express MRCC | Calendar month | ₹20,000 eligible spend | Additional 1,000 MR Points | Enrollment required |
| American Express MRCC | Card year | ₹90,000 | 50% renewal fee waiver | Progress only until crossed |
| American Express MRCC | Card year | ₹1.5 lakh | 100% renewal fee waiver | Progress only until crossed |

## Official sources

- HDFC Infinia product and redemption programme: https://www.hdfc.bank.in/credit-cards/infinia-credit-card
- Axis Atlas product, redemption and milestones: https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card
- Axis Magnus product, rewards and fee waiver: https://www.axis.bank.in/cards/credit-card/axis-bank-magnus-credit-card
- American Express MRCC benefits and milestones: https://www.americanexpress.com/in/credit-cards/membership-rewards-card/
- American Express Gold Collection: https://www.americanexpress.com/in/rewards/membership-rewards/redeem-points/gold-collection.html

## Guardrails

- Partner-mile rupee values are never invented because realised value depends on the chosen loyalty programme and booking.
- Tiered vouchers become rankable only when a saved points balance plus the current payment reaches the required points threshold.
- Milestone value stays outside today's reward value unless the threshold is actually crossed; progress is shown separately.
- Missing balances and spend counters remain `unknown`, never silently treated as zero.
- Statement import, issuer-catalogue diffing and partner-inventory refresh remain future work. V10.11 supports manual statement/card-app inputs and versioned, human-approved truth data.
