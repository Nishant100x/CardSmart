"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import {
  confidenceLabel,
  evaluateCard,
  rankCards,
  type PaymentChannel,
  type PurchaseCategory,
  type RewardModel,
} from "./recommendationEngine";

type CardData = {
  id: string;
  bank: string;
  name: string;
  network: "VISA" | "Mastercard" | "RuPay" | "AMEX" | "Diners Club";
  colors: [string, string];
  accent: string;
  bestFor: string[];
  baseRate: number;
  rates: Record<string, number>;
  merchantRates?: Record<string, number>;
  cap: string;
  capUsed: number;
  trackedValue: number;
  note: string;
  rewardModel: RewardModel;
};

type CatalogueCardInput = {
  id: string;
  bank: string;
  name: string;
  network?: CardData["network"];
  bestFor: string[];
  baseRate?: number;
  rates?: Record<string, number>;
  merchantRates?: Record<string, number>;
  cap?: string;
  note?: string;
  rewardModel?: Partial<RewardModel>;
};

type ActivityItem = {
  id: string; merchant: string; amount: number; date: string; cardId: string;
  bestCard: string; reward: number; incremental: number; status: "tracked" | "checked";
};

type InteractionRow = {
  id: string;
  query: string | null;
  amount: number | string | null;
  best_card: string | null;
  best_card_id: string | null;
  estimated_reward: number | string | null;
  incremental_reward: number | string | null;
  status: "tracked" | "checked" | null;
  created_at: string;
};

type WalletRow = {
  id: string;
  user_id: string;
  card_id: string;
  cap_usage_value: number | string | null;
  cap_usage_source: "manual" | "tracked" | null;
  cap_usage_updated_at: string | null;
  created_at: string;
};

type RecommendationProfile = {
  name: string;
  mobile: string;
  ageBand: string;
  city: string;
  employment: string;
  incomeBand: string;
  creditScoreBand: string;
  primaryGoal: string;
  feeComfort: string;
};

type SpendProfile = {
  online: string;
  dining: string;
  travel: string;
  grocery: string;
  bills: string;
  fuel: string;
};

type ProfileRow = {
  name: string | null;
  mobile_number: string | null;
  city: string | null;
  income_range: string | null;
  work_status: string | null;
  primary_card_goal: string | null;
  annual_fee_comfort: string | null;
  age_range: string | null;
  credit_score_range: string | null;
  monthly_spends: Record<string, number | string> | null;
};

const BANK_THEMES: Record<string, { colors: [string, string]; accent: string }> = {
  "HDFC Bank": { colors: ["#314b7e", "#101a32"], accent: "#eef3ff" },
  "SBI Card": { colors: ["#245aa4", "#132853"], accent: "#e5efff" },
  "Axis Bank": { colors: ["#8e204d", "#3a1024"], accent: "#ffe1ec" },
  "ICICI Bank": { colors: ["#b54d25", "#4c1c12"], accent: "#ffe8d8" },
  "IDFC FIRST Bank": { colors: ["#7b1d3b", "#32101d"], accent: "#ffe0ea" },
  HSBC: { colors: ["#b4142c", "#4e0711"], accent: "#ffe0e5" },
  "American Express": { colors: ["#27799b", "#12394e"], accent: "#d9f5ff" },
  "IndusInd Bank": { colors: ["#5d326d", "#26122f"], accent: "#f2dcff" },
  "AU Small Finance Bank": { colors: ["#ec7a22", "#71320b"], accent: "#fff0d9" },
  "Kotak Mahindra Bank": { colors: ["#d42434", "#5f0b13"], accent: "#ffe1e4" },
  "Standard Chartered": { colors: ["#1b7568", "#0a3430"], accent: "#d9fff7" },
  "RBL Bank": { colors: ["#33457d", "#131d3e"], accent: "#e2e8ff" },
  "YES BANK": { colors: ["#1657a7", "#0b2b5c"], accent: "#e0edff" },
  BOBCARD: { colors: ["#d36a22", "#61280c"], accent: "#ffead9" },
  "Federal Bank": { colors: ["#255ca8", "#102b55"], accent: "#e1edff" },
  OneCard: { colors: ["#4b4c51", "#15161a"], accent: "#f3f3f4" },
};

function catalogueCard({
  id,
  bank,
  name,
  network = "VISA",
  bestFor,
  baseRate = 1,
  rates = {},
  merchantRates,
  cap = "Detailed caps and milestones being verified",
  note = "Illustrative prototype rate. Full issuer rules will be verified before production.",
  rewardModel,
}: CatalogueCardInput): CardData {
  const theme = BANK_THEMES[bank] ?? { colors: ["#4b5568", "#1f2632"] as [string, string], accent: "#f3f5f8" };
  return {
    id,
    bank,
    name,
    network,
    colors: theme.colors,
    accent: theme.accent,
    bestFor,
    baseRate,
    rates: { online: baseRate, dining: baseRate, travel: baseRate, grocery: baseRate, ...rates },
    merchantRates,
    cap,
    capUsed: 0,
    trackedValue: 0,
    note,
    rewardModel: {
      confidence: rewardModel?.confidence ?? "indicative",
      reviewedOn: rewardModel?.reviewedOn,
      rewardLabel: rewardModel?.rewardLabel ?? "Estimated reward value",
      exclusions: rewardModel?.exclusions,
      merchantRules: rewardModel?.merchantRules,
      categoryRates: rewardModel?.categoryRates,
      channelRates: rewardModel?.channelRates,
      defaultCapAmount: rewardModel?.defaultCapAmount,
      assumptions: rewardModel?.assumptions ?? ["Catalogue rate is indicative and has not yet been fully modelled against issuer terms."],
    },
  };
}

