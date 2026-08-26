import assert from "node:assert/strict";
import test from "node:test";
import { decisionTrust, reliabilitySessionId, safeEventMetadata } from "../src/reliability.ts";

test("verified issuer-backed decisions earn the highest trust level", () => {
  assert.deepEqual(decisionTrust("verified", "high", true), {
    level: "high",
    label: "High decision confidence",
    explanation: "The payment was understood and the winning reward rule is backed by an issuer source.",
  });
});

test("unknown intent or indicative rules never look verified", () => {
  assert.equal(decisionTrust("indicative", "high", true).level, "indicative");
  assert.equal(decisionTrust("verified", "unknown", true).level, "indicative");
  assert.equal(decisionTrust("reviewed", "high", true).level, "review");
});

test("analytics metadata is bounded and strips unsupported nested values", () => {
  const metadata = safeEventMetadata({
    long: "x".repeat(400),
    list: Array.from({ length: 20 }, (_, index) => `item-${index}`),
    nested: { secret: "not copied as an object" },
    missing: undefined,
  });
  assert.equal(String(metadata.long).length, 160);
  assert.equal((metadata.list as string[]).length, 12);
  assert.equal(typeof metadata.nested, "string");
  assert.equal("missing" in metadata, false);
});

test("a reliability session is stable in storage", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const first = reliabilitySessionId(storage);
  assert.equal(reliabilitySessionId(storage), first);
  assert.match(first, /^[0-9a-f-]{36}$/i);
});
