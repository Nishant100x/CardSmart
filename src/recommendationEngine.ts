export type PurchaseCategory =
  | "auto" | "dining" | "travel" | "grocery" | "shopping" | "utilities"
  | "fuel" | "rent" | "education" | "insurance" | "government" | "wallet" | "other";

export type PaymentChannel = "auto" | "online" | "offline" | "upi" | "app";
export type RuleConfidence = "verified" | "reviewed" | "indicative";
export type RewardValueMode = "standard" | "optimised";
export type RedemptionPreference = "balanced" | "cash" | "shopping" | "travel";
export type RedemptionType = "cash" | "voucher" | "product" | "travel" | "transfer";

export type RedemptionTier = {
  units: number;
  value?: number;
  label: string;
};

export type RedemptionOption = {
  id: string;
  type: RedemptionType;
  label: string;
  valuePerUnit?: number;
  conversionUnitsPerPoint?: number;
  conversionUnitLabel?: string;
  tiers?: RedemptionTier[];
  conditions?: string[];
  sourceUrl?: string;
  confidence?: RuleConfidence;
};

export type RewardCurrency = {
  code: string;
  name: string;
  unitLabel: string;
  standardValuePerUnit: number;
  optimisedValuePerUnit?: number;
  standardRedemption: string;
  optimisedRedemption?: string;
  redemptionOptions?: RedemptionOption[];
};

export type MilestoneRule = {
  id: string;
  label: string;
  period: "calendar_month" | "anniversary_year";
  metric: "spend" | "transactions";
  threshold: number;
  minTransactionAmount?: number;
  benefitLabel: string;
  benefitValue?: number;
  requiresEnrollment?: boolean;
  sourceUrl?: string;
};

export type RewardEarning =
  | { kind: "cashback"; rate: number }
  | {
      kind: "points";
      units: number;
      spendUnit: number;
      rounding?: "floor" | "exact";
      currency: RewardCurrency;
    };

export type MerchantRewardRule = {
  matches: string[];
  rate?: number;
  earning?: RewardEarning;
  channels?: Exclude<PaymentChannel, "auto">[];
  categories?: Exclude<PurchaseCategory, "auto">[];
  capAmount?: number;
  label: string;
};

export type RewardModel = {
  confidence: RuleConfidence;
  reviewedOn?: string;
  verifiedAt?: string;
  dataVersion?: string;
  sourceUrls?: string[];
  rewardLabel?: string;
  exclusions?: Exclude<PurchaseCategory, "auto">[];
  defaultEarning?: RewardEarning;
  merchantRules?: MerchantRewardRule[];
  categoryRates?: Partial<Record<Exclude<PurchaseCategory, "auto">, number>>;
  categoryEarnings?: Partial<Record<Exclude<PurchaseCategory, "auto">, RewardEarning>>;
  channelRates?: Partial<Record<Exclude<PaymentChannel, "auto">, number>>;
  channelEarnings?: Partial<Record<Exclude<PaymentChannel, "auto">, RewardEarning>>;
  defaultCapAmount?: number;
  milestones?: MilestoneRule[];
  assumptions?: string[];
};

export type OfferBenefit =
  | { kind: "instant_discount" | "cashback"; rate?: number; fixedAmount?: number; maxBenefit?: number }
  | { kind: "bonus_points"; earning: RewardEarning };

export type CardOffer = {
  id: string;
  title: string;
  issuer?: string;
  cardIds?: string[];
  excludedCardIds?: string[];
  merchantMatches: string[];
  categories?: Exclude<PurchaseCategory, "auto">[];
  channels?: Exclude<PaymentChannel, "auto">[];
  minSpend?: number;
  startsAt?: string;
  endsAt?: string;
  benefit: OfferBenefit;
  stackable?: boolean;
  couponCode?: string;
  requiresEnrollment?: boolean;
  usageLimit?: string;
  confidence: RuleConfidence;
  sourceUrl: string;
  termsUrl?: string;
  verifiedAt?: string;
};

export type RecommendationCard = {
  id: string;
  bank?: string;
  baseRate: number;
  rates: Record<string, number>;
  merchantRates?: Record<string, number>;
  trackedValue: number;
  rewardModel: RewardModel;
};

export type RecommendationInput = {
  merchant: string;
  amount: number;
  category: PurchaseCategory;
  channel: PaymentChannel;
};

export type EvaluationContext = {
  offers?: CardOffer[];
  asOf?: string | Date;
  rewardValueMode?: RewardValueMode;
  redemptionPreference?: RedemptionPreference;
  ledgers?: Record<string, RewardLedger>;
};