const CATALOG: CardData[] = [
  {
    id: "hdfc-swiggy",
    bank: "HDFC Bank",
    name: "Swiggy",
    network: "Mastercard",
    colors: ["#ff641e", "#cf341e"],
    accent: "#ffd6c2",
    bestFor: ["Food delivery", "Dining"],
    baseRate: 1,
    rates: { dining: 5, online: 1, grocery: 5 },
    merchantRates: { swiggy: 10 },
    cap: "₹1,500 cashback / month on Swiggy",
    capUsed: 0,
    trackedValue: 0,
    note: "10% on eligible Swiggy App spends, subject to a ₹1,500 billing-cycle cap.",
    rewardModel: {
      confidence: "verified",
      reviewedOn: "August 2026",
      rewardLabel: "Cashback",
      exclusions: ["fuel", "rent", "wallet", "government"],
      merchantRules: [
        { matches: ["swiggy"], rate: 10, channels: ["online", "app"], capAmount: 1500, label: "10% eligible Swiggy App cashback" },
        { matches: ["*"], rate: 5, channels: ["online", "app"], categories: ["shopping"], capAmount: 1500, label: "5% eligible online-category cashback" },
      ],
      categoryRates: { dining: 1, grocery: 1, travel: 1, shopping: 1, utilities: 1, education: 1, insurance: 1, other: 1 },
      assumptions: ["Non-Swiggy 5% eligibility depends on the merchant category code; unrecognised online spends use the 1% base rate."],
    },
  },
  {
    id: "sbi-cashback",
    bank: "SBI Card",
    name: "Cashback",
    network: "VISA",
    colors: ["#202b69", "#10183d"],
    accent: "#c8d1ff",
    bestFor: ["Online shopping", "Everyday"],
    baseRate: 1,
    rates: { online: 5, dining: 5, travel: 5, grocery: 5 },
    cap: "₹2,000 online + ₹2,000 offline cashback / statement cycle",
    capUsed: 0,
    trackedValue: 0,
    note: "From 1 Apr 2026: 5% eligible online and 1% eligible offline spends; ₹4,000 aggregate cycle cap.",
    rewardModel: {
      confidence: "verified",
      reviewedOn: "August 2026",
      rewardLabel: "Cashback",
      exclusions: ["utilities", "insurance", "fuel", "rent", "wallet", "education", "government"],
      channelRates: { online: 5, app: 5, offline: 1, upi: 1 },
      defaultCapAmount: 2000,
      assumptions: ["The applicable online/offline sub-cap is reduced by the cap usage entered for this card.", "Jewellery, railways, tolls and digital gaming are also excluded; enter the category explicitly when relevant."],
    },
  },
  {
    id: "axis-atlas",
    bank: "Axis Bank",
    name: "Atlas",
    network: "VISA",
    colors: ["#132b2b", "#071718"],
    accent: "#a9ffc8",
    bestFor: ["Flights", "Hotels"],
    baseRate: 2,
    rates: { travel: 5, dining: 2, online: 2 },
    cap: "Milestone-based EDGE Miles",
    capUsed: 0,
    trackedValue: 0,
    note: "5 EDGE Miles/₹100 on eligible travel and 2/₹100 on other eligible spends; value assumes ₹1 per EDGE Mile.",
    rewardModel: {
      confidence: "reviewed",
      reviewedOn: "August 2026",
      rewardLabel: "EDGE Miles value",
      categoryRates: { travel: 5 },
      assumptions: ["Uses ₹1 as the comparison value of one EDGE Mile.", "Travel acceleration is limited to eligible airlines, hotels and Travel EDGE; exact MCC recognition can vary."],
    },
  },
  {
    id: "hdfc-millennia",
    bank: "HDFC Bank",
    name: "Millennia",
    network: "VISA",
    colors: ["#584b82", "#25203d"],
    accent: "#e3dcff",
    bestFor: ["Partner brands", "Online"],
    baseRate: 1,
    rates: { online: 5, dining: 1, travel: 1, grocery: 1 },
    merchantRates: { swiggy: 5, amazon: 5, flipkart: 5 },
    cap: "₹1,000 cashback / month on 5% spends",
    capUsed: 0,
    trackedValue: 0,
    note: "5% on ten eligible partner merchants, capped at ₹1,000 per calendar month; 1% base cashback has a separate ₹1,000 cap.",
    rewardModel: {
      confidence: "verified",
      reviewedOn: "August 2026",
      rewardLabel: "CashPoints value",
      exclusions: ["fuel", "rent", "wallet", "government"],
      merchantRules: [{ matches: ["amazon", "bookmyshow", "cult.fit", "flipkart", "myntra", "sony liv", "swiggy", "tata cliq", "uber", "zomato"], rate: 5, capAmount: 1000, label: "5% Millennia partner cashback" }],
      defaultCapAmount: 1000,
      assumptions: ["Partner cashback depends on the issuer recognising the merchant ID.", "EMI transactions do not earn cashback."],
    },
  },
  {
    id: "amazon-icici",
    bank: "ICICI Bank",
    name: "Amazon Pay",
    network: "VISA",
    colors: ["#202226", "#050607"],
    accent: "#ffcd72",
    bestFor: ["Amazon", "Bills"],
    baseRate: 1,
    rates: { online: 1, dining: 1, travel: 1, grocery: 1 },
    merchantRates: { amazon: 5 },
    cap: "No published cashback cap",
    capUsed: 0,
    trackedValue: 0,
    note: "5% on Amazon.in assumes Prime membership; non-Prime earns 3%. Other eligible payments earn 1%.",
    rewardModel: {
      confidence: "reviewed",
      reviewedOn: "August 2026",
      rewardLabel: "Amazon Pay balance",
      merchantRules: [{ matches: ["amazon"], rate: 5, channels: ["online", "app"], categories: ["shopping", "travel"], label: "Amazon Prime purchase reward" }],
      assumptions: ["Amazon rate assumes an active Prime membership; choose another card if the user is non-Prime and the 3% rate changes the result.", "Amazon Pay partner merchants may earn 2% when paid through Amazon Pay."],
    },
  },
  {
    id: "hsbc-liveplus",
    bank: "HSBC",
    name: "Live+",
    network: "VISA",
    colors: ["#aa1428", "#5f0815"],
    accent: "#ffd0d6",
    bestFor: ["Dining", "Groceries"],
    baseRate: 1.5,
    rates: { dining: 10, grocery: 10, online: 1.5 },
    cap: "₹1,000 accelerated cashback / month",
    capUsed: 0,
    trackedValue: 0,
    note: "10% on eligible dining, food delivery and grocery spends, capped at ₹1,000 monthly; most other eligible spends earn 1.5%.",
    rewardModel: {
      confidence: "verified",
      reviewedOn: "August 2026",
      rewardLabel: "Cashback",
      exclusions: ["utilities"],
      merchantRules: [{ matches: ["*"], rate: 10, categories: ["dining", "grocery"], capAmount: 1000, label: "10% dining / food delivery / grocery cashback" }],
      assumptions: ["The ₹1,000 cap is shared across dining, food delivery and groceries."],
    },
  },
  {
    id: "hdfc-infinia",
    bank: "HDFC Bank",
    name: "Infinia Metal",
    network: "VISA",
    colors: ["#3b4148", "#101316"],
    accent: "#e6edf1",
    bestFor: ["Travel", "Premium spends"],
    baseRate: 3.3,
    rates: { travel: 3.3, online: 3.3, dining: 3.3, grocery: 3.3 },
    cap: "Base rewards plus channel-specific SmartBuy limits",
    capUsed: 0,
    trackedValue: 0,
    note: "5 Reward Points per ₹150 eligible retail spend. Value shown assumes ₹1 per point through eligible travel redemption.",
    rewardModel: {
      confidence: "reviewed",
      reviewedOn: "August 2026",
      rewardLabel: "Reward Point value",
      assumptions: ["Uses ₹1 per Reward Point; statement credit or other redemptions can be worth less.", "SmartBuy acceleration is not applied unless a specific verified booking route is modelled."],
    },
  },
  {
    id: "axis-ace",
    bank: "Axis Bank",
    name: "ACE",
    network: "VISA",
    colors: ["#7e183d", "#351020"],
    accent: "#ffd1e1",
    bestFor: ["Utility bills", "Everyday"],
    baseRate: 1.5,
    rates: { online: 1.5, dining: 1.5, grocery: 1.5 },
    merchantRates: { utilities: 5 },
    cap: "₹500 accelerated cashback / month",
    capUsed: 0,
    trackedValue: 0,
    note: "5% on eligible utilities via Google Pay, 4% on Swiggy/Zomato/Ola, and 1.5% on other eligible spends.",
    rewardModel: {
      confidence: "verified",
      reviewedOn: "August 2026",
      rewardLabel: "Cashback",
      exclusions: ["fuel", "rent", "wallet", "education", "insurance", "government"],
      merchantRules: [
        { matches: ["gpay", "google pay"], rate: 5, channels: ["app"], categories: ["utilities"], capAmount: 500, label: "5% Google Pay utility cashback" },
        { matches: ["swiggy", "zomato", "ola"], rate: 4, channels: ["online", "app"], capAmount: 500, label: "4% partner cashback" },
      ],
      assumptions: ["The ₹500 cap is shared across the 5% and 4% cashback buckets.", "Utilities paid outside Google Pay earn no cashback."],
    },
  },
  {
    id: "amex-mrcc",
    bank: "American Express",
    name: "Membership Rewards",
    network: "AMEX",
    colors: ["#2a7fa2", "#143d53"],
    accent: "#c9f2ff",
    bestFor: ["Milestones", "Rewards"],
    baseRate: 1,
    rates: { online: 1, dining: 1, travel: 1, grocery: 1 },
    cap: "Monthly transaction milestones",
    capUsed: 0,
    trackedValue: 0,
    note: "Base estimate assumes 1 MR point per ₹50 and ₹0.50 per point. Monthly milestone bonuses are shown as upside, not guaranteed value.",
    rewardModel: {
      confidence: "reviewed",
      reviewedOn: "August 2026",
      rewardLabel: "Membership Rewards value",
      exclusions: ["fuel", "insurance", "utilities"],
      assumptions: ["Uses ₹0.50 per Membership Rewards point.", "The 1,000-point bonus for four ₹1,500+ transactions is not included because monthly qualifying transaction count is not tracked."],
    },
  },
  catalogueCard({ id: "hdfc-regalia-gold", bank: "HDFC Bank", name: "Regalia Gold", bestFor: ["Travel", "Lounge"], baseRate: 1.3, rates: { travel: 2.6 } }),
  catalogueCard({ id: "hdfc-dcb-metal", bank: "HDFC Bank", name: "Diners Club Black Metal", network: "Diners Club", bestFor: ["Travel", "Premium rewards"], baseRate: 3.3, rates: { travel: 5 } }),
  catalogueCard({
    id: "hdfc-tata-neu-infinity", bank: "HDFC Bank", name: "Tata Neu Infinity", network: "RuPay", bestFor: ["Tata brands", "UPI"], baseRate: 1.5,
    merchantRates: { tata: 5 }, cap: "500 NeuCoins / month on eligible UPI payments",
    note: "5% NeuCoins on eligible Tata brands; up to 1.5% on eligible UPI via Tata Neu UPI ID.",
    rewardModel: {
      confidence: "verified", reviewedOn: "August 2026", rewardLabel: "NeuCoins value",
      exclusions: ["fuel", "wallet", "rent", "government"],
      merchantRules: [
        { matches: ["tata neu upi"], rate: 1.5, channels: ["upi"], capAmount: 500, label: "Tata Neu UPI reward" },
        { matches: ["tata"], rate: 5, channels: ["online", "app"], label: "Eligible Tata brand reward" },
        { matches: ["*"], rate: 0.5, channels: ["upi"], capAmount: 500, label: "Eligible RuPay UPI base reward" },
      ],
      assumptions: ["The extra 1% on UPI requires a Tata Neu UPI ID; other eligible UPI earns 0.5% from the card."],
    },
  }),
  catalogueCard({ id: "hdfc-tata-neu-plus", bank: "HDFC Bank", name: "Tata Neu Plus", network: "RuPay", bestFor: ["Tata brands", "UPI"], baseRate: 1, merchantRates: { tata: 2 } }),
  catalogueCard({ id: "hdfc-marriott-bonvoy", bank: "HDFC Bank", name: "Marriott Bonvoy", network: "Mastercard", bestFor: ["Marriott", "Hotels"], baseRate: 1.5, rates: { travel: 3 } }),
  catalogueCard({ id: "hdfc-indianoil", bank: "HDFC Bank", name: "IndianOil", network: "RuPay", bestFor: ["Fuel", "Groceries"], baseRate: 0.5 }),
  catalogueCard({ id: "hdfc-freedom", bank: "HDFC Bank", name: "Freedom", bestFor: ["Everyday", "Entry level"], baseRate: 0.5 }),
  catalogueCard({ id: "sbi-simplyclick", bank: "SBI Card", name: "SimplyCLICK", bestFor: ["Online shopping", "Partner brands"], baseRate: 0.25, rates: { online: 1.25 } }),
  catalogueCard({ id: "sbi-simplysave", bank: "SBI Card", name: "SimplySAVE", network: "RuPay", bestFor: ["Dining", "Groceries"], baseRate: 0.25, rates: { dining: 2.5, grocery: 2.5 } }),
  catalogueCard({ id: "sbi-prime", bank: "SBI Card", name: "PRIME", bestFor: ["Lifestyle", "Milestones"], baseRate: 0.5, rates: { dining: 2.5, grocery: 2.5 } }),
  catalogueCard({ id: "sbi-elite", bank: "SBI Card", name: "ELITE", bestFor: ["Lifestyle", "Movies"], baseRate: 0.5, rates: { dining: 1.25 } }),
  catalogueCard({ id: "sbi-bpcl-octane", bank: "SBI Card", name: "BPCL Octane", network: "RuPay", bestFor: ["BPCL fuel", "Dining"], baseRate: 0.25 }),
  catalogueCard({ id: "sbi-bpcl", bank: "SBI Card", name: "BPCL", network: "RuPay", bestFor: ["BPCL fuel", "Everyday"], baseRate: 0.25 }),
  catalogueCard({ id: "sbi-irctc-premier", bank: "SBI Card", name: "IRCTC Premier", network: "RuPay", bestFor: ["Rail travel", "IRCTC"], baseRate: 0.4, rates: { travel: 1.5 } }),
  catalogueCard({ id: "sbi-miles", bank: "SBI Card", name: "MILES", bestFor: ["Flights", "Travel rewards"], baseRate: 0.5, rates: { travel: 1 } }),
  catalogueCard({ id: "axis-magnus", bank: "Axis Bank", name: "Magnus", bestFor: ["Premium travel", "Milestones"], baseRate: 1.2, rates: { travel: 2.4 } }),
  catalogueCard({ id: "axis-burgundy-private", bank: "Axis Bank", name: "Burgundy Private", bestFor: ["Premium rewards", "Travel"], baseRate: 2, rates: { travel: 4 } }),
  catalogueCard({
    id: "axis-airtel", bank: "Axis Bank", name: "Airtel", network: "Mastercard", bestFor: ["Airtel bills", "Utilities"], baseRate: 1,
    merchantRates: { airtel: 25 }, cap: "Accelerated cashback cap depends on base cashback earned",
    note: "25% Airtel and 10% utility cashback requires Airtel Thanks App; current caps are linked to 1% base cashback earned in the cycle.",
    rewardModel: {
      confidence: "reviewed", reviewedOn: "August 2026", rewardLabel: "Cashback",
      merchantRules: [
        { matches: ["airtel"], rate: 25, channels: ["app"], label: "25% Airtel Thanks App cashback" },
        { matches: ["electricity", "gas bill", "utility"], rate: 10, channels: ["app"], categories: ["utilities"], label: "10% Airtel Thanks utility cashback" },
      ],
      assumptions: ["The dynamic cap cannot be calculated without the statement cycle's eligible 1% base cashback, so the displayed value is pre-cap."],
    },
  }),
  catalogueCard({ id: "axis-flipkart", bank: "Axis Bank", name: "Flipkart", bestFor: ["Flipkart", "Online shopping"], baseRate: 1, merchantRates: { flipkart: 5 } }),
  catalogueCard({ id: "axis-neo", bank: "Axis Bank", name: "Neo", network: "RuPay", bestFor: ["Partner offers", "Dining"], baseRate: 0.2 }),
  catalogueCard({ id: "axis-my-zone", bank: "Axis Bank", name: "My Zone", network: "RuPay", bestFor: ["Movies", "Food delivery"], baseRate: 0.2 }),
  catalogueCard({ id: "axis-indianoil", bank: "Axis Bank", name: "IndianOil", network: "RuPay", bestFor: ["IndianOil fuel", "UPI"], baseRate: 0.2 }),
  catalogueCard({ id: "axis-select", bank: "Axis Bank", name: "SELECT", bestFor: ["Lifestyle", "Lounge"], baseRate: 0.4 }),
  catalogueCard({ id: "axis-rewards", bank: "Axis Bank", name: "Rewards", network: "RuPay", bestFor: ["Department stores", "Everyday"], baseRate: 0.4 }),
  catalogueCard({ id: "icici-emeralde-private-metal", bank: "ICICI Bank", name: "Emeralde Private Metal", network: "Mastercard", bestFor: ["Premium travel", "Luxury"], baseRate: 1.5, rates: { travel: 3 } }),
  catalogueCard({ id: "icici-sapphiro", bank: "ICICI Bank", name: "Sapphiro", network: "Mastercard", bestFor: ["Lounge", "Movies"], baseRate: 0.5 }),
  catalogueCard({ id: "icici-rubyx", bank: "ICICI Bank", name: "Rubyx", network: "Mastercard", bestFor: ["Lifestyle", "Travel"], baseRate: 0.5 }),
  catalogueCard({ id: "icici-coral", bank: "ICICI Bank", name: "Coral", network: "RuPay", bestFor: ["Everyday", "Movies"], baseRate: 0.5 }),
  catalogueCard({ id: "icici-platinum-chip", bank: "ICICI Bank", name: "Platinum Chip", bestFor: ["Everyday", "Entry level"], baseRate: 0.5 }),
  catalogueCard({ id: "icici-makemytrip-signature", bank: "ICICI Bank", name: "MakeMyTrip Signature", bestFor: ["Flights", "Hotels"], baseRate: 0.5, rates: { travel: 2 } }),
  catalogueCard({ id: "icici-hpcl-super-saver", bank: "ICICI Bank", name: "HPCL Super Saver", network: "RuPay", bestFor: ["HPCL fuel", "Utilities"], baseRate: 0.5 }),
  catalogueCard({ id: "idfc-first-millennia", bank: "IDFC FIRST Bank", name: "FIRST Millennia", network: "RuPay", bestFor: ["Everyday", "UPI"], baseRate: 0.5 }),
  catalogueCard({ id: "idfc-first-classic", bank: "IDFC FIRST Bank", name: "FIRST Classic", network: "RuPay", bestFor: ["Everyday", "Rail lounge"], baseRate: 0.5 }),
  catalogueCard({ id: "idfc-first-select", bank: "IDFC FIRST Bank", name: "FIRST Select", bestFor: ["Travel", "Low forex"], baseRate: 0.75, rates: { travel: 1 } }),
  catalogueCard({ id: "idfc-first-wealth", bank: "IDFC FIRST Bank", name: "FIRST Wealth", bestFor: ["Travel", "Lounge"], baseRate: 0.75, rates: { travel: 1.5 } }),
  catalogueCard({ id: "idfc-first-wow", bank: "IDFC FIRST Bank", name: "FIRST WOW!", bestFor: ["Zero forex", "FD-backed"], baseRate: 0.5, rates: { travel: 0.5 } }),
  catalogueCard({ id: "idfc-first-power-plus", bank: "IDFC FIRST Bank", name: "FIRST Power+", network: "RuPay", bestFor: ["HPCL fuel", "UPI"], baseRate: 0.5 }),
  catalogueCard({ id: "idfc-mayura", bank: "IDFC FIRST Bank", name: "Mayura", bestFor: ["Travel", "Premium rewards"], baseRate: 1, rates: { travel: 2 } }),
  catalogueCard({ id: "idfc-ashva", bank: "IDFC FIRST Bank", name: "Ashva", bestFor: ["Travel", "Lifestyle"], baseRate: 0.75, rates: { travel: 1.5 } }),
  catalogueCard({ id: "hsbc-travelone", bank: "HSBC", name: "TravelOne", network: "Mastercard", bestFor: ["Flights", "Miles transfer"], baseRate: 1, rates: { travel: 2 } }),
  catalogueCard({ id: "hsbc-premier", bank: "HSBC", name: "Premier", network: "Mastercard", bestFor: ["Premium travel", "Miles transfer"], baseRate: 1.5, rates: { travel: 2 } }),
  catalogueCard({ id: "hsbc-visa-platinum", bank: "HSBC", name: "Visa Platinum", bestFor: ["Everyday", "Lifetime free"], baseRate: 0.5 }),
  catalogueCard({
    id: "amex-platinum-travel", bank: "American Express", name: "Platinum Travel", network: "AMEX", bestFor: ["Milestones", "Travel"], baseRate: 1,
    rates: { travel: 1 }, cap: "Annual spend milestones are not included in one-payment estimates",
    note: "Base estimate assumes 1 MR point per ₹50 and ₹0.50 per point; milestone value needs annual spend tracking.",
    rewardModel: {
      confidence: "reviewed", reviewedOn: "August 2026", rewardLabel: "Membership Rewards value",
      exclusions: ["fuel", "insurance", "utilities"],
      assumptions: ["Uses ₹0.50 per Membership Rewards point.", "Annual milestone bonuses are not added to a single-payment result."],
    },
  }),
  catalogueCard({ id: "amex-smartearn", bank: "American Express", name: "SmartEarn", network: "AMEX", bestFor: ["Partner brands", "Online"], baseRate: 0.5, rates: { online: 2.5 } }),
  catalogueCard({ id: "amex-platinum-reserve", bank: "American Express", name: "Platinum Reserve", network: "AMEX", bestFor: ["Lifestyle", "Lounge"], baseRate: 1 }),
  catalogueCard({ id: "amex-platinum", bank: "American Express", name: "Platinum Card", network: "AMEX", bestFor: ["Luxury travel", "Concierge"], baseRate: 1.5, rates: { travel: 3 } }),
  catalogueCard({ id: "indusind-eazydiner", bank: "IndusInd Bank", name: "EazyDiner", bestFor: ["Dining", "Restaurant discounts"], baseRate: 1, rates: { dining: 4 } }),
  catalogueCard({ id: "indusind-eazydiner-platinum", bank: "IndusInd Bank", name: "EazyDiner Platinum", network: "RuPay", bestFor: ["Dining", "UPI"], baseRate: 0.5, rates: { dining: 2 } }),
  catalogueCard({ id: "indusind-tiger", bank: "IndusInd Bank", name: "Tiger", bestFor: ["Travel", "Lifestyle"], baseRate: 1, rates: { travel: 1.5 } }),
  catalogueCard({ id: "indusind-legend", bank: "IndusInd Bank", name: "Legend", bestFor: ["Weekend spends", "Lifestyle"], baseRate: 0.75 }),
  catalogueCard({ id: "indusind-pioneer-legacy", bank: "IndusInd Bank", name: "Pioneer Legacy", bestFor: ["Premium banking", "Lifestyle"], baseRate: 0.75 }),
  catalogueCard({ id: "au-ixigo", bank: "AU Small Finance Bank", name: "ixigo", bestFor: ["Travel", "Zero forex"], baseRate: 1, rates: { travel: 2 } }),
  catalogueCard({ id: "au-lit", bank: "AU Small Finance Bank", name: "LIT", bestFor: ["Custom rewards", "Online"], baseRate: 1, rates: { online: 2 } }),
  catalogueCard({ id: "au-zenith-plus", bank: "AU Small Finance Bank", name: "Zenith+", network: "Mastercard", bestFor: ["Premium travel", "Lounge"], baseRate: 1.25, rates: { travel: 2 } }),
  catalogueCard({ id: "au-vetta", bank: "AU Small Finance Bank", name: "Vetta", bestFor: ["Lifestyle", "Lounge"], baseRate: 0.75 }),
  catalogueCard({ id: "au-altura-plus", bank: "AU Small Finance Bank", name: "Altura+", network: "RuPay", bestFor: ["Everyday", "UPI"], baseRate: 0.5 }),
  catalogueCard({ id: "kotak-zen", bank: "Kotak Mahindra Bank", name: "Zen", bestFor: ["Shopping", "Lifestyle"], baseRate: 1, rates: { online: 2 } }),
  catalogueCard({ id: "kotak-league-platinum", bank: "Kotak Mahindra Bank", name: "League Platinum", network: "RuPay", bestFor: ["Milestones", "Everyday"], baseRate: 0.5 }),
  catalogueCard({ id: "kotak-indianoil", bank: "Kotak Mahindra Bank", name: "IndianOil", network: "RuPay", bestFor: ["IndianOil fuel", "Dining"], baseRate: 0.5, rates: { dining: 2, grocery: 2 } }),
  catalogueCard({ id: "kotak-pvr-inox", bank: "Kotak Mahindra Bank", name: "PVR INOX", bestFor: ["Movies", "Entertainment"], baseRate: 0.5 }),
  catalogueCard({ id: "kotak-myntra", bank: "Kotak Mahindra Bank", name: "Myntra", network: "Mastercard", bestFor: ["Myntra", "Fashion"], baseRate: 0.5, merchantRates: { myntra: 5 } }),
  catalogueCard({ id: "sc-smart", bank: "Standard Chartered", name: "Smart", bestFor: ["Online cashback", "Everyday"], baseRate: 1, rates: { online: 2 } }),
  catalogueCard({ id: "sc-ultimate", bank: "Standard Chartered", name: "Ultimate", bestFor: ["Premium rewards", "Lounge"], baseRate: 3.3 }),
  catalogueCard({ id: "sc-rewards", bank: "Standard Chartered", name: "Rewards", bestFor: ["Milestones", "Lounge"], baseRate: 0.5 }),
  catalogueCard({ id: "sc-platinum-rewards", bank: "Standard Chartered", name: "Platinum Rewards", bestFor: ["Dining", "Fuel"], baseRate: 0.5, rates: { dining: 2.5 } }),
  catalogueCard({ id: "sc-easemytrip", bank: "Standard Chartered", name: "EaseMyTrip", bestFor: ["Travel bookings", "Hotels"], baseRate: 0.5, rates: { travel: 2 } }),
  catalogueCard({ id: "rbl-shoprite", bank: "RBL Bank", name: "ShopRite", network: "Mastercard", bestFor: ["Groceries", "Movies"], baseRate: 0.25, rates: { grocery: 5 } }),
  catalogueCard({ id: "rbl-world-safari", bank: "RBL Bank", name: "World Safari", network: "Mastercard", bestFor: ["Zero forex", "Travel"], baseRate: 0.5, rates: { travel: 1 } }),
  catalogueCard({ id: "rbl-play", bank: "RBL Bank", name: "Play", network: "Mastercard", bestFor: ["Movies", "Entertainment"], baseRate: 0.5 }),
  catalogueCard({ id: "rbl-salaryse-up", bank: "RBL Bank", name: "SalarySe UP", network: "RuPay", bestFor: ["UPI", "Everyday rewards"], baseRate: 1 }),
  catalogueCard({ id: "rbl-indianoil-xtra", bank: "RBL Bank", name: "IndianOil XTRA", network: "RuPay", bestFor: ["IndianOil fuel", "UPI"], baseRate: 0.5 }),
  catalogueCard({ id: "yes-marquee", bank: "YES BANK", name: "MARQUÉE", network: "Mastercard", bestFor: ["Premium rewards", "Low forex"], baseRate: 2, rates: { online: 3, travel: 3 } }),
  catalogueCard({ id: "yes-reserv", bank: "YES BANK", name: "RESERV", network: "Mastercard", bestFor: ["Travel", "Lifestyle"], baseRate: 1, rates: { travel: 2 } }),
  catalogueCard({ id: "yes-byoc", bank: "YES BANK", name: "BYOC", network: "RuPay", bestFor: ["Custom benefits", "UPI"], baseRate: 1 }),
  catalogueCard({ id: "yes-klick", bank: "YES BANK", name: "Klick", network: "RuPay", bestFor: ["UPI cashback", "Everyday"], baseRate: 1 }),
  catalogueCard({ id: "yes-elite-plus", bank: "YES BANK", name: "Elite+", bestFor: ["Lifestyle", "Lounge"], baseRate: 0.75 }),
  catalogueCard({ id: "bobcard-eterna", bank: "BOBCARD", name: "ETERNA", network: "Mastercard", bestFor: ["Travel", "Dining"], baseRate: 0.75, rates: { travel: 3.75, dining: 3.75, online: 3.75 } }),
  catalogueCard({ id: "bobcard-premier", bank: "BOBCARD", name: "PREMIER", network: "RuPay", bestFor: ["Travel", "Dining"], baseRate: 0.4, rates: { travel: 2, dining: 2 } }),
  catalogueCard({ id: "bobcard-select", bank: "BOBCARD", name: "SELECT", network: "RuPay", bestFor: ["Everyday", "UPI"], baseRate: 0.4 }),
  catalogueCard({ id: "bobcard-easy", bank: "BOBCARD", name: "Easy", network: "RuPay", bestFor: ["Groceries", "Everyday"], baseRate: 0.4, rates: { grocery: 1 } }),
  catalogueCard({ id: "bobcard-snapdeal", bank: "BOBCARD", name: "Snapdeal", network: "RuPay", bestFor: ["Snapdeal", "Online shopping"], baseRate: 0.4, merchantRates: { snapdeal: 2.5 } }),
  catalogueCard({ id: "bobcard-hpcl-energie", bank: "BOBCARD", name: "HPCL ENERGIE", network: "RuPay", bestFor: ["HPCL fuel", "UPI"], baseRate: 0.4 }),
  catalogueCard({ id: "federal-celesta", bank: "Federal Bank", name: "Celesta", bestFor: ["Travel", "Premium lifestyle"], baseRate: 1, rates: { travel: 2 } }),
  catalogueCard({ id: "federal-imperio", bank: "Federal Bank", name: "Imperio", bestFor: ["Healthcare", "Family spends"], baseRate: 0.75, rates: { grocery: 1 } }),
  catalogueCard({ id: "federal-signet", bank: "Federal Bank", name: "Signet", network: "RuPay", bestFor: ["Shopping", "Entertainment"], baseRate: 0.5, rates: { online: 1 } }),
  catalogueCard({ id: "federal-wave", bank: "Federal Bank", name: "Wave", network: "RuPay", bestFor: ["UPI", "Everyday"], baseRate: 0.5 }),
  catalogueCard({ id: "federal-scapia", bank: "Federal Bank", name: "Scapia", network: "VISA", bestFor: ["Travel", "Zero forex"], baseRate: 2, rates: { travel: 2 } }),
  catalogueCard({ id: "onecard-metal", bank: "OneCard", name: "Metal Card", bestFor: ["Top categories", "App controls"], baseRate: 0.2, rates: { online: 1 } }),
];

