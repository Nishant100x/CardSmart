import assert from "node:assert/strict";
import test from "node:test";
import {
  analysePaymentIntent,
  evaluateCard,
  inferCategory,
  inferChannel,
  isGenericMerchantInput,
  merchantClarificationCandidates,
  normalizePaymentText,
  rankCards,
  resolveMerchantEntity,
  type CardOffer,
  type RecommendationCard,
  type RewardModel,
} from "../src/recommendationEngine.ts";
import { FALLBACK_MERCHANT_DIRECTORY } from "../src/merchantDirectory.ts";

function card(overrides: Partial<RecommendationCard> = {}, rewardModel: Partial<RewardModel> = {}): RecommendationCard {
  return {
    id: "test-card",
    baseRate: 1,
    rates: { online: 1, dining: 1, travel: 1, grocery: 1 },
    trackedValue: 0,
    rewardModel: { confidence: "verified", ...rewardModel },
    ...overrides,
  };
}

const categoryCases = [
  ["Swiggy food order", "dining"],
  ["Swiggy Instamart", "grocery"],
  ["Blinkit groceries", "grocery"],
  ["Flight tickets", "travel"],
  ["Hotel booking", "travel"],
  ["Electricity bill", "utilities"],
  ["Airtel recharge", "utilities"],
  ["IndianOil fuel", "fuel"],
  ["House rent", "rent"],
  ["School fees", "education"],
  ["Insurance premium", "insurance"],
  ["Income tax payment", "government"],
  ["Amazon Pay wallet load", "wallet"],
  ["Amazon electronics", "shopping"],
] as const;

for (const [merchant, expected] of categoryCases) {
  test(`auto category: ${merchant} → ${expected}`, () => {
    assert.equal(inferCategory(merchant), expected);
  });
}

const channelCases = [
  ["Pay with UPI QR code", "upi"],
  ["Google Pay electricity bill", "app"],
  ["Airtel Thanks broadband", "app"],
  ["Offline POS at store", "offline"],
  ["Amazon website purchase", "online"],
] as const;

for (const [merchant, expected] of channelCases) {
  test(`auto route: ${merchant} → ${expected}`, () => {
    assert.equal(inferChannel(merchant), expected);
  });
}

test("an unstated payment route remains unresolved instead of defaulting to online", () => {
  assert.equal(inferChannel("Croma se TV"), "auto");
  assert.equal(inferChannel("Lakme Salon"), "auto");
});

test("natural merchant input produces honest category and route candidates", () => {
  const croma = analysePaymentIntent("Croma se TV 50k");
  assert.deepEqual(croma.categoryCandidates.map((item) => item.value), ["shopping"]);
  assert.deepEqual(croma.channelCandidates.map((item) => item.value), ["offline", "online", "app", "upi"]);

  const salon = analysePaymentIntent("Lakme Salon");
  assert.deepEqual(salon.categoryCandidates.map((item) => item.value), ["other"]);
  assert.equal(salon.channelQuestion, "How will you pay for this salon visit?");
});

test("multi-service apps ask for the purchase type instead of inventing it", () => {
  assert.deepEqual(
    analysePaymentIntent("Swiggy").categoryCandidates.map((item) => item.value),
    ["dining", "grocery"],
  );
  assert.deepEqual(
    analysePaymentIntent("Swiggy Instamart").categoryCandidates.map((item) => item.value),
    ["grocery"],
  );
  assert.deepEqual(
    analysePaymentIntent("Amazon").categoryCandidates.map((item) => item.value),
    ["shopping", "grocery", "travel", "utilities", "wallet"],
  );
});

test("normalization understands common typos and Hinglish payment language", () => {
  assert.equal(normalizePaymentText("Lkame saloon pe ₹3,000"), "lakme salon pe 3 000");
  assert.equal(inferCategory("bijli ka bill"), "utilities");
  assert.equal(inferCategory("ration aur sabzi"), "grocery");
  assert.equal(inferCategory("phone lena hai"), "shopping");
  assert.equal(inferCategory("ghar ka kiraya"), "rent");
});

