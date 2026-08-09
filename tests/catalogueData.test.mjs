import assert from "node:assert/strict";
import test from "node:test";
import { parsePublishedCatalogRows } from "../src/catalogueData.ts";

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
  assert.deepEqual(result.discoveryMeta["test-card"], {
    annualFee: 999,
    minMonthlyIncome: 30000,
    goals: ["Simple cashback"],
  });
});

test("malformed rows are rejected instead of corrupting the live catalogue", () => {
  const result = parsePublishedCatalogRows([
    { id: "missing-version", issuer: "Test Bank", name: "Broken", card_versions: [] },
    { id: "missing-name", issuer: "Test Bank", card_versions: [{ reward_model: {} }] },
  ]);

  assert.deepEqual(result, { cards: [], discoveryMeta: {} });
});