const DEFAULT_WALLET: string[] = [];

const EMPTY_PROFILE: RecommendationProfile = {
  name: "",
  mobile: "",
  ageBand: "",
  city: "",
  employment: "",
  incomeBand: "",
  creditScoreBand: "",
  primaryGoal: "",
  feeComfort: "",
};

const EMPTY_SPEND_PROFILE: SpendProfile = {
  online: "",
  dining: "",
  travel: "",
  grocery: "",
  bills: "",
  fuel: "",
};

const PROFILE_COLUMNS = "name, mobile_number, city, income_range, work_status, primary_card_goal, annual_fee_comfort, age_range, credit_score_range, monthly_spends";
const INTERACTION_COLUMNS = "id, query, amount, best_card, best_card_id, estimated_reward, incremental_reward, status, created_at";
const WALLET_COLUMNS = "id, user_id, card_id, cap_usage_value, cap_usage_source, cap_usage_updated_at, created_at";

function mobileDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(0, 10);
}

function normalizedIndianMobile(value: string) {
  const digits = mobileDigits(value);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : "";
}

function spendProfileFromDatabase(value: ProfileRow["monthly_spends"]): SpendProfile {
  const spends = value ?? {};
  return {
    online: spends.online ? String(spends.online) : "",
    dining: spends.dining ? String(spends.dining) : "",
    travel: spends.travel ? String(spends.travel) : "",
    grocery: spends.grocery ? String(spends.grocery) : "",
    bills: spends.bills ? String(spends.bills) : "",
    fuel: spends.fuel ? String(spends.fuel) : "",
  };
}

function profileFromDatabase(row: ProfileRow | null, fallbackName: string, fallbackMobile: string): RecommendationProfile {
  return {
    name: row?.name ?? fallbackName,
    mobile: mobileDigits(row?.mobile_number ?? fallbackMobile),
    ageBand: row?.age_range ?? "",
    city: row?.city ?? "",
    employment: row?.work_status ?? "",
    incomeBand: row?.income_range ?? "",
    creditScoreBand: row?.credit_score_range ?? "",
    primaryGoal: row?.primary_card_goal ?? "",
    feeComfort: row?.annual_fee_comfort ?? "",
  };
}

function activityFromDatabase(row: InteractionRow): ActivityItem {
  return {
    id: row.id,
    merchant: row.query || "Card recommendation",
    amount: Number(row.amount) || 0,
    date: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.created_at)),
    cardId: row.best_card_id || "",
    bestCard: row.best_card || "Recommended card",
    reward: Number(row.estimated_reward) || 0,
    incremental: Number(row.incremental_reward) || 0,
    status: row.status === "tracked" ? "tracked" : "checked",
  };
}

function uniqueKnownCardIds(ids: string[]) {
  const knownIds = new Set(CATALOG.map((card) => card.id));
  return Array.from(new Set(ids.filter((id) => knownIds.has(id))));
}

