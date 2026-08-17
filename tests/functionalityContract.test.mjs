import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const repository = readFileSync(new URL("../src/catalogueRepository.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const monitor = readFileSync(new URL("../supabase/functions/card-monitor/index.ts", import.meta.url), "utf8");
const monitoringSql = readFileSync(new URL("../supabase/card-monitoring-setup.sql", import.meta.url), "utf8");

test("previous payment restores the full decision context", () => {
  assert.match(source, /setPurchaseCategory\(item\.category\)/);
  assert.match(source, /setPaymentChannel\(item\.paymentChannel\)/);
  assert.match(source, /full_response/);
});

test("check-a-card flow is wired to state and calculation", () => {
  assert.match(source, /value=\{consideredCardId\}/);
  assert.match(source, /setConsideredCardId\(event\.target\.value\)/);
  assert.match(source, /consideredUpgradeResult/);
});

test("wallet additions use authenticated Supabase persistence", () => {
  assert.match(source, /from\("cards"\)\.insert\(inserts\)/);
  assert.match(source, /await persistWallet\(authUser\.id, nextIds\)/);
  assert.match(source, /await loadWallet\(userId\)/);
});

test("published Supabase catalogue is primary with a bundled safety fallback", () => {
  assert.match(source, /loadPublishedCatalog\(\)/);
  assert.match(source, /FALLBACK_CATALOG/);
  assert.match(source, /setCatalog\(\[\.\.\.snapshot\.cards\]/);
  assert.match(repository, /from\("card_catalog"\)/);
  assert.match(repository, /card_versions!inner/);
  assert.match(repository, /eq\("card_versions\.status", "published"\)/);
});

test("opening screen explains all three product jobs and exposes stable routes", () => {
  assert.match(source, /Use the right card\./);
  assert.match(source, /Extra rewards found/);
  assert.match(source, /Whether a new card is worth it/);
  assert.match(source, /#\/\$\{route\}/);
});

test("public opening includes the complete production landing journey", () => {
  assert.match(source, /One product\. Three decisions\./);
  assert.match(source, /A real decision, made obvious/);
  assert.match(source, /How CardSmart works/);
  assert.match(source, /A recommendation with a higher bar/);
  assert.match(source, /Designed to need less data/);
  assert.match(source, /Questions, answered/);
  assert.match(source, /Stop guessing at checkout\./);
});

test("account deletion uses the production Supabase RPC", () => {
  assert.match(source, /supabase\.rpc\("delete_cardsmart_account"\)/);
  assert.match(source, /Delete my CardSmart data/);
});

test("account exposes a prominent resilient logout action", () => {
  assert.match(source, /className="account-logout-button"/);
  assert.match(source, /accountSigningOut/);
  assert.match(source, /We couldn’t log you out/);
  assert.match(css, /\.account-logout-button/);
});

test("monitoring is approval gated and never auto-publishes catalogue changes", () => {
  assert.match(monitor, /status: "pending"/);
  assert.doesNotMatch(monitor, /status:\s*"published"/);
  assert.match(monitoringSql, /card_source_snapshots/);
  assert.match(monitoringSql, /begin_card_monitoring_run/);
});
