# V10.12 payment-intent resolution audit

## Product contract

CardSmart accepts any non-empty payment description. It does not promise that every phrase can be understood without a follow-up. The safety contract is:

1. Normalize common spelling mistakes, abbreviations and Hinglish terms.
2. Resolve known merchant aliases to a canonical merchant using exact or bounded fuzzy matching.
3. Use the canonical merchant only to select deterministic, published reward and offer rules.
4. Keep multiple plausible purchase categories and payment routes alive until the wallet outcome is compared.
5. Ask a plain-language clarification only when those interpretations change the winning card, reward value, redemption route, rule or offer.
6. For a completely unknown merchant or phrase, ask for the payment category instead of silently treating it as online shopping or `other`.
7. Never let fuzzy or language inference calculate reward value.

## Runtime layers

| Layer | Responsibility | Can change reward maths? |
|---|---|---:|
| Text normalization | Typos, punctuation, abbreviations and selected Hinglish vocabulary | No |
| Merchant directory | Canonical merchant, aliases, plausible categories and channels | No |
| Decision-sensitive clarification | Ask only when candidate outcomes differ | No |
| Reward engine | Published card rules, offers, caps, exclusions, redemptions and milestones | Yes |

## Covered examples

- `Chroma se TV`, `Croma website`, `Croma store`
- `Lkame saloon`, `salon`, `Lakme Salon`
- `Swigy order`, `Swiggy Instamart`
- `Google Pay se bijli bhar raha hu`
- `ration aur sabzi`, `phone lena hai`, `ghar ka kiraya`
- Unknown local names such as `Sharma and Sons`

## Deliberate limits

- Fuzzy resolution is rejected when two merchant entities are too close to call.
- The bundled merchant directory is a continuity fallback. Published Supabase rows are primary after the V10.12 migration.
- A merchant not present in the directory can still be evaluated after category clarification, but CardSmart cannot invent a merchant-specific offer that is absent from the published offer catalogue.
- The current category taxonomy maps healthcare, entertainment, fitness, beauty and professional services to `other` unless a merchant-specific rule exists. Expanding reward categories is a separate data-model release.
- User corrections are retained inside saved interaction metadata. They do not auto-publish global aliases.

## Release validation

- Unit tests cover normalization, exact and fuzzy entity resolution, multi-service merchants, unknown input, offer-safe generic merchants and deterministic reward ranking.
- Preview QA must include a wallet whose winners differ across categories and routes; a one-card wallet can legitimately suppress clarification when all outcomes are identical.