function capAmountFromRule(rule: string) {
  const match = rule.match(/₹\s*([\d,]+)/);
  return match ? Number(match[1].replace(/,/g, "")) || 0 : 0;
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.7 12 3l9 7.7"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-7h5v7"/></>,
    wallet: <><path d="M4 6.5h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h13"/><path d="M16 12h5"/><circle cx="16" cy="12" r=".5" fill="currentColor"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    shield: <><path d="M12 3 4.5 6v5.5c0 4.8 3.2 8 7.5 9.5 4.3-1.5 7.5-4.7 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    spark: <><path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z"/><path d="m18.5 15 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></>,
    edit: <><path d="M13.5 6.5 17.5 10.5"/><path d="m4 20 4.5-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    tune: <><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></>,
    gift: <><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 12h18"/><path d="M12 8H8.5a2.5 2.5 0 1 1 2.1-3.8L12 8Zm0 0h3.5a2.5 2.5 0 1 0-2.1-3.8L12 8Z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    phone: <><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18h3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function CardVisual({ card, compact = false }: { card: CardData; compact?: boolean }) {
  return (
    <div
      className={`credit-card ${compact ? "credit-card--compact" : ""}`}
      style={{ background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`, color: card.accent }}
    >
      <div className="card-glow" />
      <div className="card-topline">
        <span className="card-bank">{card.bank}</span>
        <span className="card-network">{card.network}</span>
      </div>
      <span className="card-chip" />
      <div className="card-bottomline">
        <span className="card-title">{card.name}</span>
        <span className="card-dots">••••</span>
      </div>
    </div>
  );
}

function shortBankName(bank: string) {
  return bank.replace(" Bank", "").replace(" Card", "");
}

const DATA_LOAD_TIMEOUT_MS = 15000;

async function withDataLoadTimeout<T>(request: PromiseLike<T>): Promise<T> {
  let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("CardSmart data request timed out")),
      DATA_LOAD_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

export default function Home() {
  const [view, setView] = useState<"home" | "result" | "wallet" | "explore" | "activity" | "profile">("home");
  const [merchant, setMerchant] = useState("Swiggy");
  const [amount, setAmount] = useState("2000");
  const [purchaseCategory, setPurchaseCategory] = useState<PurchaseCategory>("auto");
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>("auto");
  const [walletIds, setWalletIds] = useState(DEFAULT_WALLET);
  const [walletDraftIds, setWalletDraftIds] = useState(DEFAULT_WALLET);
  const [walletRows, setWalletRows] = useState<Record<string, WalletRow>>({});
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("All");
  const [requestSent, setRequestSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [usageCard, setUsageCard] = useState<CardData | null>(null);
  const [manualUsage, setManualUsage] = useState("");
  const [usageSource, setUsageSource] = useState<"manual" | "tracked">("manual");
  const [exploreMode, setExploreMode] = useState<"discover" | "compare">("discover");
  const [exploreCalculated, setExploreCalculated] = useState(false);
  const [spendProfile, setSpendProfile] = useState<SpendProfile>(EMPTY_SPEND_PROFILE);
  const [profile, setProfile] = useState<RecommendationProfile>(EMPTY_PROFILE);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "tracked" | "checked">("all");
  const [interactionSaving, setInteractionSaving] = useState(false);
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const signedIn = Boolean(authUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "login" | "verify">("signup");
  const [authForm, setAuthForm] = useState({ name: "", mobile: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [pendingAction, setPendingAction] = useState<"save_wallet" | "track_payment" | "activity" | "cap_usage" | "save_explore" | "save_profile" | null>(null);
  const walletIdsRef = useRef(walletIds);
  const walletAuthSyncRef = useRef(false);
  const authSubmitInProgressRef = useRef(false);
  const walletLoadRequestRef = useRef(0);
  const activityLoadRequestRef = useRef(0);
  const profileLoadRequestRef = useRef(0);
  const completeAccountActionRef = useRef<(action?: typeof pendingAction, signedInUserId?: string) => Promise<void>>(async () => {});
  const walletCards = useMemo(() => CATALOG
    .filter((card) => walletIds.includes(card.id))
    .map((card) => {
      const trackedValue = Number(walletRows[card.id]?.cap_usage_value) || 0;
      const capAmount = capAmountFromRule(card.cap);
      return {
        ...card,
        trackedValue,
        capUsed: capAmount ? Math.min(100, Math.round((trackedValue / capAmount) * 100)) : 0,
      };
    }), [walletIds, walletRows]);
  const requiredProfileValues = [profile.name, normalizedIndianMobile(profile.mobile), profile.city, profile.employment, profile.incomeBand, profile.primaryGoal, profile.feeComfort];
  const completedProfileFields = requiredProfileValues.filter(Boolean).length;
  const profileCompletion = Math.round((completedProfileFields / requiredProfileValues.length) * 100);
  const profileComplete = completedProfileFields === requiredProfileValues.length;
  const monthlyCardSpend = Object.values(spendProfile).reduce((total, value) => total + (Number(value) || 0), 0);
  const activityRewardTotal = activity.reduce((total, item) => total + (item.status === "tracked" ? item.reward : 0), 0);
  const activityIncrementalTotal = activity.reduce((total, item) => total + (item.status === "tracked" ? item.incremental : 0), 0);
  const trackedActivityCount = activity.filter((item) => item.status === "tracked").length;
  const trackedUsageTotal = usageCard ? activity.reduce((total, item) => total + (item.status === "tracked" && item.cardId === usageCard.id ? item.reward : 0), 0) : 0;
  const visibleActivity = activityFilter === "all" ? activity : activity.filter((item) => item.status === activityFilter);
  const upgradeResult = useMemo(() => {
    if (!walletCards.length || !monthlyCardSpend) return null;
    const spendEntries = Object.entries(spendProfile) as [keyof SpendProfile, string][];
    return CATALOG
      .filter((candidate) => !walletIds.includes(candidate.id))
      .map((candidate) => {
        let monthlyGain = 0;
        let largestGap = { category: "everyday spend", value: 0 };
        spendEntries.forEach(([category, rawAmount]) => {
          const categorySpend = Number(rawAmount) || 0;
          const categoryMap: Record<keyof SpendProfile, PurchaseCategory> = {
            online: "shopping", dining: "dining", travel: "travel", grocery: "grocery", bills: "utilities", fuel: "fuel",
          };
          const engineCategory = categoryMap[category];
          const input = { merchant: category, amount: categorySpend, category: engineCategory, channel: "online" as PaymentChannel };
          const currentValue = Math.max(...walletCards.map((card) => evaluateCard(card, input).value));
          const candidateValue = evaluateCard(candidate, input).value;
          const value = Math.max(0, candidateValue - currentValue);
          monthlyGain += value;
          if (value > largestGap.value) largestGap = { category, value };
        });
        return { card: candidate, annualValue: Math.round(monthlyGain * 12), reasonCategory: largestGap.category };
      })
      .sort((a, b) => b.annualValue - a.annualValue)[0] ?? null;
  }, [monthlyCardSpend, spendProfile, walletCards, walletIds]);
  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const ranked = useMemo(
    () => rankCards(walletCards, {
      merchant,
      amount: numericAmount,
      category: purchaseCategory,
      channel: paymentChannel,
    }),
    [merchant, numericAmount, paymentChannel, purchaseCategory, walletCards]
  );
  const winner = ranked[0];
  const runnerUp = ranked[1];
  const banks = ["All", ...Array.from(new Set(CATALOG.map((card) => card.bank)))];
  const bankCounts = CATALOG.reduce<Record<string, number>>((counts, card) => {
    counts[card.bank] = (counts[card.bank] ?? 0) + 1;
    return counts;
  }, {});
  const filteredCatalog = CATALOG.filter((card) => {
    const searchableText = `${card.bank} ${card.name} ${card.network} ${card.bestFor.join(" ")}`.toLowerCase();
    const matchSearch = searchableText.includes(search.toLowerCase());
    const matchBank = bankFilter === "All" || card.bank === bankFilter;
    return matchSearch && matchBank;
  });

  const persistInteraction = useCallback(async (
    userId: string,
    status: "checked" | "tracked",
    interactionId?: string | null,
  ) => {
    if (!winner) return false;
    const id = interactionId || crypto.randomUUID();
    const incrementalReward = Math.max(0, winner.value - (runnerUp?.value ?? 0));
    setInteractionSaving(true);
    setActivityError("");

    const { data, error } = await supabase
      .from("interactions")
      .upsert({
        id,
        user_id: userId,
        query: merchant.trim(),
        category: winner.category,
        amount: numericAmount,
        best_card: `${winner.card.bank} ${winner.card.name}`,
        best_card_id: winner.card.id,
        benefit: `₹${winner.value.toLocaleString("en-IN")} expected reward`,
        estimated_saving: winner.capAdjustment
          ? `₹${numericAmount.toLocaleString("en-IN")} × ${winner.rate}% = ₹${winner.grossValue.toLocaleString("en-IN")}, capped to ₹${winner.value.toLocaleString("en-IN")}`
          : `₹${numericAmount.toLocaleString("en-IN")} × ${winner.rate}% = ₹${winner.value.toLocaleString("en-IN")}`,
        estimated_reward: winner.value,
        incremental_reward: incrementalReward,
        reason: `${winner.card.bank} ${winner.card.name} gives the highest estimated eligible return for this payment among the cards in your wallet after applying the selected category, payment route, exclusions and known cap usage.`,
        full_response: {
          merchant: merchant.trim(),
          amount: numericAmount,
          category: winner.category,
          payment_channel: winner.channel,
          recommended_card: winner.card.id,
          estimated_rate: winner.rate,
          gross_reward: winner.grossValue,
          estimated_reward: winner.value,
          cap_adjustment: winner.capAdjustment,
          rule_confidence: winner.confidence,
          rule_label: winner.ruleLabel,
          assumptions: winner.assumptions,
          incremental_reward: incrementalReward,
        },
        status,
        tracked_at: status === "tracked" ? new Date().toISOString() : null,
      }, { onConflict: "id" })
      .select(INTERACTION_COLUMNS)
      .single();

    setInteractionSaving(false);
    if (error || !data) {
      setActivityError(status === "tracked"
        ? "Payment could not be tracked. Please try again."
        : "This recommendation could not be added to your activity.");
      return false;
    }

    const savedActivity = activityFromDatabase(data as InteractionRow);
    setActivity((current) => [savedActivity, ...current.filter((item) => item.id !== savedActivity.id)]);
    setCurrentInteractionId(savedActivity.id);
    if (status === "tracked") setConfirmed(true);
    return true;
  }, [merchant, numericAmount, runnerUp, winner]);

  const submitPayment = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!merchant.trim()) {
      setFormError("Tell us where or what you’re paying for.");
      return;
    }
    if (numericAmount <= 0) {
      setFormError("Enter a valid payment amount.");
      return;
    }
    if (!walletIds.length) {
      setFormError("");
      openWalletPicker();
      return;
    }
    setFormError("");
    setActivityError("");
    setConfirmed(false);
    setCurrentInteractionId(null);
    setView("result");
    if (authUser) void persistInteraction(authUser.id, "checked");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseExample = (name: string, value: string) => {
    setMerchant(name);
    setAmount(value);
    setFormError("");
  };

  useEffect(() => {
    walletIdsRef.current = walletIds;
  }, [walletIds]);

  const applyWalletRows = useCallback((rows: WalletRow[]) => {
    const nextRows: Record<string, WalletRow> = {};
    rows.forEach((row) => {
      if (CATALOG.some((card) => card.id === row.card_id) && !nextRows[row.card_id]) nextRows[row.card_id] = row;
    });
    const nextIds = Object.keys(nextRows);
    walletIdsRef.current = nextIds;
    setWalletRows(nextRows);
    setWalletIds(nextIds);
    setWalletDraftIds(nextIds);
  }, []);

  const loadWallet = useCallback(async (userId: string) => {
    const requestId = ++walletLoadRequestRef.current;
    setWalletLoading(true);
    setWalletError("");
    try {
      const { data, error } = await withDataLoadTimeout(supabase
        .from("cards")
        .select(WALLET_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: true }));
      if (requestId !== walletLoadRequestRef.current) return false;
      if (error) {
        setWalletError("We couldn’t load your wallet. Please try again.");
        return false;
      }
      applyWalletRows((data ?? []) as WalletRow[]);
      return true;
    } catch {
      if (requestId !== walletLoadRequestRef.current) return false;
      setWalletError("We couldn’t load your wallet. Please refresh and try again.");
      return false;
    } finally {
      if (requestId === walletLoadRequestRef.current) setWalletLoading(false);
    }
  }, [applyWalletRows]);

  const persistWallet = useCallback(async (userId: string, requestedIds: string[]) => {
    const nextIds = uniqueKnownCardIds(requestedIds);
    setWalletSaving(true);
    setWalletError("");

    const { data: existingData, error: loadError } = await supabase
      .from("cards")
      .select(WALLET_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (loadError) {
      setWalletSaving(false);
      setWalletError("Your wallet couldn’t be saved. Please try again.");
      return false;
    }

    const existingRows = (existingData ?? []) as WalletRow[];
    const existingKnownIds = uniqueKnownCardIds(existingRows.map((row) => row.card_id));
    const idsToAdd = nextIds.filter((id) => !existingKnownIds.includes(id));
    const idsToRemove = existingKnownIds.filter((id) => !nextIds.includes(id));

    if (idsToAdd.length) {
      const inserts = idsToAdd.map((id) => {
        const card = CATALOG.find((item) => item.id === id)!;
        return {
          user_id: userId,
          card_id: card.id,
          bank: card.bank,
          name: card.name,
          rate: `${card.baseRate}% base reward`,
          benefits: card.bestFor,
          details: card,
          is_preset: true,
          icon: "💳",
        };
      });
      const { error } = await supabase.from("cards").insert(inserts);
      if (error) {
        setWalletSaving(false);
        setWalletError("Your wallet couldn’t be saved. Please try again.");
        return false;
      }
    }

    if (idsToRemove.length) {
      const { error } = await supabase
        .from("cards")
        .delete()
        .eq("user_id", userId)
        .in("card_id", idsToRemove);
      if (error) {
        setWalletSaving(false);
        setWalletError("Some wallet changes didn’t save. We reloaded the latest version.");
        await loadWallet(userId);
        return false;
      }
    }

    const loaded = await loadWallet(userId);
    setWalletSaving(false);
    return loaded;
  }, [loadWallet]);

  const openWalletPicker = () => {
    setWalletDraftIds(walletIds);
    setWalletError("");
    setPickerOpen(true);
  };

  const toggleDraftCard = (id: string) => {
    setWalletDraftIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const saveWalletDraft = async () => {
    const nextIds = uniqueKnownCardIds(walletDraftIds);
    if (!authUser) {
      walletIdsRef.current = nextIds;
      setWalletIds(nextIds);
      setPickerOpen(false);
      requireAccount("save_wallet");
      return;
    }
    const saved = await persistWallet(authUser.id, nextIds);
    if (saved) {
      setPickerOpen(false);
      setAuthNotice(nextIds.length ? "Wallet saved. Your cards now stay in sync." : "Wallet cleared.");
    }
  };

  const removeWalletCard = async (id: string) => {
    const nextIds = walletIds.filter((cardId) => cardId !== id);
    if (!authUser) {
      walletIdsRef.current = nextIds;
      setWalletIds(nextIds);
      setWalletDraftIds(nextIds);
      return;
    }
    const saved = await persistWallet(authUser.id, nextIds);
    if (saved) setAuthNotice("Card removed from your wallet.");
  };

  const saveCapUsage = async (value: number | null) => {
    if (!usageCard || !authUser) return;
    setWalletSaving(true);
    setWalletError("");
    const { error } = await supabase
      .from("cards")
      .update({
        cap_usage_value: value,
        cap_usage_source: value === null ? null : usageSource,
        cap_usage_updated_at: value === null ? null : new Date().toISOString(),
      })
      .eq("user_id", authUser.id)
      .eq("card_id", usageCard.id);
    if (error) {
      setWalletSaving(false);
      setWalletError("Cap usage couldn’t be saved. Please try again.");
      return;
    }
    await loadWallet(authUser.id);
    setWalletSaving(false);
    setUsageCard(null);
    setAuthNotice(value === null ? "Cap usage cleared." : "Cap usage saved.");
  };

  useEffect(() => {
    const saved = window.localStorage.getItem("cardsmart-guest-session");
    if (!saved) return;
    try {
      const guest = JSON.parse(saved) as { walletIds?: string[]; merchant?: string; amount?: string };
      // Restoring a browser session is intentionally a one-time external-state sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guest.walletIds?.length) {
        const restoredIds = uniqueKnownCardIds(guest.walletIds);
        walletIdsRef.current = restoredIds;
        setWalletIds(restoredIds);
        setWalletDraftIds(restoredIds);
      }
      if (guest.merchant) setMerchant(guest.merchant);
      if (guest.amount) setAmount(guest.amount);
    } catch { window.localStorage.removeItem("cardsmart-guest-session"); }
  }, []);

  const completeAccountAction = useCallback(async (action = pendingAction, signedInUserId?: string) => {
    setAuthBusy(false);
    setAuthOpen(false);
    let walletSaved = true;
    if (action === "save_wallet") {
      const userId = signedInUserId || authUser?.id;
      walletAuthSyncRef.current = true;
      const saved = userId ? await persistWallet(userId, walletIdsRef.current) : false;
      walletAuthSyncRef.current = false;
      walletSaved = saved;
      if (saved) setAuthNotice("Wallet saved. Your cards now stay in sync.");
    }
    else if (action === "track_payment") {
      const userId = signedInUserId || authUser?.id;
      if (userId) void persistInteraction(userId, "tracked", currentInteractionId);
    }
    else if (action === "save_profile") setAuthNotice("Profile saved. Recommendations can now use these details.");
    else if (action === "save_explore") {
      setAuthNotice("Your wallet upgrade has been calculated.");
      setExploreCalculated(true);
      setView("explore");
    }
    else if (!action) setAuthNotice("You’re logged in.");
    if (action === "activity") setView("activity");
    if (action === "cap_usage" && usageCard) setManualUsage(String(usageCard.trackedValue || ""));
    if (action === "save_profile") {
      setProfileSaved(true);
      setView("profile");
    }
    setPendingAction(null);
    window.localStorage.removeItem("cardsmart-pending-action");
    if (walletSaved) window.localStorage.removeItem("cardsmart-guest-session");
  }, [authUser?.id, currentInteractionId, pendingAction, persistInteraction, persistWallet, usageCard]);

  completeAccountActionRef.current = completeAccountAction;

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextUser = data.session?.user ?? null;
      setAuthUser((current) => current?.id === nextUser?.id ? current : nextUser);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setAuthUser((current) => current?.id === nextUser?.id ? current : nextUser);
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        const savedAction = window.localStorage.getItem("cardsmart-pending-action") as typeof pendingAction;
        if (savedAction === "save_wallet") walletAuthSyncRef.current = true;
        if (savedAction && !authSubmitInProgressRef.current) {
          setPendingAction(savedAction);
          window.localStorage.removeItem("cardsmart-pending-action");
          window.setTimeout(() => void completeAccountActionRef.current(savedAction, session.user.id), 0);
        }
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (signedIn) return;
    window.localStorage.setItem("cardsmart-guest-session", JSON.stringify({ walletIds, merchant, amount, returnView: view }));
  }, [walletIds, merchant, amount, view, signedIn]);

  useEffect(() => {
    if (!authUser) {
      walletLoadRequestRef.current += 1;
      setWalletRows({});
      setWalletLoading(false);
      return;
    }
    if (walletAuthSyncRef.current) return;
    void loadWallet(authUser.id);
  }, [authUser, loadWallet]);

  useEffect(() => {
    if (!authUser) {
      profileLoadRequestRef.current += 1;
      setProfileLoading(false);
      return;
    }
    const requestId = ++profileLoadRequestRef.current;

    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const { data, error } = await withDataLoadTimeout(supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", authUser.id)
          .maybeSingle());

        if (requestId !== profileLoadRequestRef.current) return;
        if (error) {
          setProfileError("We couldn’t load your profile. Please try again.");
          return;
        }

        const row = data as ProfileRow | null;
        const metadataName = typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : "";
        const metadataMobile = typeof authUser.user_metadata?.mobile_number === "string" ? authUser.user_metadata.mobile_number : "";
        setProfile(profileFromDatabase(row, metadataName, metadataMobile));
        setSpendProfile(spendProfileFromDatabase(row?.monthly_spends ?? null));
      } catch {
        if (requestId !== profileLoadRequestRef.current) return;
        setProfileError("We couldn’t load your profile. Please refresh and try again.");
      } finally {
        if (requestId === profileLoadRequestRef.current) setProfileLoading(false);
      }
    };

    void loadProfile();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      activityLoadRequestRef.current += 1;
      setActivity([]);
      setActivityLoading(false);
      return;
    }
    const requestId = ++activityLoadRequestRef.current;

    const loadActivity = async () => {
      setActivityLoading(true);
      setActivityError("");
      try {
        const { data, error } = await withDataLoadTimeout(supabase
          .from("interactions")
          .select(INTERACTION_COLUMNS)
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(100));

        if (requestId !== activityLoadRequestRef.current) return;
        if (error) {
          setActivityError("We couldn’t load your saved activity. Please try again.");
          return;
        }
        setActivity(((data ?? []) as InteractionRow[]).map(activityFromDatabase));
      } catch {
        if (requestId !== activityLoadRequestRef.current) return;
        setActivityError("We couldn’t load your saved activity. Please refresh and try again.");
      } finally {
        if (requestId === activityLoadRequestRef.current) setActivityLoading(false);
      }
    };

    void loadActivity();
  }, [authUser]);

  const requireAccount = (action: typeof pendingAction) => {
    if (signedIn) return true;
    setPendingAction(action);
    if (action) window.localStorage.setItem("cardsmart-pending-action", action);
    setAuthMode("signup");
    setAuthError("");
    setAuthOpen(true);
    return false;
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email);
    const fullName = authForm.name.trim().replace(/\s+/g, " ");
    const mobileNumber = normalizedIndianMobile(authForm.mobile);
    if (authMode === "signup" && fullName.length < 2) return setAuthError("Enter your full name.");
    if (authMode === "signup" && !mobileNumber) return setAuthError("Enter a valid 10-digit Indian mobile number.");
    if (!validEmail) return setAuthError("Enter a valid email address.");
    if (authForm.password.length < 8) return setAuthError("Password must be at least 8 characters.");
    setAuthError("");
    setAuthBusy(true);
    if (!isSupabaseConfigured) {
      setAuthBusy(false);
      return setAuthError("Account service is not configured yet.");
    }
    if (authMode === "signup") {
      authSubmitInProgressRef.current = true;
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email.trim().toLowerCase(),
        password: authForm.password,
        options: {
          data: { name: fullName, mobile_number: mobileNumber },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      authSubmitInProgressRef.current = false;
      setAuthBusy(false);
      if (error) return setAuthError(error.message);
      if (data.session) void completeAccountAction(pendingAction, data.user?.id);
      else setAuthMode("verify");
      return;
    }
    authSubmitInProgressRef.current = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authForm.email.trim().toLowerCase(),
      password: authForm.password,
    });
    authSubmitInProgressRef.current = false;
    setAuthBusy(false);
    if (error) return setAuthError(error.message);
    void completeAccountAction(pendingAction, data.user?.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    walletIdsRef.current = [];
    setWalletIds([]);
    setWalletDraftIds([]);
    setWalletRows({});
    setWalletError("");
    setWalletLoading(false);
    setWalletSaving(false);
    setProfile(EMPTY_PROFILE);
    setSpendProfile(EMPTY_SPEND_PROFILE);
    setProfileSaved(false);
    setExploreCalculated(false);
    setConfirmed(false);
    setActivity([]);
    setActivityError("");
    setCurrentInteractionId(null);
    setView("home");
    setAuthNotice("You’re logged out.");
    window.localStorage.removeItem("cardsmart-guest-session");
    window.localStorage.removeItem("cardsmart-pending-action");
  };

  const openProtectedView = (nextView: "wallet" | "activity") => {
    if (nextView === "activity" && !requireAccount("activity")) return;
    setView(nextView);
  };

  const openProfile = () => {
    if (!signedIn) {
      setAuthMode("login");
      setAuthError("");
      setAuthOpen(true);
      return;
    }
    setView("profile");
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const mobileNumber = normalizedIndianMobile(profile.mobile);
    if (!profile.name.trim() || !mobileNumber || !profile.city.trim() || !profile.employment || !profile.incomeBand || !profile.primaryGoal || !profile.feeComfort) {
      setProfileError("Complete the required fields before saving.");
      return;
    }
    setProfileError("");
    if (!requireAccount("save_profile")) return;

    if (!authUser) return;
    setProfileSaving(true);
    const normalizedName = profile.name.trim().replace(/\s+/g, " ");
    const monthlySpends = Object.fromEntries(
      Object.entries(spendProfile).map(([category, value]) => [category, Number(value) || 0])
    );
    const { error } = await supabase.from("profiles").upsert({
      id: authUser.id,
      name: normalizedName,
      mobile_number: mobileNumber,
      city: profile.city.trim(),
      income_range: profile.incomeBand,
      work_status: profile.employment,
      primary_card_goal: profile.primaryGoal,
      annual_fee_comfort: profile.feeComfort,
      age_range: profile.ageBand || null,
      credit_score_range: profile.creditScoreBand || null,
      monthly_spends: monthlySpends,
    }, { onConflict: "id" });

    if (error) {
      setProfileSaving(false);
      setProfileError("Your profile wasn’t saved. Please try again.");
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { name: normalizedName, mobile_number: mobileNumber } });
    if (metadataError) {
      setProfileSaving(false);
      setProfileError("Your details were saved, but your display name could not be updated. Please try once more.");
      return;
    }

    setProfile((current) => ({ ...current, name: normalizedName, mobile: mobileDigits(mobileNumber), city: current.city.trim() }));
    setProfileSaving(false);
    setProfileSaved(true);
    setAuthNotice("Profile saved. Recommendations can now use these details.");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => setView("home")} aria-label="CardSmart home">
            <span className="brand-mark"><span>C</span></span>
            <span className="brand-copy"><strong>CardSmart</strong><small>Pick right. Pay smart.</small></span>
          </button>
          <nav className="side-nav" aria-label="Primary navigation">
            <button className={view === "home" || view === "result" ? "active" : ""} onClick={() => setView("home")}>
              <span>Pay</span>
            </button>
            <button className={view === "wallet" ? "active" : ""} onClick={() => openProtectedView("wallet")}>
              <span>My cards</span><small>{walletIds.length}</small>
            </button>
            <button className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}>
              <span>Find a card</span>
            </button>
            <button className={view === "activity" ? "active" : ""} onClick={() => openProtectedView("activity")}>
              <span>Savings</span>{activity.length > 0 && <small>{activity.length}</small>}
            </button>
          </nav>
          <button className="profile-button" onClick={openProfile}>
            <span className="avatar">{signedIn ? (profile.name?.[0] || authUser?.user_metadata?.name?.[0] || authUser?.email?.[0] || "U").toUpperCase() : <Icon name="user" size={17}/>}</span>
            <span><strong>{signedIn ? (profile.name || authUser?.email) : "Log in"}</strong><small>{signedIn ? "Profile" : "Save your wallet"}</small></span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <header className="mobile-header">
          <button className="brand" onClick={() => setView("home")} aria-label="CardSmart home">
            <span className="brand-mark"><span>C</span></span><span className="brand-copy"><strong>CardSmart</strong><small>Pay smarter</small></span>
          </button>
          <button className="avatar" aria-label={signedIn ? "Open profile" : "Log in"} onClick={openProfile}>{signedIn ? (profile.name?.[0] || authUser?.user_metadata?.name?.[0] || authUser?.email?.[0] || "U").toUpperCase() : <Icon name="user" size={17}/>}</button>
        </header>

        {view === "home" && (
          <div className="home-page page-enter">
            {authNotice && <div className="auth-success"><Icon name="check" size={17}/><span>{authNotice}</span><button onClick={() => setAuthNotice("")}><Icon name="close" size={15}/></button></div>}
            <section className="home-stage">
              <div className="hero-command-layout">
                <div className="hero-copy">
                  <span className="eyebrow"><Icon name="spark" size={15} /> Your cards can do better</span>
                  <h1>Know the right card<br className="desktop-break" /> before you pay.</h1>
                  <p>Enter where you’re paying and the amount. We’ll compare the cards you own and show the one that earns you the most.</p>
                </div>
                <aside className={`hero-verdict ${winner ? "hero-verdict--ready" : ""}`}>
                  {winner ? (
                    <>
                      <span className="hero-verdict-label">Best for this payment</span>
                      <CardVisual card={winner.card} compact />
                      <div className="hero-verdict-copy"><strong>{shortBankName(winner.card.bank)} {winner.card.name}</strong><span>Earn about ₹{winner.value.toLocaleString("en-IN")}</span></div>
                      {runnerUp && winner.value > runnerUp.value && <div className="hero-extra"><Icon name="spark" size={15}/><strong>₹{(winner.value - runnerUp.value).toLocaleString("en-IN")} more</strong><span>than your next best card</span></div>}
                    </>
                  ) : (
                    <>
                      <span className="hero-verdict-label">One clear answer</span>
                      <div className="hero-card-stack" aria-hidden="true">
                        {CATALOG.slice(0, 3).map((card, index) => <span key={card.id} style={{ background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`, transform: `translateY(${index * 18}px) rotate(${(index - 1) * 6}deg)` }}/>) }
                      </div>
                      <div className="hero-verdict-copy"><strong>Add the cards you own</strong><span>We’ll rank only the cards you can actually use.</span></div>
                    </>
                  )}
                </aside>
              </div>

              <div className="payment-panel">
              <div className="command-heading"><span className="command-dot"/><div><span>Ready when you are</span><strong>Where are you paying?</strong></div></div>
              <form onSubmit={submitPayment}>
                <div className="field-group">
                  <label htmlFor="merchant">Store, app or purchase</label>
                  <div className="input-shell input-shell--merchant">
                    <Icon name="search" />
                    <input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Swiggy, Amazon or flight tickets" autoComplete="off" />
                  </div>
                </div>
                <div className="field-group amount-group">
                  <label htmlFor="amount">How much?</label>
                  <div className="input-shell input-shell--amount">
                    <span className="currency">₹</span>
                    <input id="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
                  </div>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button className="primary-button find-button" type="submit">
                  Find my best card <Icon name="arrow" />
                </button>
                <details className="payment-settings">
                  <summary><Icon name="tune" size={16}/><span>Card or UPI? Choose only if it matters</span><small>Optional</small><Icon name="chevron" size={15}/></summary>
                  <div className="payment-context">
                    <label>
                      <span>Spend category</span>
                      <select value={purchaseCategory} onChange={(e) => setPurchaseCategory(e.target.value as PurchaseCategory)}>
                        <option value="auto">Let CardSmart detect it</option>
                        <option value="dining">Dining / food delivery</option>
                        <option value="grocery">Groceries</option>
                        <option value="shopping">Shopping</option>
                        <option value="travel">Travel</option>
                        <option value="utilities">Utilities / recharge</option>
                        <option value="fuel">Fuel</option>
                        <option value="rent">Rent</option>
                        <option value="education">Education</option>
                        <option value="insurance">Insurance</option>
                        <option value="government">Government / tax</option>
                        <option value="wallet">Wallet load</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label>
                      <span>Payment method</span>
                      <select value={paymentChannel} onChange={(e) => setPaymentChannel(e.target.value as PaymentChannel)}>
                        <option value="auto">Let CardSmart detect it</option>
                        <option value="online">Online card payment</option>
                        <option value="offline">In-store card payment</option>
                        <option value="upi">UPI with RuPay card</option>
                        <option value="app">Required app / partner checkout</option>
                      </select>
                    </label>
                    <p><Icon name="info" size={14}/> We usually detect this automatically. Change it only if you know exactly how you’ll pay.</p>
                  </div>
                </details>
              </form>
              <div className="example-row">
                <span>Try an example</span>
                <div className="example-chips">
                  <button onClick={() => chooseExample("Swiggy", "2000")}>Swiggy · ₹2,000</button>
                  <button onClick={() => chooseExample("Amazon", "5000")}>Amazon · ₹5,000</button>
                  <button onClick={() => chooseExample("Flight tickets", "18000")}>Flight · ₹18,000</button>
                  <button onClick={() => chooseExample("Groceries", "3500")}>Groceries · ₹3,500</button>
                </div>
              </div>
              </div>
              <div className="home-trust-row"><span><Icon name="shield" size={16}/> No card number, CVV or OTP</span><span><Icon name="check" size={16}/> Compares only cards you own</span><span><Icon name="spark" size={16}/> Shows the money difference</span></div>
            </section>

            {signedIn && (!walletIds.length || !profileComplete) && (
              <section className="setup-card">
                <div className="setup-copy"><span className="mini-label">Make it yours</span><h2>Two quick steps. Better answers every time.</h2><p>Add only card names and your broad preferences. No bank login or sensitive card details.</p></div>
                <div className="setup-steps">
                  <button className={walletIds.length ? "done" : ""} onClick={openWalletPicker}>
                    <span>{walletIds.length ? <Icon name="check" size={16}/> : "1"}</span><div><strong>{walletIds.length ? `${walletIds.length} cards added` : "Add the cards you own"}</strong><small>{walletIds.length ? "Edit wallet" : "So we compare only your cards"}</small></div><Icon name="chevron" size={17}/>
                  </button>
                  <button className={profileComplete ? "done" : ""} onClick={() => setView("profile")}>
                    <span>{profileComplete ? <Icon name="check" size={16}/> : "2"}</span><div><strong>{profileComplete ? "Profile complete" : "Complete your profile"}</strong><small>{profileComplete ? "Review details" : "About 2 minutes"}</small></div><Icon name="chevron" size={17}/>
                  </button>
                </div>
              </section>
            )}

            <section className="wallet-preview">
              <div className="section-heading">
                <div><span className="mini-label">Your wallet</span><h2>{walletIds.length ? `${walletIds.length} ${walletIds.length === 1 ? "card" : "cards"}, ready to compare` : "Add your cards once. Ask anytime."}</h2></div>
                {walletIds.length > 0 && <button className="text-button" onClick={openWalletPicker}>Manage cards <Icon name="chevron" size={16} /></button>}
              </div>
              <div className="wallet-strip">
                {walletCards.map((card, index) => (
                  <div className="wallet-mini-card" key={card.id} style={{ zIndex: walletCards.length - index }}>
                    <CardVisual card={card} compact />
                  </div>
                ))}
                {!walletCards.length && (
                  <div className="empty-wallet-card">
                    <span><Icon name="wallet" size={22}/></span>
                    <div><strong>Your wallet starts empty</strong><p>Add only the cards you actually own. We never need the card number.</p></div>
                    <button className="secondary-button" onClick={openWalletPicker}><Icon name="plus" size={16}/> Add my cards</button>
                  </div>
                )}
              </div>
            </section>

            <div className="security-line"><Icon name="shield" size={17} /> Card names only. No card number, CVV, OTP or bank access.</div>
          </div>
        )}

        {view === "result" && winner && (
          <div className="result-page page-enter">
            <button className="back-button" onClick={() => setView("home")}><Icon name="back" size={18} /> Check another payment</button>
            <div className="result-heading">
              <span className="transaction-pill"><span>{merchant}</span><strong>₹{numericAmount.toLocaleString("en-IN")}</strong></span>
              <span className="eyebrow">{winner.eligible ? "Best card for this payment" : "No reward on this payment"}</span>
              <h1>{winner.eligible ? <>Use <span>{shortBankName(winner.card.bank)} {winner.card.name}</span></> : "Your cards won’t earn rewards here"}</h1>
              <p>{winner.eligible ? `About ₹${winner.value.toLocaleString("en-IN")} back on this payment${runnerUp && winner.value > runnerUp.value ? `, ₹${(winner.value - runnerUp.value).toLocaleString("en-IN")} more than your next best card` : ""}.` : "This type of payment is excluded across the cards currently in your wallet."}</p>
            </div>

            <section className="winner-panel">
              <div className="winner-card-wrap">
                <div className="best-badge"><Icon name={winner.eligible ? "check" : "info"} size={14} /> {winner.eligible ? "Use this card" : "Excluded"}</div>
                <CardVisual card={winner.card} />
              </div>
              <div className="reward-summary">
                <span className="summary-label">Expected reward</span>
                <div className="reward-value">₹{winner.value.toLocaleString("en-IN")}</div>
                <div className="reward-rate">{winner.eligible ? `${winner.rate}% back on this payment` : winner.ruleLabel}</div>
                {runnerUp && (
                  <div className="extra-value"><Icon name="spark" size={16} />
                    {winner.value > runnerUp.value
                      ? <><strong>₹{(winner.value - runnerUp.value).toLocaleString("en-IN")} extra</strong> versus your next-best card</>
                      : <><strong>Same return</strong> as your next-best card</>}
                  </div>
                )}
              </div>
              <details className="calculation-box">
                <summary><span>See why this wins</span><Icon name="chevron" size={16}/></summary>
                <div className="calculation-content">
                  <span className={`rule-confidence rule-confidence--${winner.confidence}`}>{confidenceLabel(winner.confidence)}</span>
                  {winner.eligible ? (
                    <>
                      <div className="reward-math"><strong>₹{numericAmount.toLocaleString("en-IN")}</strong><span>×</span><strong>{winner.rate}%</strong><span>=</span><strong className="green-text">₹{winner.grossValue.toLocaleString("en-IN")}</strong></div>
                      {winner.capAdjustment > 0 && <div className="cap-adjustment"><span>Adjusted for rewards already earned</span><strong>−₹{winner.capAdjustment.toLocaleString("en-IN")}</strong><span>=</span><strong className="green-text">₹{winner.value.toLocaleString("en-IN")}</strong></div>}
                    </>
                  ) : <div className="excluded-calculation"><Icon name="info" size={18}/><strong>0% because this category is excluded</strong></div>}
                  <p>{winner.card.note}</p>
                  {winner.assumptions.length > 0 && <ul>{winner.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>}
                </div>
              </details>
            </section>

            <section className="comparison-section">
              <div className="section-heading">
                <div><span className="mini-label">Your other options</span><h2>How the rest of your wallet compares</h2></div>
                <button className="text-button" onClick={openWalletPicker}><Icon name="edit" size={16} /> Edit wallet</button>
              </div>
              <div className="comparison-table">
                {ranked.map((item, index) => (
                  <div className={`comparison-row ${index === 0 ? "comparison-row--winner" : ""}`} key={item.card.id}>
                    <span className="rank">{index + 1}</span>
                    <span className="card-swatch" style={{ background: `linear-gradient(135deg, ${item.card.colors[0]}, ${item.card.colors[1]})` }} />
                    <div className="comparison-name"><strong>{item.card.bank} {item.card.name}</strong><span>{item.eligible ? `${item.rate}% · ${confidenceLabel(item.confidence)}` : item.ruleLabel}{item.capAdjustment > 0 ? ` · ₹${item.capAdjustment.toLocaleString("en-IN")} capped` : ""}</span></div>
                    <div className="comparison-value"><strong>₹{item.value.toLocaleString("en-IN")}</strong>{index === 0 && <span>{item.eligible ? "Best" : "Excluded"}</span>}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="result-actions">
              {confirmed ? (
                <div className="confirmed-state"><span><Icon name="check" /></span><div><strong>Payment saved</strong><p>We’ll remember the reward so your next answer stays accurate.</p></div></div>
              ) : (
                <button
                  className="primary-button"
                  disabled={interactionSaving}
                  onClick={() => authUser
                    ? void persistInteraction(authUser.id, "tracked", currentInteractionId)
                    : requireAccount("track_payment")}
                >
                  {interactionSaving ? "Saving…" : signedIn ? "I used this card" : "Save this result"} {!interactionSaving && <Icon name={signedIn ? "check" : "arrow"} />}
                </button>
              )}
              <button className="secondary-button" onClick={() => setView("home")}>Check another payment</button>
            </section>
            {activityError && <p className="profile-form-error"><Icon name="info" size={15}/>{activityError}</p>}
            <p className="estimate-note"><Icon name="info" size={15} /> Estimates depend on issuer recognition and current terms. Open “Why this card?” to review the rule and assumptions before paying.</p>
          </div>
        )}

        {view === "wallet" && (
          <div className="wallet-page page-enter">
            <div className="wallet-page-heading">
              <div><span className="eyebrow">My cards</span><h1>{walletIds.length ? "Know what each card is best at." : "Start with the cards you own."}</h1><p>{walletIds.length ? "See where every card wins and whether you’re close to its monthly reward limit." : "Add your actual cards once. CardSmart will compare only what you can really use."}</p></div>
              {walletIds.length > 0 && <button className="primary-button add-card-button" onClick={openWalletPicker}><Icon name="plus" /> Add a card</button>}
            </div>
            {walletIds.length > 0 && !walletLoading && (
              <section className="wallet-overview">
                <div><span>Wallet ready</span><strong>{walletIds.length}</strong><small>{walletIds.length === 1 ? "card available" : "cards compared every time"}</small></div>
                <div><span>Reward caps updated</span><strong>{walletCards.filter((card) => card.trackedValue > 0).length}/{walletIds.length}</strong><small>Improve ranking accuracy</small></div>
                <button onClick={() => setView("home")}><span><Icon name="spark" size={17}/></span><div><strong>Use my wallet</strong><small>Check a payment now</small></div><Icon name="arrow" size={17}/></button>
              </section>
            )}
            {walletError && <div className="wallet-error"><Icon name="info" size={17}/><span>{walletError}</span></div>}
            {walletLoading ? (
              <div className="profile-loading"><span className="profile-loading-dot"/>Loading your saved wallet…</div>
            ) : !walletIds.length ? (
              <section className="wallet-empty-state">
                <div className="empty-state-icon"><Icon name="wallet" size={28}/></div>
                <span className="mini-label">No cards added</span>
                <h2>Build your wallet in under a minute</h2>
                <p>Search by bank or card name and select every credit card you currently use. No card number, CVV, expiry or OTP required.</p>
                <button className="primary-button" onClick={openWalletPicker}><Icon name="plus"/> Add my cards</button>
                <div className="privacy-points"><span><Icon name="check" size={14}/> Only card names</span><span><Icon name="check" size={14}/> Editable anytime</span><span><Icon name="check" size={14}/> No bank access</span></div>
              </section>
            ) : (
              <>
              {!profileComplete && (
                <section className="profile-nudge">
                  <div><span className="mini-label">Next step</span><h2>Your wallet is ready. Now make the advice personal.</h2><p>Add income, spending and reward preferences. It takes about 2 minutes.</p></div>
                  <button className="primary-button" onClick={openProfile}>Complete my profile <Icon name="arrow"/></button>
                </section>
              )}
              <section className="wallet-grid">
                {walletCards.map((card) => (
                <article className="wallet-card" key={card.id}>
                  <CardVisual card={card} />
                  <div className="wallet-card-content">
                    <div className="wallet-title-row"><div><span>{card.bank}</span><h2>{card.name}</h2><small className={`catalog-confidence catalog-confidence--${card.rewardModel.confidence}`}>{confidenceLabel(card.rewardModel.confidence)}</small></div><button disabled={walletSaving} aria-label={`Remove ${card.name}`} onClick={() => void removeWalletCard(card.id)}><Icon name="close" size={17} /></button></div>
                    <div className="best-for"><span>Best for</span>{card.bestFor.map((item) => <strong key={item}>{item}</strong>)}</div>
                    <div className="cap-block">
                      <div className="cap-title"><span>Estimated cap used</span><strong>{capAmountFromRule(card.cap) ? `${card.capUsed}%` : card.trackedValue ? `₹${card.trackedValue.toLocaleString("en-IN")} entered` : "Not set"}</strong></div>
                      <div className="cap-track"><span style={{ width: `${card.capUsed}%` }} /></div>
                      <p>{card.cap}</p>
                    </div>
                    <button className="card-detail-link" onClick={() => { setUsageCard(card); setUsageSource(walletRows[card.id]?.cap_usage_source === "tracked" ? "tracked" : "manual"); if (signedIn) setManualUsage(String(card.trackedValue || "")); else requireAccount("cap_usage"); }}>Update rewards earned <Icon name="chevron" size={16} /></button>
                  </div>
                </article>
                ))}
                <button className="wallet-add-tile" onClick={openWalletPicker}><span><Icon name="plus" /></span><strong>Add another card</strong><p>Search our card catalogue</p></button>
              </section>
              <div className="wallet-disclaimer"><Icon name="info" size={18} /><div><strong>Cap usage starts at zero</strong><p>It changes only when you update it or confirm a payment inside CardSmart.</p></div></div>
              </>
            )}
          </div>
        )}

        {view === "explore" && (
          <div className="product-page page-enter">
            <div className="product-heading"><div><span className="eyebrow"><Icon name="compass" size={15} /> Your next card</span><h1>Only add a card that earns its place.</h1><p>CardSmart compares every option with what you already own, then shows only the value your wallet is missing.</p></div></div>
            {!walletIds.length ? (
              <section className="explore-empty-state">
                <div className="empty-state-icon"><Icon name="wallet" size={28}/></div><span className="mini-label">Wallet needed first</span><h2>We can’t measure an upgrade without knowing your current cards.</h2><p>Add the cards you own. Then we’ll exclude them and calculate only the additional value a new card can create.</p><button className="primary-button" onClick={openWalletPicker}><Icon name="plus"/> Add my current cards</button>
              </section>
            ) : (
              <>
                <div className="mode-switch" role="tablist"><button className={exploreMode === "discover" ? "active" : ""} onClick={() => { setExploreMode("discover"); setExploreCalculated(false); }}>Find my missing card</button><button className={exploreMode === "compare" ? "active" : ""} onClick={() => { setExploreMode("compare"); setExploreCalculated(false); }}>Check a card I want</button></div>
                <section className="explore-layout">
                  <div className="spend-card"><span className="mini-label">Your monthly spend</span><h2>Help us calculate real incremental value</h2><p>Approximate numbers are fine. These values also update your recommendation profile.</p>
                    <div className="spend-grid">{Object.entries(spendProfile).map(([key, value]) => <label key={key}><span>{key[0].toUpperCase() + key.slice(1)}</span><div className="mini-input"><b>₹</b><input inputMode="numeric" value={value} onChange={(e) => { setSpendProfile({ ...spendProfile, [key]: e.target.value.replace(/[^0-9]/g, "") }); setExploreCalculated(false); }} placeholder="0" /></div></label>)}</div>
                    {exploreMode === "compare" && <label className="considering-field"><span>Card you’re considering</span><div className="input-shell"><Icon name="search"/><input placeholder={`Search from ${CATALOG.length} cards`} /></div></label>}
                    <button className="primary-button full-button" disabled={profileComplete && !monthlyCardSpend} onClick={() => { if (!profileComplete) { openProfile(); return; } if (requireAccount("save_explore")) setExploreCalculated(true); }}>{!profileComplete ? "Complete profile to see my upgrade" : !monthlyCardSpend ? "Add monthly spend to continue" : "Calculate my best upgrade"} <Icon name="arrow" /></button>
                  </div>
                  {exploreCalculated && upgradeResult ? (
                    <aside className="upgrade-preview"><div className="preview-badge"><Icon name="spark" size={14}/> Your best upgrade</div><span className="mini-label">A card worth considering</span><h2>{upgradeResult.card.bank} {upgradeResult.card.name}</h2><span className={`rule-confidence rule-confidence--${upgradeResult.card.rewardModel.confidence}`}>{confidenceLabel(upgradeResult.card.rewardModel.confidence)}</span><div className="annual-value"><strong>+₹{upgradeResult.annualValue.toLocaleString("en-IN")}</strong><span>estimated extra value / year<br/>before annual fee</span></div><div className="value-reason"><span>Why it helps</span><p>It creates the biggest estimated improvement on your {upgradeResult.reasonCategory} spend versus the cards you already own.</p></div><div className="assumption-line"><Icon name="info" size={15}/><span>We apply reward limits and excluded spends wherever the card’s current terms are available. Always check the issuer’s latest terms before applying.</span></div></aside>
                  ) : (
                    <aside className="upgrade-preview upgrade-preview--locked"><div className="locked-icon"><Icon name={profileComplete ? "spark" : "user"} size={22}/></div><span className="mini-label">{profileComplete ? "Ready when you are" : "Personalisation needed"}</span><h2>No made-up recommendation here.</h2><p>{profileComplete ? "Enter your typical monthly spend and calculate. We’ll compare every eligible new card against your actual wallet." : "Complete your profile and monthly spend first. Then CardSmart can explain exactly where a new card improves your current wallet."}</p>{!profileComplete && <button className="secondary-button" onClick={openProfile}>Complete my profile <Icon name="arrow" size={16}/></button>}</aside>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {view === "profile" && signedIn && (
          <div className="product-page profile-page page-enter">
            <div className="profile-page-heading">
              <div><span className="eyebrow"><Icon name="user" size={15}/> Recommendation profile</span><h1>Make every answer fit you.</h1><p>These details help CardSmart judge value, fees and suitability. We don’t ask for PAN, card numbers or bank access.</p></div>
              <div className="profile-progress"><div><span>Profile completion</span><strong>{profileCompletion}%</strong></div><div className="profile-progress-track"><span style={{ width: `${profileCompletion}%` }}/></div><small>{profileComplete ? "Ready for personalised recommendations" : `${requiredProfileValues.length - completedProfileFields} required details left`}</small></div>
            </div>

            {profileSaved && <div className="auth-success profile-success"><Icon name="check" size={17}/><span>Profile saved. Your next recommendation can use these details.</span><button onClick={() => setProfileSaved(false)}><Icon name="close" size={15}/></button></div>}
            {profileLoading && <div className="profile-loading"><span className="profile-loading-dot"/>Loading your saved profile…</div>}

            <div className="profile-layout">
              <form className="profile-form" onSubmit={saveProfile}>
                <section className="profile-form-section">
                  <div className="profile-section-heading"><span>1</span><div><h2>About you</h2><p>Basic context for relevant card and eligibility suggestions.</p></div></div>
                  <div className="profile-fields three-columns">
                    <label><span>Full name *</span><input value={profile.name} onChange={(e) => setProfile({...profile, name:e.target.value})} placeholder="Your name" autoComplete="name"/></label>
                    <label><span>Mobile number *</span><input type="tel" inputMode="numeric" value={profile.mobile} onChange={(e) => setProfile({...profile, mobile:mobileDigits(e.target.value)})} placeholder="10-digit mobile number" autoComplete="tel-national" maxLength={10}/></label>
                    <label><span>Age range <em>Optional</em></span><select value={profile.ageBand} onChange={(e) => setProfile({...profile, ageBand:e.target.value})}><option value="">Select age range</option><option>18–24</option><option>25–34</option><option>35–44</option><option>45–54</option><option>55+</option></select></label>
                    <label><span>City *</span><input value={profile.city} onChange={(e) => setProfile({...profile, city:e.target.value})} placeholder="e.g. Gurgaon" autoComplete="address-level2"/></label>
                  </div>
                </section>

                <section className="profile-form-section">
                  <div className="profile-section-heading"><span>2</span><div><h2>Financial fit</h2><p>Enough to screen suggestions, without collecting sensitive financial documents.</p></div></div>
                  <div className="profile-fields three-columns">
                    <label><span>Work status *</span><select value={profile.employment} onChange={(e) => setProfile({...profile, employment:e.target.value})}><option value="">Select work status</option><option>Salaried</option><option>Self-employed professional</option><option>Business owner</option><option>Student</option><option>Retired</option><option>Other</option></select></label>
                    <label><span>Monthly take-home income *</span><select value={profile.incomeBand} onChange={(e) => setProfile({...profile, incomeBand:e.target.value})}><option value="">Select income range</option><option>Below ₹25,000</option><option>₹25,000–₹49,999</option><option>₹50,000–₹99,999</option><option>₹1,00,000–₹1,99,999</option><option>₹2,00,000–₹4,99,999</option><option>₹5,00,000+</option></select></label>
                    <label><span>Credit score range <em>Optional</em></span><select value={profile.creditScoreBand} onChange={(e) => setProfile({...profile, creditScoreBand:e.target.value})}><option value="">I don’t know</option><option>Below 650</option><option>650–699</option><option>700–749</option><option>750–799</option><option>800+</option><option>New to credit</option></select></label>
                  </div>
                </section>

                <section className="profile-form-section">
                  <div className="profile-section-heading"><span>3</span><div><h2>What you want from a card</h2><p>This changes what “best” means for you.</p></div></div>
                  <div className="profile-fields two-columns">
                    <label><span>Primary goal *</span><select value={profile.primaryGoal} onChange={(e) => setProfile({...profile, primaryGoal:e.target.value})}><option value="">Choose your priority</option><option>Simple cashback</option><option>Travel rewards</option><option>Premium benefits</option><option>Low fees</option><option>Build credit history</option></select></label>
                    <label><span>Annual fee comfort *</span><select value={profile.feeComfort} onChange={(e) => setProfile({...profile, feeComfort:e.target.value})}><option value="">Choose fee comfort</option><option>Lifetime free only</option><option>Up to ₹1,000</option><option>Up to ₹3,000</option><option>Up to ₹10,000</option><option>Any fee if value is higher</option></select></label>
                  </div>
                </section>

                <section className="profile-form-section">
                  <div className="profile-section-heading"><span>4</span><div><h2>Typical monthly card spend</h2><p>Approximate amounts are enough. Leave a category at zero if you rarely use a card there.</p></div></div>
                  <div className="profile-spend-grid">{Object.entries(spendProfile).map(([key, value]) => <label key={key}><span>{key[0].toUpperCase() + key.slice(1)}</span><div><b>₹</b><input inputMode="numeric" value={value} onChange={(e) => { setSpendProfile({...spendProfile, [key]:e.target.value.replace(/[^0-9]/g, "")}); setExploreCalculated(false); }} placeholder="0"/></div></label>)}</div>
                  <div className="spend-total"><span>Estimated monthly card spend</span><strong>₹{monthlyCardSpend.toLocaleString("en-IN")}</strong></div>
                </section>

                {profileError && <p className="profile-form-error"><Icon name="info" size={15}/>{profileError}</p>}
                <div className="profile-form-actions"><button type="button" className="secondary-button" onClick={() => setView("home")}>Cancel</button><button type="submit" className="primary-button" disabled={profileLoading || profileSaving}>{profileSaving ? "Saving…" : "Save my profile"} {!profileSaving && <Icon name="check"/>}</button></div>
              </form>

              <aside className="profile-summary-card">
                <span className="mini-label">What CardSmart knows</span><h2>Your profile at a glance</h2>
                <div className="profile-summary-table">
                  <div><span>Account</span><strong>{authUser?.email}</strong></div>
                  <div><span>Name</span><strong>{profile.name || authUser?.user_metadata?.name || "Not added"}</strong></div>
                  <div><span>Mobile</span><strong>{profile.mobile ? `+91 ${profile.mobile}` : "Not added"}</strong></div>
                  <div><span>Location</span><strong>{profile.city || "Not added"}</strong></div>
                  <div><span>Work</span><strong>{profile.employment || "Not added"}</strong></div>
                  <div><span>Income</span><strong>{profile.incomeBand || "Not added"}</strong></div>
                  <div><span>Credit score</span><strong>{profile.creditScoreBand || "Not shared"}</strong></div>
                  <div><span>Primary goal</span><strong>{profile.primaryGoal || "Not added"}</strong></div>
                  <div><span>Fee comfort</span><strong>{profile.feeComfort || "Not added"}</strong></div>
                  <div><span>Monthly card spend</span><strong>{monthlyCardSpend ? `₹${monthlyCardSpend.toLocaleString("en-IN")}` : "Not added"}</strong></div>
                  <div><span>Cards owned</span><strong>{walletIds.length ? `${walletIds.length} ${walletIds.length === 1 ? "card" : "cards"}` : "None added"}</strong></div>
                </div>
                <div className="profile-why"><Icon name="shield" size={18}/><div><strong>Used for recommendations only</strong><p>CardSmart does not need exact income, PAN, card numbers, CVV, expiry dates or banking OTPs.</p></div></div>
                <button className="profile-logout" onClick={() => void signOut()}>Log out of CardSmart</button>
              </aside>
            </div>
          </div>
        )}

        {view === "activity" && (
          <div className="product-page page-enter">
            <div className="product-heading activity-heading"><div><span className="eyebrow"><Icon name="clock" size={15} /> Your smart-payment history</span><h1>See what better choices add up to.</h1><p>Every check is a decision. Confirmed payments show the extra value CardSmart helped you unlock.</p></div></div>
            {activity.length > 0 && <section className="savings-scoreboard"><div className="savings-primary"><span>Extra value tracked</span><strong>₹{activityIncrementalTotal.toLocaleString("en-IN")}</strong><small>versus the next-best cards in your wallet</small></div><div><span>Total expected rewards</span><strong>₹{activityRewardTotal.toLocaleString("en-IN")}</strong><small>{trackedActivityCount} confirmed {trackedActivityCount === 1 ? "payment" : "payments"}</small></div><button onClick={() => setView("home")}><Icon name="plus" size={16}/> Check another payment</button></section>}
            {activityLoading ? (
              <div className="profile-loading"><span className="profile-loading-dot"/>Loading your saved activity…</div>
            ) : activityError && !activity.length ? (
              <section className="activity-empty-state"><div className="empty-state-icon"><Icon name="info" size={28}/></div><span className="mini-label">Couldn’t load activity</span><h2>Your saved history is still protected.</h2><p>{activityError}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again <Icon name="arrow"/></button></section>
            ) : activity.length ? (
              <><div className="activity-toolbar"><div className="activity-tabs"><button className={activityFilter === "all" ? "active" : ""} onClick={() => setActivityFilter("all")}>All</button><button className={activityFilter === "tracked" ? "active" : ""} onClick={() => setActivityFilter("tracked")}>Tracked payments</button><button className={activityFilter === "checked" ? "active" : ""} onClick={() => setActivityFilter("checked")}>Only checked</button></div></div>
              {visibleActivity.length ? <section className="activity-list">{visibleActivity.map((item) => { const card = CATALOG.find((c) => c.id === item.cardId); const cardLabel = card ? `${shortBankName(card.bank)} ${card.name}` : item.bestCard; return <article className="activity-row" key={item.id}><div className="merchant-mark">{item.merchant.slice(0,1)}</div><div className="activity-main"><span>{item.date}</span><h2>{item.merchant}</h2><p>₹{item.amount.toLocaleString("en-IN")} · Recommended {cardLabel}</p></div><div className="activity-value"><span>Expected reward</span><strong>₹{item.reward.toLocaleString("en-IN")}</strong><small>₹{item.incremental.toLocaleString("en-IN")} extra</small></div><span className={`status-pill ${item.status}`}>{item.status === "tracked" ? "Payment tracked" : "Only checked"}</span><button className="repeat-button" onClick={() => { setMerchant(item.merchant); setAmount(String(item.amount)); setView("home"); }} aria-label={`Repeat ${item.merchant} calculation`}><Icon name="chevron"/></button></article>; })}</section> : <section className="activity-empty-state"><span className="mini-label">No matching activity</span><h2>Nothing in this view yet.</h2><p>Try another activity filter or check a new payment.</p></section>}
              <p className="estimate-note"><Icon name="info" size={15}/> “Expected rewards” are estimates. CardSmart does not have access to your bank statement in this prototype.</p></>
            ) : (
              <section className="activity-empty-state"><div className="empty-state-icon"><Icon name="clock" size={28}/></div><span className="mini-label">Nothing tracked yet</span><h2>Your activity will build from your real decisions.</h2><p>Check a payment, choose a recommended card and confirm what you used. We won’t show sample transactions as if they were yours.</p><button className="primary-button" onClick={() => setView("home")}>Check my first payment <Icon name="arrow"/></button></section>
            )}
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={view === "home" || view === "result" ? "active" : ""} onClick={() => setView("home")}><Icon name="spark" /><span>Pay</span></button>
        <button className={view === "wallet" ? "active" : ""} onClick={() => openProtectedView("wallet")}><Icon name="wallet" /><span>Cards</span></button>
        <button className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}><Icon name="compass" /><span>Get a card</span></button>
        <button className={view === "activity" ? "active" : ""} onClick={() => openProtectedView("activity")}><Icon name="clock" /><span>Savings</span></button>
      </nav>

      {usageCard && <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target && !walletSaving) setUsageCard(null); }}><section className="usage-modal" role="dialog" aria-modal="true" aria-labelledby="usage-title"><button className="close-button usage-close" disabled={walletSaving} onClick={() => setUsageCard(null)}><Icon name="close"/></button><span className="mini-label">Usage setup</span><h2 id="usage-title">Update {usageCard.name} usage</h2><p className="usage-intro">This helps us avoid recommending a reward rate after you have already exhausted its cap.</p><div className="usage-rule"><Icon name="gift"/><div><span>Reward rule being tracked</span><strong>{usageCard.cap}</strong></div></div><label className="usage-field"><span>How much reward have you already earned in this period?</span><div className="input-shell input-shell--amount"><b>₹</b><input inputMode="numeric" disabled={usageSource === "tracked"} value={usageSource === "tracked" ? String(trackedUsageTotal) : manualUsage} onChange={(e) => setManualUsage(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0"/></div></label><div className="source-choice"><button className={usageSource === "manual" ? "active" : ""} onClick={() => setUsageSource("manual")}><Icon name="edit" size={15}/><span><strong>User entered</strong><small>Includes usage outside CardSmart</small></span></button><button className={usageSource === "tracked" ? "active" : ""} onClick={() => setUsageSource("tracked")}><Icon name="clock" size={15}/><span><strong>Tracked only</strong><small>Use confirmed payments</small></span></button></div><div className="usage-actions"><button className="secondary-button" disabled={walletSaving} onClick={() => void saveCapUsage(null)}>I don’t know</button><button className="primary-button" disabled={walletSaving} onClick={() => void saveCapUsage(usageSource === "tracked" ? trackedUsageTotal : Number(manualUsage) || 0)}>{walletSaving ? "Saving…" : "Save usage"} {!walletSaving && <Icon name="check"/>}</button></div><p className="usage-note"><Icon name="info" size={15}/> Stored as an estimate with its source and update date. It does not claim statement-level accuracy.</p></section></div>}

      {pickerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setPickerOpen(false); }}>
          <section className="card-picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
            <div className="picker-header">
              <div><span className="mini-label">My wallet</span><h2 id="picker-title">Which cards do you own?</h2><p>Search {CATALOG.length} cards across {banks.length - 1} issuers and select every card you want to compare.</p></div>
              <button className="close-button" onClick={() => setPickerOpen(false)} aria-label="Close card picker"><Icon name="close" /></button>
            </div>
            <div className="picker-tools">
              <div className="input-shell"><Icon name="search" /><input value={search} onChange={(e) => { setSearch(e.target.value); setRequestSent(false); }} placeholder="Search bank, card, network or benefit" autoFocus /></div>
              <div className="bank-filters">
                {banks.map((bank) => (
                  <button className={bankFilter === bank ? "active" : ""} onClick={() => { setBankFilter(bank); setRequestSent(false); }} key={bank}>
                    <span>{bank}</span><small>{bank === "All" ? CATALOG.length : bankCounts[bank]}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="catalog-summary">
              <span><strong>{filteredCatalog.length}</strong> {filteredCatalog.length === 1 ? "card" : "cards"} shown</span>
              <span>{bankFilter === "All" ? "All issuers" : bankFilter}</span>
            </div>
            <div className="catalog-grid">
              {filteredCatalog.map((card) => {
                const selected = walletDraftIds.includes(card.id);
                return (
                  <button className={`catalog-card ${selected ? "selected" : ""}`} key={card.id} onClick={() => toggleDraftCard(card.id)}>
                    <span className="catalog-swatch" style={{ background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`, color: card.accent }}><span>{card.bank.slice(0, 1)}</span></span>
                    <span className="catalog-name"><small>{card.bank}</small><strong>{card.name}</strong><em>{card.network}</em><i className={`catalog-confidence catalog-confidence--${card.rewardModel.confidence}`}>{confidenceLabel(card.rewardModel.confidence)}</i></span>
                    <span className="selection-box">{selected && <Icon name="check" size={16} />}</span>
                  </button>
                );
              })}
              {!filteredCatalog.length && (
                <div className="catalog-empty">
                  <span><Icon name="search" size={22} /></span>
                  <strong>No matching card found</strong>
                  <p>Try a shorter card name or request it for the catalogue.</p>
                  <button className="secondary-button" disabled={requestSent} onClick={() => setRequestSent(true)}>
                    {requestSent ? "Request noted" : `Request “${search.trim() || "this card"}”`}
                  </button>
                </div>
              )}
            </div>
            <div className="picker-footer">
              <span><strong>{walletDraftIds.length}</strong> {walletDraftIds.length === 1 ? "card" : "cards"} selected</span>
              <button className="primary-button" disabled={walletSaving || (!walletDraftIds.length && !walletIds.length)} onClick={() => { setFormError(""); void saveWalletDraft(); }}>
                {walletSaving ? "Saving…" : walletDraftIds.length ? "Save my wallet" : "Clear my wallet"} {!walletSaving && <Icon name="arrow" />}
              </button>
            </div>
            {walletError && <p className="picker-error">{walletError}</p>}
          </section>
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop auth-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target && !authBusy) setAuthOpen(false); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="close-button auth-close" onClick={() => setAuthOpen(false)} aria-label="Close login"><Icon name="close" /></button>
            <span className="auth-mark"><span>C</span></span>
            {authMode === "verify" ? (
              <div className="verify-state">
                <span className="verify-icon"><Icon name="check" size={22}/></span>
                <span className="mini-label">Activation email sent</span>
                <h2 id="auth-title">Check your email</h2>
                <p>We sent an activation link to <strong>{authForm.email}</strong>. Open it to activate your account and save your wallet.</p>
                <button className="otp-button" onClick={() => { setAuthOpen(false); setAuthNotice("Open the activation link in your email to finish creating your account."); }}>Got it</button>
                <button className="auth-link" onClick={() => setAuthMode("signup")}>Use a different email</button>
              </div>
            ) : (
              <>
                <span className="mini-label">{authMode === "signup" ? "One quick step" : "Welcome back"}</span>
                <h2 id="auth-title">{authMode === "signup" ? "Create your account" : "Log in to CardSmart"}</h2>
                <p>{authMode === "signup" ? "Create your profile for recommendations that fit your goals and spending." : "Access your saved recommendation profile."}</p>
                <form className="auth-form" onSubmit={submitAuth}>
                  {authMode === "signup" && <label>Full name<div className="auth-input"><input autoComplete="name" placeholder="Your full name" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name:e.target.value})}/></div></label>}
                  {authMode === "signup" && <label>Mobile number *<div className="auth-input"><span>+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" maxLength={10} value={authForm.mobile} onChange={(e) => setAuthForm({...authForm, mobile:mobileDigits(e.target.value)})}/></div></label>}
                  <label>Email address<div className="auth-input"><input type="email" autoComplete="email" placeholder="you@example.com" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email:e.target.value})}/></div></label>
                  <label>Password<div className="auth-input"><input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder={authMode === "signup" ? "At least 8 characters" : "Your password"} value={authForm.password} onChange={(e) => setAuthForm({...authForm, password:e.target.value})}/></div></label>
                  {authError && <p className="auth-error">{authError}</p>}
                  <button className="otp-button" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Log in"}</button>
                </form>
                <button className="auth-switch" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}>
                  {authMode === "signup" ? "Already have an account? Log in" : "New to CardSmart? Create account"}
                </button>
                <p className="auth-terms">By continuing, you agree to CardSmart’s Terms and Privacy Policy and essential account updates by email or SMS. Marketing or WhatsApp messages require separate consent.</p>
                <div className="prototype-note"><Icon name="info" size={14}/><span>Your account is protected by email verification. We never ask for card numbers, CVV or banking OTPs.</span></div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
