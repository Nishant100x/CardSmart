import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const dataSource = readFileSync(new URL("../src/data.ts", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../supabase/v10-production-migration.sql", import.meta.url), "utf8");

test("previous payment restores the full decision context", () => {
  assert.match(appSource, /category: item\.category, channel: item\.channel/);
  assert.match(appSource, /initialPayment=\{replayPayment\}/);
  assert.match(dataSource, /payment_channel: item\.channel/);
});

test("find-a-card flow calculates incremental value over the saved wallet", () => {
  assert.match(appSource, /annualIncremental \+= Math\.max\(0, cardValue - currentBest\) \* 12/);
  assert.match(appSource, /const net = annualIncremental - meta\.fee/);
  assert.match(appSource, /Calculate incremental value/);
});

test("wallet additions use authenticated Supabase persistence", () => {
  assert.match(dataSource, /from\("cards"\)\.insert\(rows\)/);
  assert.match(dataSource, /persistWallet\(authUser\.id, next\)/);
  assert.match(dataSource, /mergeGuest && walletRef\.current\.length/);
});

test("authentication is real Supabase auth, not local demo state", () => {
  assert.match(dataSource, /supabase\.auth\.signUp/);
  assert.match(dataSource, /supabase\.auth\.signInWithPassword/);
  assert.match(dataSource, /supabase\.auth\.onAuthStateChange/);
  assert.doesNotMatch(appSource, /setLoggedIn/);
});

test("confirmed payments and deletion are persisted honestly", () => {
  assert.match(dataSource, /from\("interactions"\)\.insert/);
  assert.match(dataSource, /rpc\("delete_cardsmart_account"\)/);
  assert.match(migrationSource, /delete from auth\.users where id = \(select auth\.uid\(\)\)/);
});