export type RewardLedger = {
  pointsBalance?: number;
  monthlyEligibleSpend?: number;
  annualEligibleSpend?: number;
  qualifyingTransactions?: number;
  updatedAt?: string;
};

export type RedemptionValue = {
  id: string;
  type: RedemptionType;
  label: string;
  value: number | null;
  valuePerUnit: number | null;
  convertedUnits: number | null;
  conversionUnitLabel: string | null;
  tiers: RedemptionTier[];
  conditions: string[];
  sourceUrl?: string;
  confidence: RuleConfidence;
};

export type MilestoneProgress = {
  id: string;
  label: string;
  period: MilestoneRule["period"];
  metric: MilestoneRule["metric"];
  threshold: number;
  before: number | null;
  after: number | null;
  remaining: number | null;
  crossed: boolean;
  benefitLabel: string;
  benefitValue?: number;
  requiresEnrollment: boolean;
  sourceUrl?: string;
};

export type AppliedOffer = {
  id: string;
  title: string;
  value: number;
  sourceUrl: string;
  termsUrl?: string;
  couponCode?: string;
  requiresEnrollment: boolean;
  usageLimit?: string;
};

export type RecommendationResult<T extends RecommendationCard> = {
  card: T;
  category: Exclude<PurchaseCategory, "auto">;
  channel: Exclude<PaymentChannel, "auto">;
  rate: number;
  grossValue: number;
  baseValue: number;
  offerValue: number;
  value: number;
  standardValue: number;
  optimisedValue: number;
  rewardUnits: number | null;
  rewardUnitLabel: string | null;
  standardRedemption: string | null;
  optimisedRedemption: string | null;
  selectedRedemption: RedemptionValue | null;
  redemptionValues: RedemptionValue[];
  bestKnownRedemptionValue: number;
  milestoneProgress: MilestoneProgress[];
  valueMode: RewardValueMode;
  offersApplied: AppliedOffer[];
  capAmount: number | null;
  capRemaining: number | null;
  capAdjustment: number;
  eligible: boolean;
  ruleLabel: string;
  confidence: RuleConfidence;
  assumptions: string[];
};

const CATEGORY_PATTERNS: Array<[Exclude<PurchaseCategory, "auto">, RegExp]> = [
  ["rent", /\brent\b|housing society|maintenance/],
  ["education", /school|college|tuition|education|course|university/],
  ["insurance", /insurance|premium|lic\b/],
  ["government", /government|govt|tax|challan|municipal/],
  ["fuel", /fuel|petrol|diesel|hpcl|bpcl|indianoil|iocl/],
  ["utilities", /utility|electricity|water bill|gas bill|broadband|recharge|dth|airtel/],
  ["travel", /flight|airline|hotel|makemytrip|cleartrip|ixigo|travel|irctc|railway|uber|ola/],
  ["dining", /swiggy|zomato|restaurant|dinner|lunch|cafe|food|dineout/],
  ["grocery", /grocery|blinkit|zepto|bigbasket|dmart|instamart/],
  ["wallet", /wallet load|add money|paytm wallet|amazon pay balance/],
  ["shopping", /amazon|flipkart|myntra|shopping|store|electronics|apparel|fashion|lakme/],
];

export function inferCategory(merchant: string): Exclude<PurchaseCategory, "auto"> {
  const text = merchant.trim().toLowerCase();
  return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? "other";
}

export function inferChannel(merchant: string): Exclude<PaymentChannel, "auto"> {
  const text = merchant.trim().toLowerCase();
  if (/\bupi\b|bhim|qr code|rupay upi/.test(text)) return "upi";
  if (/google pay|gpay|airtel thanks|tata neu app|smartbuy|travel edge|partner app/.test(text)) return "app";
  if (/offline|in.store|at store|pos\b|swipe|tap/.test(text)) return "offline";
  return "online";
}

function rateForLegacyCategory(card: RecommendationCard, category: Exclude<PurchaseCategory, "auto">) {
  const legacyMap: Partial<Record<typeof category, string>> = {
    dining: "dining", travel: "travel", grocery: "grocery", shopping: "online",
  };
  const legacyKey = legacyMap[category];
  return legacyKey ? card.rates[legacyKey] : undefined;
}

function matchingMerchantRule(
  rules: MerchantRewardRule[], merchant: string,
  category: Exclude<PurchaseCategory, "auto">,
  channel: Exclude<PaymentChannel, "auto">,
) {
  const normalized = merchant.toLowerCase();
  return rules.find((rule) => {
    const merchantMatches = rule.matches.some((match) => match === "*" || normalized.includes(match.toLowerCase()));
    const channelMatches = !rule.channels?.length || rule.channels.includes(channel);
    const categoryMatches = !rule.categories?.length || rule.categories.includes(category);
    return merchantMatches && channelMatches && categoryMatches;
  });
}