test("merchant aliases and close spellings resolve to a canonical merchant", () => {
  assert.equal(resolveMerchantEntity("Chroma se TV", FALLBACK_MERCHANT_DIRECTORY)?.displayName, "Croma");
  const typo = resolveMerchantEntity("Lkame saloon", FALLBACK_MERCHANT_DIRECTORY);
  assert.equal(typo?.displayName, "Lakme Salon");
  assert.ok((typo?.score ?? 0) >= 0.72);
  assert.equal(resolveMerchantEntity("Sharma and Sons", FALLBACK_MERCHANT_DIRECTORY), null);
});

test("specific words narrow multi-service apps while vague inputs remain honest", () => {
  const utility = analysePaymentIntent("Google Pay se bijli bhar raha hu", "auto", "auto", FALLBACK_MERCHANT_DIRECTORY);
  assert.deepEqual(utility.categoryCandidates.map((item) => item.value), ["utilities"]);
  assert.deepEqual(utility.channelCandidates.map((item) => item.value), ["app"]);
  assert.equal(utility.merchantResolution?.displayName, "Google Pay");

  const amazonFlight = analysePaymentIntent("Amazon pe flight", "auto", "auto", FALLBACK_MERCHANT_DIRECTORY);
  assert.deepEqual(amazonFlight.categoryCandidates.map((item) => item.value), ["travel"]);

  const movie = analysePaymentIntent("movie tickets", "auto", "auto", FALLBACK_MERCHANT_DIRECTORY);
  assert.deepEqual(movie.categoryCandidates.map((item) => item.value), ["other"]);

  const unknown = analysePaymentIntent("Sharma and Sons", "auto", "auto", FALLBACK_MERCHANT_DIRECTORY);
  assert.equal(unknown.overallConfidence, "unknown");
  assert.deepEqual(unknown.categoryCandidates.map((item) => item.value), [
    "dining", "grocery", "shopping", "travel", "utilities", "fuel",
    "rent", "education", "insurance", "government", "wallet", "other",
  ]);
});

test("generic merchant language exposes current offer-linked merchants without guessing", () => {
  const offers: CardOffer[] = [{
    id: "lakme",
    title: "₹1,100 off at Lakme Salon",
    issuer: "HSBC",
    merchantMatches: ["lakme"],
    channels: ["offline"],
    minSpend: 3000,
    startsAt: "2026-01-01T00:00:00+05:30",
    endsAt: "2026-12-31T23:59:59+05:30",
    benefit: { kind: "instant_discount", fixedAmount: 1100 },
    confidence: "verified",
    sourceUrl: "https://example.com",
  }];
  assert.equal(isGenericMerchantInput("salon"), true);
  assert.equal(isGenericMerchantInput("nearby salon"), true);
  assert.equal(isGenericMerchantInput("Lakme salon"), false);
  assert.equal(isGenericMerchantInput("Croma electronics"), false);
  assert.deepEqual(
    merchantClarificationCandidates("salon", ["other"], offers, "2026-08-26")
      .map((candidate) => candidate.label),
    ["Lakme", "Another salon"],
  );
  assert.deepEqual(merchantClarificationCandidates("Lakme Salon", ["other"], offers, "2026-08-26"), []);
  assert.deepEqual(merchantClarificationCandidates("salon", ["other"], offers, "2027-01-01"), []);
});

test("credit-card UPI excludes a non-RuPay card", () => {
  const visa = card({ id: "visa", network: "VISA", baseRate: 5 });
  const rupay = card({ id: "rupay", network: "RuPay", baseRate: 1 });
  const ranked = rankCards([visa, rupay], { merchant: "QR payment", amount: 2000, category: "shopping", channel: "upi" });
  assert.equal(ranked[0].card.id, "rupay");
  assert.equal(ranked.find((item) => item.card.id === "visa")?.eligible, false);
});

