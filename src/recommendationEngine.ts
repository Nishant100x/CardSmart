export type PurchaseCategory =
  | "auto"
  | "dining"
  | "travel"
  | "grocery"
  | "shopping"
  | "utilities"
  | "fuel"
  | "rent"
  | "education"
  | "insurance"
  | "government"
  | "wallet"
  | "other";

export type PaymentChannel = "auto" | "online" | "offline" | "upi" | "app";
export type RuleConfidence = "verified" | "reviewed" | "indicative";

export type MerchantRewardRule = {
  matches: string[];
  rate: number;
  channels?: Exclude<PaymentChannel, "auto">[];
  categories?: Exclude<PurchaseCategory, "auto">[];
  capAmount?: number;
  label: string;
};

export type RewardModel = {
  confidence: RuleConfidence;
  reviewedOn?: string;
  rewardLabel?: string;
  exclusions?: Exclude<PurchaseCategory, "auto">[];
  merchantRules?: MerchantRewardRule[];
  categoryRates?: Partial<Record<Exclude<PurchaseCategory, "auto">, number>>;
  channelRates?: Partial<Record<Exclude<PaymentChannel, "auto">, number>>;
  defaultCapAmount?: number;
  assumptions?: string[];
};

export type RecommendationCard = {
  id: string;
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

export type RecommendationResult<T extends RecommendationCard> = {
  card: T;
  category: Exclude<PurchaseCategory, "auto">;
  channel: Exclude<PaymentChannel, "auto">;
  rate: number;
  grossValue: number;
  value: number;
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
  ["shopping", /amazon|flipkart|myntra|shopping|store|electronics|apparel|fashion/],
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
    dining: "dining",
    travel: "travel",
    grocery: "grocery",
    shopping: "online",
  };
  const legacyKey = legacyMap[category];
  return legacyKey ? card.rates[legacyKey] : undefined;
}

function matchingMerchantRule(
  rules: MerchantRewardRule[],
  merchant: string,
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

export function evaluateCard<T extends RecommendationCard>(
  card: T,
  input: RecommendationInput,
): RecommendationResult<T> {
  const category = input.category === "auto" ? inferCategory(input.merchant) : input.category;
  const channel = input.channel === "auto" ? inferChannel(input.merchant) : input.channel;
  const model = card.rewardModel;
  const assumptions = [...(model.assumptions ?? [])];

  if (input.category === "auto") assumptions.unshift(`Category auto-detected as ${category}.`);
  if (input.channel === "auto") assumptions.unshift(`Payment route auto-detected as ${channel}.`);

  if (model.exclusions?.includes(category)) {
    return {
      card,
      category,
      channel,
      rate: 0,
      grossValue: 0,
      value: 0,
      capAmount: null,
      capRemaining: null,
      capAdjustment: 0,
      eligible: false,
      ruleLabel: `${category} is excluded from rewards`,
      confidence: model.confidence,
      assumptions,
    };
  }

  const structuredMerchantRule = matchingMerchantRule(
    model.merchantRules ?? [],
    input.merchant,
    category,
    channel,
  );
  const legacyMerchantRate = Object.entries(card.merchantRates ?? {})
    .find(([key]) => input.merchant.toLowerCase().includes(key.toLowerCase()))?.[1];
  const structuredRate = structuredMerchantRule?.rate
    ?? model.channelRates?.[channel]
    ?? model.categoryRates?.[category];
  const rate = structuredRate ?? legacyMerchantRate ?? rateForLegacyCategory(card, category) ?? card.baseRate;
  const capAmount = structuredMerchantRule?.capAmount ?? model.defaultCapAmount ?? null;
  const grossValue = Math.round((input.amount * rate) / 100);
  const capRemaining = capAmount === null ? null : Math.max(0, capAmount - card.trackedValue);
  const value = capRemaining === null ? grossValue : Math.min(grossValue, capRemaining);
  const capAdjustment = grossValue - value;

  return {
    card,
    category,
    channel,
    rate,
    grossValue,
    value,
    capAmount,
    capRemaining,
    capAdjustment,
    eligible: true,
    ruleLabel: structuredMerchantRule?.label
      ?? (structuredRate !== undefined ? `${category} / ${channel} rule` : "Base reward rule"),
    confidence: model.confidence,
    assumptions,
  };
}

const CONFIDENCE_ORDER: Record<RuleConfidence, number> = {
  verified: 3,
  reviewed: 2,
  indicative: 1,
};

export function rankCards<T extends RecommendationCard>(cards: T[], input: RecommendationInput) {
  return cards
    .map((card) => evaluateCard(card, input))
    .sort((a, b) => b.value - a.value
      || Number(b.eligible) - Number(a.eligible)
      || CONFIDENCE_ORDER[b.confidence] - CONFIDENCE_ORDER[a.confidence]);
}

export function confidenceLabel(confidence: RuleConfidence) {
  if (confidence === "verified") return "Issuer rule verified";
  if (confidence === "reviewed") return "Issuer rule reviewed · assumptions apply";
  return "Indicative rule · verify before paying";
}