function redemptionValuesForCurrency(currency: RewardCurrency, rewardUnits: number, pointsBalance?: number): RedemptionValue[] {
  const configured: RedemptionOption[] = currency.redemptionOptions?.length
    ? currency.redemptionOptions
    : [
        { id: "standard", type: "cash" as const, label: currency.standardRedemption, valuePerUnit: currency.standardValuePerUnit },
        ...(currency.optimisedValuePerUnit && currency.optimisedValuePerUnit !== currency.standardValuePerUnit
          ? [{ id: "optimised", type: "travel" as const, label: currency.optimisedRedemption ?? "Higher-value redemption", valuePerUnit: currency.optimisedValuePerUnit }]
          : []),
      ];
  return configured.map((option) => {
    const eligibleTier = pointsBalance === undefined ? undefined : (option.tiers ?? [])
      .filter((tier) => pointsBalance + rewardUnits >= tier.units && tier.value !== undefined)
      .sort((left, right) => ((right.value ?? 0) / right.units) - ((left.value ?? 0) / left.units))[0];
    const tierValuePerUnit = eligibleTier?.value === undefined ? undefined : eligibleTier.value / eligibleTier.units;
    const valuePerUnit = option.valuePerUnit ?? tierValuePerUnit;
    return {
    id: option.id,
    type: option.type,
    label: option.label,
    value: valuePerUnit === undefined ? null : Math.round(rewardUnits * valuePerUnit),
    valuePerUnit: valuePerUnit ?? null,
    convertedUnits: option.conversionUnitsPerPoint === undefined
      ? null : Number((rewardUnits * option.conversionUnitsPerPoint).toFixed(2)),
    conversionUnitLabel: option.conversionUnitLabel ?? null,
    tiers: option.tiers ?? [],
    conditions: option.conditions ?? [],
    sourceUrl: option.sourceUrl,
    confidence: option.confidence ?? "reviewed",
  }; });
}

function optionMatchesPreference(option: RedemptionValue, preference: RedemptionPreference) {
  if (preference === "cash") return option.type === "cash";
  if (preference === "shopping") return option.type === "voucher" || option.type === "product";
  if (preference === "travel") return option.type === "travel";
  return false;
}

function evaluateEarning(
  earning: RewardEarning, amount: number, valueMode: RewardValueMode,
  preference: RedemptionPreference = "balanced",
  pointsBalance?: number,
) {
  if (earning.kind === "cashback") {
    const value = Math.round((amount * earning.rate) / 100);
    return { rate: earning.rate, grossValue: value, standardValue: value, optimisedValue: value,
      rewardUnits: null, rewardUnitLabel: null, standardRedemption: null, optimisedRedemption: null,
      selectedRedemption: null, redemptionValues: [] as RedemptionValue[], bestKnownRedemptionValue: value };
  }
  const rawUnits = (amount / earning.spendUnit) * earning.units;
  const rewardUnits = earning.rounding === "exact" ? rawUnits : Math.floor(rawUnits);
  const redemptionValues = redemptionValuesForCurrency(earning.currency, rewardUnits, pointsBalance);
  const standardValue = Math.round(rewardUnits * earning.currency.standardValuePerUnit);
  const knownValues = redemptionValues.filter((option) => option.value !== null);
  const optimisedValue = Math.max(standardValue, ...knownValues.map((option) => option.value ?? 0));
  const preferred = preference === "balanced"
    ? null
    : knownValues.filter((option) => optionMatchesPreference(option, preference)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0] ?? null;
  const defaultRedemption = knownValues.find((option) => option.type === "cash") ?? knownValues[0] ?? null;
  const selectedRedemption = preference === "balanced" ? defaultRedemption : preferred;
  const grossValue = valueMode === "optimised"
    ? optimisedValue
    : preference === "balanced"
      ? selectedRedemption?.value ?? standardValue
      : selectedRedemption?.value ?? 0;
  return {
    rate: amount > 0 ? Number(((grossValue / amount) * 100).toFixed(2)) : 0,
    grossValue, standardValue, optimisedValue, rewardUnits,
    rewardUnitLabel: earning.currency.unitLabel,
    standardRedemption: earning.currency.standardRedemption,
    optimisedRedemption: earning.currency.optimisedRedemption ?? earning.currency.standardRedemption,
    selectedRedemption,
    redemptionValues,
    bestKnownRedemptionValue: optimisedValue,
  };
}