for (const excludedCategory of ["fuel", "rent", "education", "insurance", "government", "wallet"] as const) {
  test(`exclusion returns zero for ${excludedCategory}`, () => {
    const result = evaluateCard(
      card({}, { exclusions: [excludedCategory] }),
      { merchant: excludedCategory, amount: 5000, category: excludedCategory, channel: "online" },
    );
    assert.equal(result.eligible, false);
    assert.equal(result.value, 0);
    assert.equal(result.rate, 0);
  });
}

test("merchant rule overrides category and base rate", () => {
  const result = evaluateCard(
    card({}, { merchantRules: [{ matches: ["swiggy"], rate: 10, label: "Swiggy rule" }] }),
    { merchant: "Swiggy", amount: 2000, category: "dining", channel: "online" },
  );
  assert.equal(result.rate, 10);
  assert.equal(result.value, 200);
  assert.equal(result.ruleLabel, "Swiggy rule");
});

test("merchant rule does not apply on the wrong route", () => {
  const result = evaluateCard(
    card({}, { merchantRules: [{ matches: ["gpay"], rate: 5, channels: ["app"], label: "GPay" }] }),
    { merchant: "GPay utility", amount: 2000, category: "utilities", channel: "online" },
  );
  assert.equal(result.rate, 1);
});

test("merchant rule does not apply to the wrong category", () => {
  const result = evaluateCard(
    card({}, { merchantRules: [{ matches: ["google pay"], rate: 5, categories: ["utilities"], label: "Utility" }] }),
    { merchant: "Google Pay", amount: 2000, category: "shopping", channel: "app" },
  );
  assert.equal(result.rate, 1);
});

test("category rule applies when no merchant rule matches", () => {
  const result = evaluateCard(
    card({}, { categoryRates: { grocery: 10 } }),
    { merchant: "Neighbourhood grocer", amount: 3000, category: "grocery", channel: "offline" },
  );
  assert.equal(result.rate, 10);
  assert.equal(result.value, 300);
});

test("wildcard merchant rule can model a capped category bucket", () => {
  const result = evaluateCard(
    card({}, { merchantRules: [{ matches: ["*"], rate: 10, categories: ["grocery"], capAmount: 1000, label: "Grocery bucket" }] }),
    { merchant: "Any grocer", amount: 12000, category: "grocery", channel: "offline" },
  );
  assert.equal(result.ruleLabel, "Grocery bucket");
  assert.equal(result.value, 1000);
  assert.equal(result.capAdjustment, 200);
});

test("channel rate applies ahead of category rate", () => {
  const result = evaluateCard(
    card({}, { channelRates: { online: 5 }, categoryRates: { shopping: 2 } }),
    { merchant: "Online store", amount: 1000, category: "shopping", channel: "online" },
  );
  assert.equal(result.rate, 5);
});

test("legacy merchant rate remains supported for the broad catalogue", () => {
  const result = evaluateCard(
    card({ merchantRates: { flipkart: 5 } }),
    { merchant: "Flipkart", amount: 4000, category: "shopping", channel: "online" },
  );
  assert.equal(result.rate, 5);
  assert.equal(result.value, 200);
});

test("legacy dining rate remains supported", () => {
  const result = evaluateCard(
    card({ rates: { dining: 4, online: 1, travel: 1, grocery: 1 } }),
    { merchant: "Restaurant", amount: 2500, category: "dining", channel: "offline" },
  );
  assert.equal(result.rate, 4);
  assert.equal(result.value, 100);
});

test("default cap limits the current reward", () => {
  const result = evaluateCard(
    card({ baseRate: 10 }, { defaultCapAmount: 1000 }),
    { merchant: "Spend", amount: 15000, category: "other", channel: "online" },
  );
  assert.equal(result.grossValue, 1500);
  assert.equal(result.value, 1000);
  assert.equal(result.capAdjustment, 500);
});

test("known cap usage reduces remaining reward", () => {
  const result = evaluateCard(
    card({ baseRate: 10, trackedValue: 800 }, { defaultCapAmount: 1000 }),
    { merchant: "Spend", amount: 5000, category: "other", channel: "online" },
  );
  assert.equal(result.capRemaining, 200);
  assert.equal(result.value, 200);
  assert.equal(result.capAdjustment, 300);
});

