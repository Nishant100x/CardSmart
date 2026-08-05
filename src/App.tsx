"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

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
};

type ActivityItem = {
  id: string; merchant: string; amount: number; date: string; cardId: string;
  reward: number; incremental: number; status: "tracked" | "checked";
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
    capUsed: 42,
    trackedValue: 630,
    note: "10% cashback is subject to the monthly Swiggy cap.",
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
    cap: "₹5,000 online cashback / month",
    capUsed: 24,
    trackedValue: 1200,
    note: "5% applies to eligible online spends; exclusions may apply.",
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
    capUsed: 68,
    trackedValue: 0,
    note: "Value shown uses an indicative ₹1 per EDGE Mile.",
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
    capUsed: 51,
    trackedValue: 510,
    note: "Higher cashback is limited to eligible partner merchants.",
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
    note: "Amazon rate assumes an eligible Prime membership.",
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
    capUsed: 35,
    trackedValue: 350,
    note: "Accelerated rate is subject to the combined monthly cap.",
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
    rates: { travel: 5, online: 3.3, dining: 3.3, grocery: 3.3 },
    cap: "Reward points subject to daily limits",
    capUsed: 16,
    trackedValue: 0,
    note: "Value depends on redemption method and booking channel.",
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
    capUsed: 71,
    trackedValue: 355,
    note: "Utility rate depends on the eligible payment channel.",
  },
  {
    id: "amex-mrcc",
    bank: "American Express",
    name: "Membership Rewards",
    network: "AMEX",
    colors: ["#2a7fa2", "#143d53"],
    accent: "#c9f2ff",
    bestFor: ["Milestones", "Rewards"],
    baseRate: 2,
    rates: { online: 2, dining: 2, travel: 2, grocery: 2 },
    cap: "Monthly transaction milestones",
    capUsed: 50,
    trackedValue: 0,
    note: "Effective value varies based on milestone achievement.",
  },
  catalogueCard({ id: "hdfc-regalia-gold", bank: "HDFC Bank", name: "Regalia Gold", bestFor: ["Travel", "Lounge"], baseRate: 1.3, rates: { travel: 2.6 } }),
  catalogueCard({ id: "hdfc-dcb-metal", bank: "HDFC Bank", name: "Diners Club Black Metal", network: "Diners Club", bestFor: ["Travel", "Premium rewards"], baseRate: 3.3, rates: { travel: 5 } }),
  catalogueCard({ id: "hdfc-tata-neu-infinity", bank: "HDFC Bank", name: "Tata Neu Infinity", network: "RuPay", bestFor: ["Tata brands", "UPI"], baseRate: 1.5, merchantRates: { tata: 5 } }),
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
  catalogueCard({ id: "axis-airtel", bank: "Axis Bank", name: "Airtel", network: "Mastercard", bestFor: ["Airtel bills", "Utilities"], baseRate: 1, merchantRates: { airtel: 25, swiggy: 10, zomato: 10 } }),
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
  catalogueCard({ id: "amex-platinum-travel", bank: "American Express", name: "Platinum Travel", network: "AMEX", bestFor: ["Milestones", "Travel"], baseRate: 1, rates: { travel: 1.5 } }),
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

const DEFAULT_WALLET = ["hdfc-swiggy", "sbi-cashback", "axis-atlas"];

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

function classifyPurchase(merchant: string) {
  const text = merchant.toLowerCase();
  if (/swiggy|zomato|restaurant|dinner|lunch|cafe|food/.test(text)) return "dining";
  if (/flight|hotel|makemytrip|cleartrip|ixigo|travel/.test(text)) return "travel";
  if (/grocery|blinkit|zepto|bigbasket|dmart/.test(text)) return "grocery";
  return "online";
}

function shortBankName(bank: string) {
  return bank.replace(" Bank", "").replace(" Card", "");
}