function milestoneProgress(
  cardId: string, model: RewardModel, input: RecommendationInput,
  category: Exclude<PurchaseCategory, "auto">, context: EvaluationContext,
) {
  const ledger = context.ledgers?.[cardId];
  return (model.milestones ?? []).map((milestone): MilestoneProgress => {
    const before = milestone.metric === "spend"
      ? milestone.period === "calendar_month" ? ledger?.monthlyEligibleSpend : ledger?.annualEligibleSpend
      : ledger?.qualifyingTransactions;
    const qualifiesCategory = !model.exclusions?.includes(category);
    const qualifies = qualifiesCategory && (milestone.metric === "spend" || input.amount >= (milestone.minTransactionAmount ?? 0));
    const increment = qualifies ? milestone.metric === "spend" ? input.amount : 1 : 0;
    const after = before === undefined ? null : before + increment;
    return {
      id: milestone.id,
      label: milestone.label,
      period: milestone.period,
      metric: milestone.metric,
      threshold: milestone.threshold,
      before: before ?? null,
      after,
      remaining: after === null ? null : Math.max(0, milestone.threshold - after),
      crossed: before !== undefined && before < milestone.threshold && (after ?? before) >= milestone.threshold,
      benefitLabel: milestone.benefitLabel,
      benefitValue: milestone.benefitValue,
      requiresEnrollment: Boolean(milestone.requiresEnrollment),
      sourceUrl: milestone.sourceUrl,
    };
  });
}

function asDate(value: string | Date | undefined) {
  if (value instanceof Date) return value;
  return value ? new Date(value) : new Date();
}

function offerMatches<T extends RecommendationCard>(
  offer: CardOffer, card: T, input: RecommendationInput,
  category: Exclude<PurchaseCategory, "auto">,
  channel: Exclude<PaymentChannel, "auto">, asOf: Date,
) {
  if (offer.cardIds?.length && !offer.cardIds.includes(card.id)) return false;
  if (offer.excludedCardIds?.includes(card.id)) return false;
  if (offer.issuer && offer.issuer !== card.bank) return false;
  if (offer.startsAt && asOf < new Date(offer.startsAt)) return false;
  if (offer.endsAt && asOf > new Date(offer.endsAt)) return false;
  if (input.amount < (offer.minSpend ?? 0)) return false;
  if (offer.categories?.length && !offer.categories.includes(category)) return false;
  if (offer.channels?.length && !offer.channels.includes(channel)) return false;
  const merchant = input.merchant.toLowerCase();
  return offer.merchantMatches.some((match) => match === "*" || merchant.includes(match.toLowerCase()));
}

function evaluateOffer(offer: CardOffer, amount: number, valueMode: RewardValueMode): AppliedOffer {
  let value = 0;
  if (offer.benefit.kind === "bonus_points") {
    value = evaluateEarning(offer.benefit.earning, amount, valueMode).grossValue;
  } else {
    const percentageValue = offer.benefit.rate === undefined ? 0 : (amount * offer.benefit.rate) / 100;
    value = offer.benefit.fixedAmount ?? percentageValue;
    if (offer.benefit.maxBenefit !== undefined) value = Math.min(value, offer.benefit.maxBenefit);
    value = Math.round(value);
  }
  return { id: offer.id, title: offer.title, value, sourceUrl: offer.sourceUrl, termsUrl: offer.termsUrl,
    couponCode: offer.couponCode, requiresEnrollment: Boolean(offer.requiresEnrollment), usageLimit: offer.usageLimit };
}

function applicableOffers<T extends RecommendationCard>(
  card: T, input: RecommendationInput,
  category: Exclude<PurchaseCategory, "auto">,
  channel: Exclude<PaymentChannel, "auto">, context: EvaluationContext,
) {
  const matches = (context.offers ?? [])
    .filter((offer) => offerMatches(offer, card, input, category, channel, asDate(context.asOf)))
    .map((offer) => ({ offer, applied: evaluateOffer(offer, input.amount, context.rewardValueMode ?? "standard") }))
    .filter(({ applied }) => applied.value > 0);
  const stackable = matches.filter(({ offer }) => offer.stackable).map(({ applied }) => applied);
  const bestNonStackable = matches.filter(({ offer }) => !offer.stackable)
    .sort((a, b) => b.applied.value - a.applied.value)[0]?.applied;
  return bestNonStackable ? [...stackable, bestNonStackable] : stackable;
}