test("exhausted cap returns zero without marking category excluded", () => {
  const result = evaluateCard(
    card({ baseRate: 10, trackedValue: 1000 }, { defaultCapAmount: 1000 }),
    { merchant: "Spend", amount: 5000, category: "other", channel: "online" },
  );
  assert.equal(result.eligible, true);
  assert.equal(result.value, 0);
  assert.equal(result.capRemaining, 0);
});

test("merchant-specific cap overrides default cap", () => {
  const result = evaluateCard(
    card({ trackedValue: 900 }, {
      defaultCapAmount: 500,
      merchantRules: [{ matches: ["swiggy"], rate: 10, capAmount: 1500, label: "Swiggy" }],
    }),
    { merchant: "Swiggy", amount: 10000, category: "dining", channel: "online" },
  );
  assert.equal(result.capAmount, 1500);
  assert.equal(result.value, 600);
});

test("auto selections are disclosed as assumptions", () => {
  const result = evaluateCard(
    card(),
    { merchant: "Swiggy", amount: 1000, category: "auto", channel: "auto" },
  );
  assert.match(result.assumptions[0], /route was not stated/);
  assert.match(result.assumptions[1], /Category auto-detected/);
});

test("ranker picks the highest post-cap value", () => {
  const capped = card({ id: "capped", baseRate: 10, trackedValue: 950 }, { defaultCapAmount: 1000 });
  const steady = card({ id: "steady", baseRate: 3 });
  const ranked = rankCards([capped, steady], { merchant: "Spend", amount: 5000, category: "other", channel: "online" });
  assert.equal(ranked[0].card.id, "steady");
  assert.equal(ranked[0].value, 150);
});

test("ranker prefers an eligible rule when values tie at zero", () => {
  const excluded = card({ id: "excluded" }, { exclusions: ["fuel"] });
  const capped = card({ id: "capped", trackedValue: 100 }, { defaultCapAmount: 100 });
  const ranked = rankCards([excluded, capped], { merchant: "Fuel", amount: 1000, category: "fuel", channel: "offline" });
  assert.equal(ranked[0].card.id, "capped");
});

test("ranker uses rule confidence only as a tie-breaker", () => {
  const indicative = card({ id: "indicative" }, { confidence: "indicative" });
  const verified = card({ id: "verified" }, { confidence: "verified" });
  const ranked = rankCards([indicative, verified], { merchant: "Spend", amount: 1000, category: "other", channel: "online" });
  assert.equal(ranked[0].card.id, "verified");
});

const hdfcPoints = {
  kind: "points" as const,
  units: 5,
  spendUnit: 150,
  currency: {
    code: "HDFC_RP",
    name: "HDFC Reward Points",
    unitLabel: "Reward Points",
    standardValuePerUnit: 0.3,
    optimisedValuePerUnit: 1,
    standardRedemption: "Statement credit",
    optimisedRedemption: "SmartBuy travel",
    redemptionOptions: [
      { id: "cash", type: "cash" as const, label: "Statement credit", valuePerUnit: 0.3 },
      { id: "voucher", type: "voucher" as const, label: "Shopping vouchers", valuePerUnit: 0.5 },
      { id: "travel", type: "travel" as const, label: "SmartBuy travel", valuePerUnit: 1 },
      { id: "transfer", type: "transfer" as const, label: "Airmile transfer", conversionUnitsPerPoint: 1, conversionUnitLabel: "airmiles" },
    ],
  },
};

test("points cards accrue discrete units before converting to conservative rupee value", () => {
  const result = evaluateCard(
    card({}, { defaultEarning: hdfcPoints }),
    { merchant: "Retail store", amount: 2000, category: "shopping", channel: "offline" },
  );
  assert.equal(result.rewardUnits, 66);
  assert.equal(result.standardValue, 20);
  assert.equal(result.optimisedValue, 66);
  assert.equal(result.value, 20);
  assert.equal(result.standardRedemption, "Statement credit");
});

