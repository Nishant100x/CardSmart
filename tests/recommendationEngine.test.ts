import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateCard,
  inferCategory,
  inferChannel,
  rankCards,
  type RecommendationCard,
  type RewardModel,
} from "../src/recommendationEngine.ts";

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
  ["Swiggy order", "dining"],
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
  ["Amazon purchase", "online"],
] as const;

for (const [merchant, expected] of channelCases) {
  test(`auto route: ${merchant} → ${expected}`, () => {
    assert.equal(inferChannel(merchant), expected);
  });
}

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
  assert.match(result.assumptions[0], /route auto-detected/);
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
