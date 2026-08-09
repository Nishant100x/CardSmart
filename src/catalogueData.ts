import type { RewardModel } from "./recommendationEngine";

export type CardData = {
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

export type DiscoveryMeta = {
  annualFee: number;
  minMonthlyIncome: number;
  goals: string[];
};

export type CatalogSnapshot = {
  cards: CardData[];
  discoveryMeta: Record<string, DiscoveryMeta>;
};

type JsonObject = Record<string, unknown>;

const NETWORKS = new Set<CardData["network"]>(["VISA", "Mastercard", "RuPay", "AMEX", "Diners Club"]);
const CONFIDENCE = new Set<RewardModel["confidence"]>(["verified", "reviewed", "indicative"]);

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberMap(value: unknown) {
  return Object.fromEntries(
    Object.entries(objectValue(value)).filter((entry): entry is [string, number] => (
      typeof entry[1] === "number" && Number.isFinite(entry[1])
    )),
  );
}

function firstVersion(value: unknown): JsonObject {
  if (Array.isArray(value)) return objectValue(value[0]);
  return objectValue(value);
}

function parseRewardModel(value: unknown): RewardModel {
  const raw = objectValue(value);
  const confidence = CONFIDENCE.has(raw.confidence as RewardModel["confidence"])
    ? raw.confidence as RewardModel["confidence"]
    : "indicative";
  return {
    ...raw,
    confidence,
    rewardLabel: stringValue(raw.rewardLabel, "Estimated reward value"),
    assumptions: stringList(raw.assumptions),
  } as RewardModel;
}

export function parsePublishedCatalogRows(rows: unknown): CatalogSnapshot {
  if (!Array.isArray(rows)) return { cards: [], discoveryMeta: {} };

  const cards: CardData[] = [];
  const discoveryMeta: Record<string, DiscoveryMeta> = {};

  rows.forEach((candidate) => {
    const row = objectValue(candidate);
    const version = firstVersion(row.card_versions);
    const reward = objectValue(version.reward_model);
    const fees = objectValue(version.fees);
    const eligibility = objectValue(version.eligibility);
    const benefits = objectValue(version.benefits);
    const nestedRewardModel = objectValue(reward.rewardModel);

    const id = stringValue(row.id);
    const bank = stringValue(row.issuer);
    const name = stringValue(row.name);
    if (!id || !bank || !name || !Object.keys(version).length) return;

    const networkCandidate = stringValue(row.network, "VISA") as CardData["network"];
    const colors = stringList(reward.colors);
    const bestFor = stringList(reward.bestFor).length
      ? stringList(reward.bestFor)
      : stringList(benefits.bestFor);
    const baseRate = numberValue(reward.baseRate, 1);

    cards.push({
      id,
      bank,
      name,
      network: NETWORKS.has(networkCandidate) ? networkCandidate : "VISA",
      colors: colors.length >= 2 ? [colors[0], colors[1]] : ["#4b5568", "#1f2632"],
      accent: stringValue(reward.accent, "#f3f5f8"),
      bestFor,
      baseRate,
      rates: { online: baseRate, dining: baseRate, travel: baseRate, grocery: baseRate, ...numberMap(reward.rates) },
      merchantRates: Object.keys(numberMap(reward.merchantRates)).length ? numberMap(reward.merchantRates) : undefined,
      cap: stringValue(reward.cap, "Detailed caps and milestones being verified"),
      capUsed: 0,
      trackedValue: 0,
      note: stringValue(reward.note, "Reward terms are being verified."),
      rewardModel: parseRewardModel({
        ...nestedRewardModel,
        assumptions: stringList(nestedRewardModel.assumptions).length
          ? nestedRewardModel.assumptions
          : objectValue(version.terms_and_conditions).assumptions,
      }),
    });

    if (
      typeof fees.annualFee === "number"
      && Number.isFinite(fees.annualFee)
      && typeof eligibility.minMonthlyIncome === "number"
      && Number.isFinite(eligibility.minMonthlyIncome)
    ) {
      discoveryMeta[id] = {
        annualFee: fees.annualFee,
        minMonthlyIncome: eligibility.minMonthlyIncome,
        goals: stringList(benefits.goals),
      };
    }
  });

  return { cards, discoveryMeta };
}
