import type { CardOffer, MerchantEntity, OfferBenefit, RewardEarning, RewardModel } from "./recommendationEngine";

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
  offers: CardOffer[];
  merchants: MerchantEntity[];
};

type JsonObject = Record<string, unknown>;

const NETWORKS = new Set<CardData["network"]>(["VISA", "Mastercard", "RuPay", "AMEX", "Diners Club"]);
const CONFIDENCE = new Set<RewardModel["confidence"]>(["verified", "reviewed", "indicative"]);
const PURCHASE_CATEGORIES = new Set<MerchantEntity["categoryCandidates"][number]>([
  "dining", "grocery", "shopping", "travel", "utilities", "fuel", "rent",
  "education", "insurance", "government", "wallet", "other",
]);
const PAYMENT_CHANNELS = new Set<MerchantEntity["channelCandidates"][number]>(["online", "offline", "app", "upi"]);

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

function parseOfferBenefit(value: unknown): OfferBenefit | null {
  const raw = objectValue(value);
  const kind = stringValue(raw.kind);
  if (kind === "instant_discount" || kind === "cashback") {
    const benefit: Extract<OfferBenefit, { kind: "instant_discount" | "cashback" }> = { kind };
    if (typeof raw.rate === "number" && Number.isFinite(raw.rate)) benefit.rate = raw.rate;
    if (typeof raw.fixedAmount === "number" && Number.isFinite(raw.fixedAmount)) benefit.fixedAmount = raw.fixedAmount;
    if (typeof raw.maxBenefit === "number" && Number.isFinite(raw.maxBenefit)) benefit.maxBenefit = raw.maxBenefit;
    return benefit.rate === undefined && benefit.fixedAmount === undefined ? null : benefit;
  }
  if (kind === "bonus_points" && objectValue(raw.earning).kind) {
    return { kind, earning: objectValue(raw.earning) as unknown as RewardEarning };
  }
  return null;
}

export function parsePublishedOfferRows(rows: unknown): CardOffer[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((candidate): CardOffer[] => {
    const row = objectValue(candidate);
    const value = objectValue(row.offer_value);
    const eligibility = objectValue(row.eligibility);
    const benefit = parseOfferBenefit(value.benefit ?? value);
    const id = stringValue(row.offer_key, stringValue(row.id));
    const title = stringValue(row.title);
    const sourceUrl = stringValue(row.source_url);
    const merchantMatches = stringList(eligibility.merchantMatches).length
      ? stringList(eligibility.merchantMatches)
      : [stringValue(row.merchant)].filter(Boolean);
    if (!id || !title || !sourceUrl || !merchantMatches.length || !benefit) return [];
    return [{
      id,
      title,
      issuer: stringValue(row.issuer) || undefined,
      cardIds: stringList(eligibility.cardIds).length ? stringList(eligibility.cardIds) : (stringValue(row.card_id) ? [stringValue(row.card_id)] : undefined),
      excludedCardIds: stringList(eligibility.excludedCardIds),
      merchantMatches,
      categories: stringList(eligibility.categories) as CardOffer["categories"],
      channels: stringList(eligibility.channels) as CardOffer["channels"],
      minSpend: typeof eligibility.minSpend === "number" ? eligibility.minSpend : undefined,
      startsAt: stringValue(row.starts_at) || undefined,
      endsAt: stringValue(row.ends_at) || undefined,
      benefit,
      stackable: eligibility.stackable === true,
      couponCode: stringValue(eligibility.couponCode) || undefined,
      requiresEnrollment: eligibility.requiresEnrollment === true,
      usageLimit: stringValue(eligibility.usageLimit) || undefined,
      confidence: CONFIDENCE.has(value.confidence as RewardModel["confidence"])
        ? value.confidence as RewardModel["confidence"] : "reviewed",
      sourceUrl,
      termsUrl: stringValue(row.terms_url) || undefined,
      verifiedAt: stringValue(row.reviewed_at, stringValue(row.source_checked_at)) || undefined,
    }];
  });
}

export function parsePublishedMerchantRows(rows: unknown): MerchantEntity[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((candidate): MerchantEntity[] => {
    const row = objectValue(candidate);
    const id = stringValue(row.merchant_key, stringValue(row.id));
    const displayName = stringValue(row.display_name);
    const aliases = stringList(row.aliases);
    const categoryCandidates = stringList(row.category_candidates)
      .filter((value): value is MerchantEntity["categoryCandidates"][number] => PURCHASE_CATEGORIES.has(value as MerchantEntity["categoryCandidates"][number]));
    const channelCandidates = stringList(row.channel_candidates)
      .filter((value): value is MerchantEntity["channelCandidates"][number] => PAYMENT_CHANNELS.has(value as MerchantEntity["channelCandidates"][number]));
    if (!id || !displayName || !aliases.length || !categoryCandidates.length || !channelCandidates.length) return [];
    return [{
      id,
      displayName,
      aliases,
      categoryCandidates,
      channelCandidates,
      confidence: CONFIDENCE.has(row.confidence as RewardModel["confidence"])
        ? row.confidence as RewardModel["confidence"] : "reviewed",
      sourceUrl: stringValue(row.source_url) || undefined,
    }];
  });
}

export function parsePublishedCatalogRows(rows: unknown, offerRows: unknown = [], merchantRows: unknown = []): CatalogSnapshot {
  if (!Array.isArray(rows)) return { cards: [], discoveryMeta: {}, offers: parsePublishedOfferRows(offerRows), merchants: parsePublishedMerchantRows(merchantRows) };

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

  return { cards, discoveryMeta, offers: parsePublishedOfferRows(offerRows), merchants: parsePublishedMerchantRows(merchantRows) };
}
