import assert from "node:assert/strict";
import test from "node:test";
import { parsePublishedCatalogRows, parsePublishedMerchantRows, parsePublishedOfferRows } from "../src/catalogueData.ts";

test("published Supabase rows become recommendation cards and discovery metadata", () => {
  const result = parsePublishedCatalogRows([{
    id: "test-card",
    issuer: "Test Bank",
    name: "Test Cashback",
    network: "RuPay",
    card_versions: [{
      version_no: 2,
      reward_model: {
        colors: ["#111111", "#222222"],
        accent: "#ffffff",
        bestFor: ["Online"],
        baseRate: 1,
        rates: { online: 5 },
        cap: "₹1,000 cashback / month",
        note: "Issuer terms checked.",
        rewardModel: {
          confidence: "verified",
          rewardLabel: "Cashback",
          defaultCapAmount: 1000,
          defaultEarning: { kind: "points", units: 1, spendUnit: 100, currency: { code: "TEST", name: "Test Points", unitLabel: "Points", standardValuePerUnit: 0.25, standardRedemption: "Cash", redemptionOptions: [{ id: "voucher", type: "voucher", label: "Voucher", valuePerUnit: 0.5 }] } },
          milestones: [{ id: "monthly", label: "Monthly", period: "calendar_month", metric: "spend", threshold: 20000, benefitLabel: "Bonus" }],
          assumptions: ["Eligible transactions only."],
        },
      },
      fees: { annualFee: 999 },
      eligibility: { minMonthlyIncome: 30000 },
      benefits: { goals: ["Simple cashback"] },
      terms_and_conditions: {},
    }],
  }]);

  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].id, "test-card");
  assert.equal(result.cards[0].rates.online, 5);
  assert.equal(result.cards[0].rewardModel.confidence, "verified");
  assert.equal(result.cards[0].rewardModel.defaultEarning.currency.redemptionOptions[0].label, "Voucher");
  assert.equal(result.cards[0].rewardModel.milestones[0].threshold, 20000);
  assert.deepEqual(result.discoveryMeta["test-card"], {
    annualFee: 999,
    minMonthlyIncome: 30000,
    goals: ["Simple cashback"],
  });
  assert.deepEqual(result.offers, []);
  assert.deepEqual(result.merchants, []);
});

test("malformed rows are rejected instead of corrupting the live catalogue", () => {
  const result = parsePublishedCatalogRows([
    { id: "missing-version", issuer: "Test Bank", name: "Broken", card_versions: [] },
    { id: "missing-name", issuer: "Test Bank", card_versions: [{ reward_model: {} }] },
  ]);

  assert.deepEqual(result, { cards: [], discoveryMeta: {}, offers: [], merchants: [] });
});

test("published merchant aliases become a validated intent directory", () => {
  const merchants = parsePublishedMerchantRows([{
    merchant_key: "croma",
    display_name: "Croma",
    aliases: ["croma", "chroma"],
    category_candidates: ["shopping", "not-a-category"],
    channel_candidates: ["offline", "online", "not-a-channel"],
    confidence: "verified",
    source_url: "https://www.croma.com/",
  }]);
  assert.equal(merchants.length, 1);
  assert.deepEqual(merchants[0].categoryCandidates, ["shopping"]);
  assert.deepEqual(merchants[0].channelCandidates, ["offline", "online"]);
  assert.equal(merchants[0].confidence, "verified");
});

test("published offers are parsed as a separate, expiring calculation layer", () => {
  const offers = parsePublishedOfferRows([{
    id: "offer-row",
    offer_key: "issuer-merchant-2026",
    issuer: "Test Bank",
    merchant: "Zepto",
    title: "₹100 instant discount",
    offer_value: { benefit: { kind: "instant_discount", fixedAmount: 100 }, confidence: "verified" },
    eligibility: { cardIds: ["test-card"], merchantMatches: ["zepto"], minSpend: 999, couponCode: "TEST100" },
    starts_at: "2026-01-01T00:00:00Z",
    ends_at: "2026-12-31T23:59:59Z",
    source_url: "https://issuer.example/offers",
    terms_url: "https://issuer.example/terms.pdf",
    reviewed_at: "2026-08-21T00:00:00Z",
  }]);

  assert.equal(offers.length, 1);
  assert.equal(offers[0].benefit.fixedAmount, 100);
  assert.equal(offers[0].couponCode, "TEST100");
  assert.deepEqual(offers[0].cardIds, ["test-card"]);
});