test("optimised redemption can be requested without changing the underlying points earned", () => {
  const result = evaluateCard(
    card({}, { defaultEarning: hdfcPoints }),
    { merchant: "Flight", amount: 2000, category: "travel", channel: "online" },
    { rewardValueMode: "optimised" },
  );
  assert.equal(result.rewardUnits, 66);
  assert.equal(result.value, 66);
  assert.equal(result.valueMode, "optimised");
});

test("a user preference changes the selected redemption route and card ranking", () => {
  const pointsCard = card({ id: "points" }, { defaultEarning: hdfcPoints });
  const cashbackCard = card({ id: "cashback", baseRate: 1.5, rates: { online: 1.5, dining: 1.5, travel: 1.5, grocery: 1.5 } });
  const input = { merchant: "Retail store", amount: 2000, category: "shopping" as const, channel: "offline" as const };
  assert.equal(rankCards([pointsCard, cashbackCard], input, { redemptionPreference: "cash" })[0].card.id, "cashback");
  const shoppingResult = rankCards([pointsCard, cashbackCard], input, { redemptionPreference: "shopping" })[0];
  assert.equal(shoppingResult.card.id, "points");
  assert.equal(shoppingResult.value, 33);
  assert.equal(shoppingResult.selectedRedemption?.label, "Shopping vouchers");
});

test("transfer routes disclose converted units without inventing rupee value", () => {
  const result = evaluateCard(card({}, { defaultEarning: hdfcPoints }),
    { merchant: "Retail", amount: 2000, category: "shopping", channel: "offline" });
  const transfer = result.redemptionValues.find((option) => option.type === "transfer");
  assert.equal(transfer?.value, null);
  assert.equal(transfer?.convertedUnits, 66);
  assert.equal(transfer?.conversionUnitLabel, "airmiles");
});

test("tiered voucher value is used only when the saved balance reaches its threshold", () => {
  const tiered = { ...hdfcPoints, currency: { ...hdfcPoints.currency, redemptionOptions: [
    { id: "cash", type: "cash" as const, label: "Cash", valuePerUnit: 0.25 },
    { id: "gold", type: "voucher" as const, label: "Gold Collection", tiers: [{ units: 18000, value: 9000, label: "₹9,000 voucher" }] },
  ] } };
  const input = { merchant: "Retail", amount: 2000, category: "shopping" as const, channel: "offline" as const };
  const withoutBalance = evaluateCard(card({}, { defaultEarning: tiered }), input, { redemptionPreference: "shopping" });
  assert.equal(withoutBalance.selectedRedemption, null);
  assert.equal(withoutBalance.value, 0);
  const withBalance = evaluateCard(card({}, { defaultEarning: tiered }), input, {
    redemptionPreference: "shopping", ledgers: { "test-card": { pointsBalance: 17950 } },
  });
  assert.equal(withBalance.selectedRedemption?.label, "Gold Collection");
  assert.equal(withBalance.value, 33);
});

test("milestones use a user ledger and stay outside today's reward value", () => {
  const milestoneCard = card({}, { defaultEarning: hdfcPoints, milestones: [{
    id: "fee-waiver", label: "Fee waiver", period: "anniversary_year", metric: "spend",
    threshold: 100000, benefitLabel: "Annual fee waived", benefitValue: 5000,
  }] });
  const result = evaluateCard(milestoneCard,
    { merchant: "Retail", amount: 2000, category: "shopping", channel: "offline" },
    { ledgers: { "test-card": { annualEligibleSpend: 99000 } } });
  assert.equal(result.value, 20);
  assert.equal(result.milestoneProgress[0].crossed, true);
  assert.equal(result.milestoneProgress[0].remaining, 0);
  assert.equal(result.milestoneProgress[0].benefitValue, 5000);
});

