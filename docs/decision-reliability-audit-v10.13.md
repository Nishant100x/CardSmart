# CardSmart V10.13 decision reliability audit

## Release objective

V10.13 closes the gap between a technically generated recommendation and a recommendation a real user confirms, corrects or follows. It does not add another reward-calculation layer.

## What is measured

- Payment funnel from start to recommendation.
- When a clarification was required and answered.
- Whether the user confirms or corrects the interpreted merchant, category and route.
- Whether the recommended card or another wallet card was used.
- Explicit reward or offer issue reports.
- Decision confidence shown from payment-intent confidence, rule confidence and issuer-source availability.

Raw payment text is not written to generic product-event metadata. It is stored only when the user explicitly submits recommendation feedback, because that text is necessary to investigate the reported interpretation.

## Publishing boundary

User corrections are evidence for a review queue. They never update `merchant_directory`, `card_versions`, `card_offers`, reward rules or confidence automatically. Existing approval-gated monitoring remains the only publication path.

## Beta operating metrics

Use `cardsmart_reliability_daily` for the daily funnel and join explicit feedback only in the Supabase SQL Editor or a service-role admin surface.

Initial beta gates:

- At least 90% of payment inputs reach a recommendation within one clarification.
- Zero silently applied wrong offers.
- At least 80% of submitted interpretation feedback is `correct`.
- At least 50% of users who submit an outcome use the recommended card.
- Fewer than 20% of viewed winners use `indicative` reward rules.

## Known limitations

- Client-side event capture is directional analytics, not a financial ledger.
- Ad blockers and network failures can reduce event counts.
- “I used this card” is a user confirmation, not bank-statement verification.
- The public client cannot query aggregate analytics or other users' feedback.
