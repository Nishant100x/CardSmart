import assert from "node:assert/strict";
import test from "node:test";

import {
  annualFeeLimit,
  incomeBandValue,
  netIncrementalValue,
  savedPaymentContext,
  uniqueKnownIds,
} from "../src/productLogic.ts";

test("saved payment replay restores category and payment route", () => {
  assert.deepEqual(
    savedPaymentContext({ category: "travel", payment_channel: "app" }),
    { category: "travel", paymentChannel: "app" },
  );
});

test("old or malformed payment history falls back safely", () => {
  assert.deepEqual(
    savedPaymentContext({ category: "unknown", payment_channel: "cash" }),
    { category: "auto", paymentChannel: "auto" },
  );
  assert.deepEqual(savedPaymentContext(null), { category: "auto", paymentChannel: "auto" });
});

test("wallet merge keeps only unique catalogue cards", () => {
  assert.deepEqual(
    uniqueKnownIds(["sbi", "sbi", "unknown", "axis"], ["sbi", "axis"]),
    ["sbi", "axis"],
  );
});

test("new-card value is incremental reward after annual fee", () => {
  assert.equal(netIncrementalValue(8400, 5000), 3400);
  assert.equal(netIncrementalValue(1200, 2500), -1300);
});

test("profile bands produce deterministic discovery filters", () => {
  assert.equal(incomeBandValue("₹1,00,000–₹1,99,999"), 150000);
  assert.equal(annualFeeLimit("Lifetime free only"), 0);
  assert.equal(annualFeeLimit("Any fee if value is higher"), Number.POSITIVE_INFINITY);
});