test("unknown milestone ledger is disclosed instead of assumed to be zero", () => {
  const result = evaluateCard(card({}, { milestones: [{
    id: "monthly", label: "Monthly spend", period: "calendar_month", metric: "spend",
    threshold: 20000, benefitLabel: "1,000 points",
  }] }), { merchant: "Retail", amount: 2000, category: "shopping", channel: "offline" });
  assert.equal(result.milestoneProgress[0].before, null);
  assert.equal(result.milestoneProgress[0].after, null);
  assert.equal(result.milestoneProgress[0].crossed, false);
});

test("an excluded category does not advance a known milestone ledger", () => {
  const result = evaluateCard(card({}, { exclusions: ["fuel"], milestones: [{
    id: "annual", label: "Annual spend", period: "anniversary_year", metric: "spend",
    threshold: 100000, benefitLabel: "Fee waiver",
  }] }), { merchant: "Fuel", amount: 2000, category: "fuel", channel: "offline" }, {
    ledgers: { "test-card": { annualEligibleSpend: 50000 } },
  });
  assert.equal(result.milestoneProgress[0].before, 50000);
  assert.equal(result.milestoneProgress[0].after, 50000);
});

function offer(overrides: Partial<CardOffer> = {}): CardOffer {
  return {
    id: "offer-1",
    title: "₹100 instant discount",
    issuer: "Test Bank",
    merchantMatches: ["zepto"],
    minSpend: 999,
    startsAt: "2026-01-01T00:00:00Z",
    endsAt: "2026-12-31T23:59:59Z",
    benefit: { kind: "instant_discount", fixedAmount: 100 },
    confidence: "verified",
    sourceUrl: "https://issuer.example/offer",
    ...overrides,
  };
}

test("a current verified offer is added separately from base rewards", () => {
  const result = evaluateCard(
    card({ bank: "Test Bank" }),
    { merchant: "Zepto", amount: 2000, category: "grocery", channel: "online" },
    { offers: [offer()], asOf: "2026-08-21T00:00:00Z" },
  );
  assert.equal(result.baseValue, 20);
  assert.equal(result.offerValue, 100);
  assert.equal(result.value, 120);
  assert.equal(result.offersApplied[0].title, "₹100 instant discount");
});

test("expired, under-threshold and card-excluded offers never affect ranking", () => {
  const input = { merchant: "Zepto", amount: 900, category: "grocery" as const, channel: "online" as const };
  const result = evaluateCard(card({ bank: "Test Bank" }), input, {
    offers: [
      offer({ id: "expired", minSpend: 0, endsAt: "2025-12-31T23:59:59Z" }),
      offer({ id: "under-threshold" }),
      offer({ id: "excluded", minSpend: 0, excludedCardIds: ["test-card"] }),
    ],
    asOf: "2026-08-21T00:00:00Z",
  });
  assert.equal(result.offerValue, 0);
  assert.equal(result.offersApplied.length, 0);
});

test("only the best non-stackable offer is counted", () => {
  const result = evaluateCard(
    card({ bank: "Test Bank" }),
    { merchant: "Zepto", amount: 2000, category: "grocery", channel: "online" },
    { offers: [offer(), offer({ id: "offer-2", title: "₹150 off", benefit: { kind: "instant_discount", fixedAmount: 150 } })], asOf: "2026-08-21T00:00:00Z" },
  );
  assert.equal(result.offerValue, 150);
  assert.equal(result.offersApplied.length, 1);
  assert.equal(result.offersApplied[0].id, "offer-2");
});

test("an offer can still win when the card's base reward excludes that category", () => {
  const result = evaluateCard(
    card({ bank: "Test Bank" }, { exclusions: ["grocery"] }),
    { merchant: "Zepto", amount: 2000, category: "grocery", channel: "online" },
    { offers: [offer()], asOf: "2026-08-21T00:00:00Z" },
  );
  assert.equal(result.baseValue, 0);
  assert.equal(result.offerValue, 100);
  assert.equal(result.value, 100);
  assert.equal(result.eligible, true);
  assert.match(result.ruleLabel, /offer still applies/);
});