function recommendationFor(card: CardData, merchant: string, amount: number) {
  const normalized = merchant.toLowerCase();
  const merchantMatch = Object.entries(card.merchantRates ?? {}).find(([key]) => normalized.includes(key));
  const category = classifyPurchase(merchant);
  const rate = merchantMatch?.[1] ?? card.rates[category] ?? card.baseRate;
  return { card, rate, value: Math.round((amount * rate) / 100), category };
}

export default function Home() {
  const [view, setView] = useState<"home" | "result" | "wallet" | "explore" | "activity">("home");
  const [merchant, setMerchant] = useState("Swiggy");
  const [amount, setAmount] = useState("2000");
  const [walletIds, setWalletIds] = useState(DEFAULT_WALLET);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("All");
  const [requestSent, setRequestSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [usageCard, setUsageCard] = useState<CardData | null>(null);
  const [manualUsage, setManualUsage] = useState("");
  const [exploreMode, setExploreMode] = useState<"discover" | "compare">("discover");
  const [spendProfile, setSpendProfile] = useState({ online: "15000", dining: "8000", travel: "10000", grocery: "10000" });
  const [authUser, setAuthUser] = useState<User | null>(null);
  const signedIn = Boolean(authUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "login" | "verify">("signup");
  const [authForm, setAuthForm] = useState({ mobile: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [pendingAction, setPendingAction] = useState<"save_wallet" | "track_payment" | "activity" | "cap_usage" | "save_explore" | null>(null);
  const activity: ActivityItem[] = [
    { id: "a1", merchant: "Swiggy", amount: 2000, date: "Today, 11:42 AM", cardId: "hdfc-swiggy", reward: 200, incremental: 100, status: "tracked" },
    { id: "a2", merchant: "Amazon", amount: 5400, date: "Yesterday, 8:16 PM", cardId: "sbi-cashback", reward: 270, incremental: 216, status: "tracked" },
    { id: "a3", merchant: "IndiGo flight", amount: 18400, date: "2 Aug, 6:05 PM", cardId: "axis-atlas", reward: 920, incremental: 552, status: "checked" },
    { id: "a4", merchant: "Blinkit", amount: 1650, date: "31 Jul, 9:20 PM", cardId: "hdfc-swiggy", reward: 83, incremental: 66, status: "tracked" },
  ];

  const walletCards = useMemo(() => CATALOG.filter((card) => walletIds.includes(card.id)), [walletIds]);
  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const ranked = useMemo(
    () => walletCards.map((card) => recommendationFor(card, merchant, numericAmount)).sort((a, b) => b.value - a.value),
    [merchant, numericAmount, walletCards]
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
      setPickerOpen(true);
      return;
    }
    setFormError("");
    setConfirmed(false);
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseExample = (name: string, value: string) => {
    setMerchant(name);
    setAmount(value);
    setFormError("");
  };

  const toggleCard = (id: string) => {
    setWalletIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem("cardsmart-guest-session");
    if (!saved) return;
    try {
      const guest = JSON.parse(saved) as { walletIds?: string[]; merchant?: string; amount?: string };
      // Restoring a browser session is intentionally a one-time external-state sync.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guest.walletIds?.length) setWalletIds(guest.walletIds);
      if (guest.merchant) setMerchant(guest.merchant);
      if (guest.amount) setAmount(guest.amount);
    } catch { window.sessionStorage.removeItem("cardsmart-guest-session"); }
  }, []);

  const completeAccountAction = useCallback((action = pendingAction) => {
    setAuthBusy(false);
    setAuthOpen(false);
    setAuthNotice("Wallet saved. Your cards and this recommendation are now linked to your account.");
    if (action === "track_payment") setConfirmed(true);
    if (action === "activity") setView("activity");
    if (action === "cap_usage" && usageCard) setManualUsage(String(usageCard.trackedValue || ""));
    setPendingAction(null);
    window.sessionStorage.removeItem("cardsmart-pending-action");
    window.sessionStorage.removeItem("cardsmart-guest-session");
  }, [pendingAction, usageCard]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        const savedAction = window.sessionStorage.getItem("cardsmart-pending-action") as typeof pendingAction;
        if (savedAction) {
          setPendingAction(savedAction);
          window.sessionStorage.removeItem("cardsmart-pending-action");
          window.setTimeout(() => completeAccountAction(savedAction), 0);
        }
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [completeAccountAction]);

  useEffect(() => {
    if (signedIn) return;
    window.sessionStorage.setItem("cardsmart-guest-session", JSON.stringify({ walletIds, merchant, amount, returnView: view }));
  }, [walletIds, merchant, amount, view, signedIn]);

  const requireAccount = (action: typeof pendingAction) => {
    if (signedIn) return true;
    setPendingAction(action);
    if (action) window.sessionStorage.setItem("cardsmart-pending-action", action);
    setAuthMode("signup");
    setAuthError("");
    setAuthOpen(true);
    return false;
  };

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email);
    const validMobile = /^[6-9]\d{9}$/.test(authForm.mobile.replace(/\D/g, ""));
    if (!validEmail) return setAuthError("Enter a valid email address.");
    if (authMode === "signup" && !validMobile) return setAuthError("Enter a valid 10-digit Indian mobile number.");
    if (authForm.password.length < 8) return setAuthError("Password must be at least 8 characters.");
    setAuthError("");
    setAuthBusy(true);
    if (!isSupabaseConfigured) {
      setAuthBusy(false);
      return setAuthError("Account service is not configured yet.");
    }
    if (authMode === "signup") {
      const mobile = `+91${authForm.mobile.replace(/\D/g, "")}`;
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email.trim().toLowerCase(),
        password: authForm.password,
        options: {
          data: { mobile },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      setAuthBusy(false);
      if (error) return setAuthError(error.message);
      if (data.session) completeAccountAction();
      else setAuthMode("verify");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email.trim().toLowerCase(),
      password: authForm.password,
    });
    setAuthBusy(false);
    if (error) return setAuthError(error.message);
    completeAccountAction();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setConfirmed(false);
    setView("home");
    setAuthNotice("You’re logged out.");
  };

  const openProtectedView = (nextView: "wallet" | "activity") => {
    if (nextView === "activity" && !requireAccount("activity")) return;
    setView(nextView);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("home")} aria-label="CardSmart home">
          <span className="brand-mark"><span>C</span></span>
          <span>CardSmart</span>
        </button>
        <nav className="side-nav" aria-label="Primary navigation">
          <button className={view === "home" || view === "result" ? "active" : ""} onClick={() => setView("home")}>
            <Icon name="home" /> <span>Home</span>
          </button>
          <button className={view === "wallet" ? "active" : ""} onClick={() => openProtectedView("wallet")}>
            <Icon name="wallet" /> <span>My wallet</span><small>{walletIds.length}</small>
          </button>
          <button className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}>
            <Icon name="compass" /> <span>Explore cards</span>
          </button>
          <button className={view === "activity" ? "active" : ""} onClick={() => openProtectedView("activity")}>
            <Icon name="clock" /> <span>Activity</span><small>{activity.length}</small>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="trust-note">
          <span className="trust-icon"><Icon name="shield" size={18} /></span>
          <div><strong>Your cards stay private</strong><p>We never ask for card numbers, CVV or OTP.</p></div>
        </div>
        <button className="profile-button" onClick={() => { if (signedIn) void signOut(); else { setAuthMode("login"); setAuthError(""); setAuthOpen(true); } }}>
          <span className="avatar">{signedIn ? (authUser?.email?.[0] ?? "U").toUpperCase() : <Icon name="user" size={17}/>}</span>
          <span><strong>{signedIn ? authUser?.email : "Log in"}</strong><small>{signedIn ? "Free account · Log out" : "Save wallet & activity"}</small></span>
          <Icon name="chevron" size={17} />
        </button>
      </aside>

      <main className="main-content">
        <header className="mobile-header">
          <button className="brand" onClick={() => setView("home")} aria-label="CardSmart home">
            <span className="brand-mark"><span>C</span></span><span>CardSmart</span>
          </button>
          <button className="avatar" aria-label={signedIn ? "Log out" : "Log in"} onClick={() => { if (signedIn) void signOut(); else { setAuthMode("login"); setAuthError(""); setAuthOpen(true); } }}>{signedIn ? (authUser?.email?.[0] ?? "U").toUpperCase() : <Icon name="user" size={17}/>}</button>
        </header>

        {view === "home" && (
          <div className="home-page page-enter">
            {authNotice && <div className="auth-success"><Icon name="check" size={17}/><span>{authNotice}</span><button onClick={() => setAuthNotice("")}><Icon name="close" size={15}/></button></div>}
            <section className="hero-copy">
              <span className="eyebrow"><Icon name="spark" size={15} /> Make every card work harder</span>
              <h1>Which card should<br className="desktop-break" /> you use?</h1>
              <p>Tell us where you’re paying and how much. We’ll compare the cards you own and show you the best return.</p>
            </section>

            <section className="payment-panel">
              <form onSubmit={submitPayment}>
                <div className="field-group">
                  <label htmlFor="merchant">Where or what are you paying for?</label>
                  <div className="input-shell input-shell--merchant">
                    <Icon name="search" />
                    <input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Swiggy, flight tickets, groceries" />
                  </div>
                </div>
                <div className="field-group amount-group">
                  <label htmlFor="amount">Amount</label>
                  <div className="input-shell input-shell--amount">
                    <span className="currency">₹</span>
                    <input id="amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
                  </div>
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <button className="primary-button find-button" type="submit">
                  Find my best card <Icon name="arrow" />
                </button>
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
            </section>

            <section className="wallet-preview">
              <div className="section-heading">
                <div><span className="mini-label">Your wallet</span><h2>{walletIds.length} cards ready to compare</h2></div>
                <button className="text-button" onClick={() => setPickerOpen(true)}><Icon name="edit" size={16} /> Edit wallet</button>
              </div>
              <div className="wallet-strip">
                {walletCards.map((card, index) => (
                  <div className="wallet-mini-card" key={card.id} style={{ zIndex: walletCards.length - index }}>
                    <CardVisual card={card} compact />
                  </div>
                ))}
                {!walletCards.length && (
                  <button className="empty-wallet-card" onClick={() => setPickerOpen(true)}><Icon name="plus" /> Add your cards</button>
                )}
              </div>
            </section>

            <div className="security-line"><Icon name="shield" size={17} /> No card number, CVV or OTP required. Ever.</div>
          </div>
        )}

        {view === "result" && winner && (
          <div className="result-page page-enter">
            <button className="back-button" onClick={() => setView("home")}><Icon name="back" size={18} /> New payment</button>
            <div className="result-heading">
              <span className="eyebrow">Best card for this payment</span>
              <h1>Use your {shortBankName(winner.card.bank)} {winner.card.name} card</h1>
              <p>For {merchant} · ₹{numericAmount.toLocaleString("en-IN")}</p>
            </div>

            <section className="winner-panel">
              <div className="winner-card-wrap">
                <div className="best-badge"><Icon name="check" size={14} /> Best return</div>
                <CardVisual card={winner.card} />
              </div>
              <div className="reward-summary">
                <span className="summary-label">Estimated reward</span>
                <div className="reward-value">₹{winner.value.toLocaleString("en-IN")}</div>
                <div className="reward-rate">{winner.rate}% back on this payment</div>
                {runnerUp && (
                  <div className="extra-value"><Icon name="spark" size={16} />
                    {winner.value > runnerUp.value
                      ? <><strong>₹{(winner.value - runnerUp.value).toLocaleString("en-IN")} more</strong> than your next-best card</>
                      : <><strong>Same return</strong> as your next-best card</>}
                  </div>
                )}
              </div>
              <div className="calculation-box">
                <span>How we calculated it</span>
                <div><strong>₹{numericAmount.toLocaleString("en-IN")}</strong><span>×</span><strong>{winner.rate}%</strong><span>=</span><strong className="green-text">₹{winner.value.toLocaleString("en-IN")}</strong></div>
                <p>{winner.card.note}</p>
              </div>
            </section>

            <section className="comparison-section">
              <div className="section-heading">
                <div><span className="mini-label">Wallet comparison</span><h2>How your other cards compare</h2></div>
                <button className="text-button" onClick={() => setPickerOpen(true)}><Icon name="edit" size={16} /> Edit wallet</button>
              </div>
              <div className="comparison-table">
                {ranked.map((item, index) => (
                  <div className={`comparison-row ${index === 0 ? "comparison-row--winner" : ""}`} key={item.card.id}>
                    <span className="rank">{index + 1}</span>
                    <span className="card-swatch" style={{ background: `linear-gradient(135deg, ${item.card.colors[0]}, ${item.card.colors[1]})` }} />
                    <div className="comparison-name"><strong>{item.card.bank} {item.card.name}</strong><span>{item.rate}% estimated return</span></div>
                    <div className="comparison-value"><strong>₹{item.value.toLocaleString("en-IN")}</strong>{index === 0 && <span>Best</span>}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="result-actions">
              {confirmed ? (
                <div className="confirmed-state"><span><Icon name="check" /></span><div><strong>Payment tracked</strong><p>We’ll use this to estimate your monthly reward-cap usage.</p></div></div>
              ) : (
                <button className="primary-button" onClick={() => signedIn ? setConfirmed(true) : requireAccount("track_payment")}>{signedIn ? "I paid with this card" : "Save wallet & track this payment"} <Icon name={signedIn ? "check" : "arrow"} /></button>
              )}
              <button className="secondary-button" onClick={() => setView("home")}>Check another payment</button>
            </section>
            <p className="estimate-note"><Icon name="info" size={15} /> Estimates use prototype reward rules and tracked activity. Final eligibility, exclusions and rewards are decided by the issuer.</p>
          </div>
        )}

        {view === "wallet" && (
          <div className="wallet-page page-enter">
            <div className="wallet-page-heading">
              <div><span className="eyebrow">My wallet</span><h1>Your cards, made useful.</h1><p>See what each card is best for and keep reward caps in view.</p></div>
              <button className="primary-button add-card-button" onClick={() => setPickerOpen(true)}><Icon name="plus" /> Add a card</button>
            </div>
            <section className="wallet-grid">
              {walletCards.map((card) => (
                <article className="wallet-card" key={card.id}>
                  <CardVisual card={card} />
                  <div className="wallet-card-content">
                    <div className="wallet-title-row"><div><span>{card.bank}</span><h2>{card.name}</h2></div><button aria-label={`Remove ${card.name}`} onClick={() => toggleCard(card.id)}><Icon name="close" size={17} /></button></div>
                    <div className="best-for"><span>Best for</span>{card.bestFor.map((item) => <strong key={item}>{item}</strong>)}</div>
                    <div className="cap-block">
                      <div className="cap-title"><span>Estimated cap used</span><strong>{card.capUsed}%</strong></div>
                      <div className="cap-track"><span style={{ width: `${card.capUsed}%` }} /></div>
                      <p>{card.cap}</p>
                    </div>
                    <button className="card-detail-link" onClick={() => { setUsageCard(card); if (signedIn) setManualUsage(String(card.trackedValue || "")); else requireAccount("cap_usage"); }}>Update cap usage <Icon name="chevron" size={16} /></button>
                  </div>
                </article>
              ))}
              <button className="wallet-add-tile" onClick={() => setPickerOpen(true)}><span><Icon name="plus" /></span><strong>Add another card</strong><p>Search our card catalogue</p></button>
            </section>
            <div className="wallet-disclaimer"><Icon name="info" size={18} /><div><strong>Cap usage is an estimate</strong><p>It is based only on payments you confirm inside CardSmart, not your full statement.</p></div></div>
          </div>
        )}

        {view === "explore" && (
          <div className="product-page page-enter">
            <div className="product-heading"><div><span className="eyebrow"><Icon name="compass" size={15} /> Improve your wallet</span><h1>Which card should you add?</h1><p>We compare a new card against the cards you already own, so you only see genuinely incremental value.</p></div></div>
            <div className="mode-switch" role="tablist"><button className={exploreMode === "discover" ? "active" : ""} onClick={() => setExploreMode("discover")}>Find a card for me</button><button className={exploreMode === "compare" ? "active" : ""} onClick={() => setExploreMode("compare")}>Check a card I’m considering</button></div>
            <section className="explore-layout">
              <div className="spend-card"><span className="mini-label">Your monthly spend</span><h2>Help us calculate real incremental value</h2><p>Approximate numbers are fine. You can update them later.</p>
                <div className="spend-grid">{Object.entries(spendProfile).map(([key, value]) => <label key={key}><span>{key[0].toUpperCase() + key.slice(1)}</span><div className="mini-input"><b>₹</b><input inputMode="numeric" value={value} onChange={(e) => setSpendProfile({ ...spendProfile, [key]: e.target.value.replace(/[^0-9]/g, "") })} /></div></label>)}</div>
                {exploreMode === "compare" && <label className="considering-field"><span>Card you’re considering</span><div className="input-shell"><Icon name="search"/><input placeholder="Search from 98 cards" /></div></label>}
                <button className="primary-button full-button" onClick={() => requireAccount("save_explore")}>Calculate and save my best upgrade <Icon name="arrow" /></button>
              </div>
              <aside className="upgrade-preview"><div className="preview-badge"><Icon name="spark" size={14}/> Preview result</div><span className="mini-label">Potential wallet upgrade</span><h2>SBI Cashback</h2><div className="annual-value"><strong>+₹4,620</strong><span>estimated value / year<br/>after annual fee</span></div><div className="value-reason"><span>Why it helps</span><p>Your current wallet earns only ~1% on a large share of online shopping.</p></div><div className="assumption-line"><Icon name="info" size={15}/><span>Uses the spend entered on this screen and prototype reward rules.</span></div></aside>
            </section>
          </div>
        )}

        {view === "activity" && (
          <div className="product-page page-enter">
            <div className="product-heading activity-heading"><div><span className="eyebrow"><Icon name="clock" size={15} /> Your decisions</span><h1>Activity</h1><p>Past recommendations and payments you chose to track.</p></div><div className="reward-total"><span>Tracked expected rewards</span><strong>₹553</strong><small>across 3 confirmed payments</small></div></div>
            <div className="activity-toolbar"><div className="activity-tabs"><button className="active">All</button><button>Tracked payments</button><button>Only checked</button></div><button className="secondary-button compact-button"><Icon name="tune" size={15}/> Filter</button></div>
            <section className="activity-list">{activity.map((item) => { const card = CATALOG.find((c) => c.id === item.cardId)!; return <article className="activity-row" key={item.id}><div className="merchant-mark">{item.merchant.slice(0,1)}</div><div className="activity-main"><span>{item.date}</span><h2>{item.merchant}</h2><p>₹{item.amount.toLocaleString("en-IN")} · Recommended {shortBankName(card.bank)} {card.name}</p></div><div className="activity-value"><span>Expected reward</span><strong>₹{item.reward}</strong><small>₹{item.incremental} extra</small></div><span className={`status-pill ${item.status}`}>{item.status === "tracked" ? "Payment tracked" : "Only checked"}</span><button className="repeat-button" onClick={() => { setMerchant(item.merchant); setAmount(String(item.amount)); setView("home"); }} aria-label={`Repeat ${item.merchant} calculation`}><Icon name="chevron"/></button></article>; })}</section>
            <p className="estimate-note"><Icon name="info" size={15}/> “Expected rewards” are estimates. CardSmart does not have access to your bank statement in this prototype.</p>
          </div>
        )}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button className={view === "home" || view === "result" ? "active" : ""} onClick={() => setView("home")}><Icon name="home" /><span>Home</span></button>
        <button className={view === "wallet" ? "active" : ""} onClick={() => openProtectedView("wallet")}><Icon name="wallet" /><span>My wallet</span></button>
        <button className={view === "explore" ? "active" : ""} onClick={() => setView("explore")}><Icon name="compass" /><span>Explore</span></button>
        <button className={view === "activity" ? "active" : ""} onClick={() => openProtectedView("activity")}><Icon name="clock" /><span>Activity</span></button>
      </nav>

      {usageCard && <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setUsageCard(null); }}><section className="usage-modal" role="dialog" aria-modal="true" aria-labelledby="usage-title"><button className="close-button usage-close" onClick={() => setUsageCard(null)}><Icon name="close"/></button><span className="mini-label">Usage setup</span><h2 id="usage-title">Update {usageCard.name} usage</h2><p className="usage-intro">This helps us avoid recommending a reward rate after you have already exhausted its cap.</p><div className="usage-rule"><Icon name="gift"/><div><span>Reward rule being tracked</span><strong>{usageCard.cap}</strong></div></div><label className="usage-field"><span>How much reward have you already earned in this period?</span><div className="input-shell input-shell--amount"><b>₹</b><input inputMode="numeric" value={manualUsage} onChange={(e) => setManualUsage(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0"/></div></label><div className="source-choice"><button className="active"><Icon name="edit" size={15}/><span><strong>User entered</strong><small>Includes usage outside CardSmart</small></span></button><button><Icon name="clock" size={15}/><span><strong>Tracked only</strong><small>Use confirmed payments</small></span></button></div><div className="usage-actions"><button className="secondary-button" onClick={() => setManualUsage("")}>I don’t know</button><button className="primary-button" onClick={() => setUsageCard(null)}>Save usage <Icon name="check"/></button></div><p className="usage-note"><Icon name="info" size={15}/> Stored as an estimate with its source and update date. It does not claim statement-level accuracy.</p></section></div>}

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
                const selected = walletIds.includes(card.id);
                return (
                  <button className={`catalog-card ${selected ? "selected" : ""}`} key={card.id} onClick={() => toggleCard(card.id)}>
                    <span className="catalog-swatch" style={{ background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`, color: card.accent }}><span>{card.bank.slice(0, 1)}</span></span>
                    <span className="catalog-name"><small>{card.bank}</small><strong>{card.name}</strong><em>{card.network}</em></span>
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
              <span><strong>{walletIds.length}</strong> {walletIds.length === 1 ? "card" : "cards"} selected</span>
              <button className="primary-button" disabled={!walletIds.length} onClick={() => { setPickerOpen(false); setFormError(""); requireAccount("save_wallet"); }}>
                Save my wallet <Icon name="arrow" />
              </button>
            </div>
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
                <p>{authMode === "signup" ? "Save your cards, recommendations and cap usage across devices." : "Access your saved wallet and recommendation history."}</p>
                <form className="auth-form" onSubmit={submitAuth}>
                  {authMode === "signup" && <label>Mobile number<div className="auth-input"><span>+91</span><input inputMode="numeric" autoComplete="tel" placeholder="98765 43210" value={authForm.mobile} onChange={(e) => setAuthForm({...authForm, mobile:e.target.value})}/></div></label>}
                  <label>Email address<div className="auth-input"><input type="email" autoComplete="email" placeholder="you@example.com" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email:e.target.value})}/></div></label>
                  <label>Password<div className="auth-input"><input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} placeholder={authMode === "signup" ? "At least 8 characters" : "Your password"} value={authForm.password} onChange={(e) => setAuthForm({...authForm, password:e.target.value})}/></div></label>
                  {authError && <p className="auth-error">{authError}</p>}
                  <button className="otp-button" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Log in"}</button>
                </form>
                <button className="auth-switch" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}>
                  {authMode === "signup" ? "Already have an account? Log in" : "New to CardSmart? Create account"}
                </button>
                <p className="auth-terms">By continuing, you agree to CardSmart’s Terms and Privacy Policy. We never ask for card numbers, CVV or banking OTPs.</p>
                <div className="prototype-note"><Icon name="info" size={14}/><span>Your account is protected by email verification. We never ask for card numbers, CVV or banking OTPs.</span></div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
