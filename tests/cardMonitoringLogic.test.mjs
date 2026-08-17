import test from "node:test";
import assert from "node:assert/strict";
import {
  extractResponseText,
  isPdfSource,
  normalizeHtml,
  safeLimit,
  sourceIsDue,
} from "../supabase/functions/card-monitor/logic.ts";

test("normalizes issuer HTML without scripts, styles or markup noise", () => {
  const html = `
    <html><head><style>.hidden { display:none }</style><script>dynamic = 123</script></head>
    <body><!-- comment --><h1>5% &amp; more</h1><p>Up to&nbsp;₹2,000</p></body></html>`;
  assert.equal(normalizeHtml(html), "5% & more Up to ₹2,000");
});

test("recognizes PDF sources by MIME type or URL", () => {
  assert.equal(isPdfSource("application/pdf", "https://issuer.test/terms"), true);
  assert.equal(isPdfSource("application/octet-stream", "https://issuer.test/terms.pdf?x=1"), true);
  assert.equal(isPdfSource("text/html", "https://issuer.test/card"), false);
});

test("checks source frequency safely", () => {
  const now = Date.parse("2026-08-17T12:00:00Z");
  assert.equal(sourceIsDue(null, 24, now), true);
  assert.equal(sourceIsDue("2026-08-16T11:59:59Z", 24, now), true);
  assert.equal(sourceIsDue("2026-08-17T11:30:00Z", 24, now), false);
  assert.equal(sourceIsDue("not-a-date", 24, now), true);
});

test("extracts structured output and rejects refusals", () => {
  assert.equal(extractResponseText({ output: [{ content: [{ type: "output_text", text: '{"changes":[]}' }] }] }), '{"changes":[]}');
  assert.throws(() => extractResponseText({ output: [{ content: [{ type: "refusal", refusal: "No" }] }] }), /refused/);
});

test("caps requested monitoring batch size", () => {
  assert.equal(safeLimit(undefined), 5);
  assert.equal(safeLimit(0), 1);
  assert.equal(safeLimit(7.8), 7);
  assert.equal(safeLimit(50), 10);
});