export function evaluateCard<T extends RecommendationCard>(
  card: T, input: RecommendationInput, context: EvaluationContext = {},
): RecommendationResult<T> {
  const category = input.category === "auto" ? inferCategory(input.merchant) : input.category;
  const channel = input.channel === "auto" ? inferChannel(input.merchant) : input.channel;
  const model = card.rewardModel;
  const valueMode = context.rewardValueMode ?? "standard";
  const preference = context.redemptionPreference ?? "balanced";
  const milestones = milestoneProgress(card.id, model, input, category, context);
  const assumptions = [...(model.assumptions ?? [])];
  if (input.category === "auto") assumptions.unshift(`Category auto-detected as ${category}.`);
  if (input.channel === "auto") assumptions.unshift(`Payment route auto-detected as ${channel}.`);

  if (model.exclusions?.includes(category)) {
    const offersApplied = applicableOffers(card, input, category, channel, context);
    const offerValue = offersApplied.reduce((total, offer) => total + offer.value, 0);
    return {
      card, category, channel, rate: 0, grossValue: 0, baseValue: 0, offerValue, value: offerValue,
      standardValue: 0, optimisedValue: 0, rewardUnits: null, rewardUnitLabel: null,
      standardRedemption: null, optimisedRedemption: null, valueMode, offersApplied,
      selectedRedemption: null, redemptionValues: [], bestKnownRedemptionValue: 0, milestoneProgress: milestones,
      capAmount: null, capRemaining: null, capAdjustment: 0, eligible: offerValue > 0,
      ruleLabel: offerValue > 0 ? `Base rewards excluded; active offer still applies` : `${category} is excluded from rewards`,
      confidence: model.confidence, assumptions,
    };
  }

  const structuredMerchantRule = matchingMerchantRule(model.merchantRules ?? [], input.merchant, category, channel);
  const legacyMerchantRate = Object.entries(card.merchantRates ?? {})
    .find(([key]) => input.merchant.toLowerCase().includes(key.toLowerCase()))?.[1];
  const structuredEarning = structuredMerchantRule?.earning
    ?? model.channelEarnings?.[channel] ?? model.categoryEarnings?.[category] ?? model.defaultEarning;
  const structuredRate = structuredMerchantRule?.rate
    ?? model.channelRates?.[channel] ?? model.categoryRates?.[category];
  const legacyRate = structuredRate ?? legacyMerchantRate ?? rateForLegacyCategory(card, category) ?? card.baseRate;
  const earning: RewardEarning = structuredEarning ?? { kind: "cashback", rate: legacyRate };
  const earned = evaluateEarning(earning, input.amount, valueMode, preference, context.ledgers?.[card.id]?.pointsBalance);
  const capAmount = structuredMerchantRule?.capAmount ?? model.defaultCapAmount ?? null;
  const capRemaining = capAmount === null ? null : Math.max(0, capAmount - card.trackedValue);
  const baseValue = capRemaining === null ? earned.grossValue : Math.min(earned.grossValue, capRemaining);
  const capAdjustment = earned.grossValue - baseValue;
  const offersApplied = applicableOffers(card, input, category, channel, context);
  const offerValue = offersApplied.reduce((total, offer) => total + offer.value, 0);

  return {
    card, category, channel, rate: earned.rate, grossValue: earned.grossValue, baseValue, offerValue,
    value: baseValue + offerValue, standardValue: earned.standardValue, optimisedValue: earned.optimisedValue,
    rewardUnits: earned.rewardUnits, rewardUnitLabel: earned.rewardUnitLabel,
    standardRedemption: earned.standardRedemption, optimisedRedemption: earned.optimisedRedemption,
    selectedRedemption: earned.selectedRedemption, redemptionValues: earned.redemptionValues,
    bestKnownRedemptionValue: earned.bestKnownRedemptionValue, milestoneProgress: milestones,
    valueMode, offersApplied, capAmount, capRemaining, capAdjustment, eligible: true,
    ruleLabel: structuredMerchantRule?.label
      ?? (structuredEarning !== undefined || structuredRate !== undefined ? `${category} / ${channel} rule` : "Base reward rule"),
    confidence: model.confidence, assumptions,
  };
}

const CONFIDENCE_ORDER: Record<RuleConfidence, number> = { verified: 3, reviewed: 2, indicative: 1 };

export function rankCards<T extends RecommendationCard>(cards: T[], input: RecommendationInput, context: EvaluationContext = {}) {
  return cards.map((card) => evaluateCard(card, input, context))
    .sort((a, b) => b.value - a.value || Number(b.eligible) - Number(a.eligible)
      || CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence]);
}

export function confidenceLabel(confidence: RuleConfidence) {
  if (confidence === "verified") return "Issuer terms verified";
  if (confidence === "reviewed") return "Issuer terms reviewed";
  return "Indicative — verify before paying";
}
