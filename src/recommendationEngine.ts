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
  network?: string;
  baseRate: number;
  rates: Record<string, number>;
  merchantRates?: Record<string, number>;
  trackedValue: number;
  rewardModel: RewardModel;
};

export type PaymentIntentCandidate<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export type PaymentIntentAnalysis = {
  rawText: string;
  normalizedText: string;
  merchantResolution: MerchantResolution | null;
  categoryCandidates: PaymentIntentCandidate<Exclude<PurchaseCategory, "auto">>[];
  channelCandidates: PaymentIntentCandidate<Exclude<PaymentChannel, "auto">>[];
  categoryQuestion: string;
  channelQuestion: string;
  categoryConfidence: "high" | "needs_confirmation";
  channelConfidence: "high" | "needs_confirmation";
  overallConfidence: "high" | "needs_confirmation" | "unknown";
};

export type MerchantIntentCandidate = PaymentIntentCandidate<string> & {
  offerId?: string;
};

export type MerchantEntity = {
  id: string;
  displayName: string;
  aliases: string[];
  categoryCandidates: Array<Exclude<PurchaseCategory, "auto">>;
  channelCandidates: Array<Exclude<PaymentChannel, "auto">>;
  confidence: RuleConfidence;
  sourceUrl?: string;
};

export type MerchantResolution = {
  entityId: string;
  displayName: string;
  matchedAlias: string;
  score: number;
  method: "exact" | "fuzzy";
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

const PAYMENT_TOKEN_REPLACEMENTS: Record<string, string> = {
  chroma: "croma",
  swigy: "swiggy",
  swiggi: "swiggy",
  instamrt: "instamart",
  amzon: "amazon",
  amazn: "amazon",
  lkame: "lakme",
  saloon: "salon",
  elecricity: "electricity",
  electicity: "electricity",
  bijlee: "bijli",
  kirana: "grocery",
  rashan: "ration",
  gpay: "google pay",
};

export function normalizePaymentText(value: string) {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/₹|rs\.?|inr/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return normalized.split(/\s+/).filter(Boolean).flatMap((token) => (
    PAYMENT_TOKEN_REPLACEMENTS[token]?.split(" ") ?? [token]
  )).join(" ");
}

const CATEGORY_PATTERNS: Array<[Exclude<PurchaseCategory, "auto">, RegExp]> = [
  ["rent", /\brent\b|house rent|housing society|maintenance|kiraya|makaan/],
  ["education", /school|college|tuition|education|course|university|coaching|fees|padhai/],
  ["insurance", /insurance|premium|\blic\b|bima|beema/],
  ["government", /government|\bgovt\b|\btax\b|challan|municipal|sarkari/],
  ["fuel", /fuel|petrol|diesel|hpcl|bpcl|indianoil|iocl|petrol pump/],
  ["utilities", /utility|electricity|bijli|water bill|paani|gas bill|broadband|recharge|dth|airtel/],
  ["travel", /flight|airline|hotel|makemytrip|cleartrip|ixigo|travel|irctc|railway|train|uber|ola|cab|taxi/],
  ["dining", /swiggy|zomato|restaurant|dinner|lunch|cafe|food|dineout|khana|meal|dhaba/],
  ["grocery", /grocery|groceries|ration|sabzi|blinkit|zepto|bigbasket|dmart|instamart|supermarket/],
  ["wallet", /wallet load|add money|wallet balance|paytm wallet|amazon pay balance/],
  ["shopping", /amazon|flipkart|myntra|shopping|store|electronics|apparel|fashion|croma|vijay sales|reliance digital|cosmetic|makeup|mobile|phone|laptop|television|\btv\b|kapde|clothes|jewellery|jewelry/],
];

const ALL_CATEGORY_VALUES: Array<Exclude<PurchaseCategory, "auto">> = [
  "dining", "grocery", "shopping", "travel", "utilities", "fuel",
  "rent", "education", "insurance", "government", "wallet", "other",
];

export function inferCategory(merchant: string): Exclude<PurchaseCategory, "auto"> {
  const text = normalizePaymentText(merchant);
  if (/swiggy/.test(text) && /instamart|grocery|groceries/.test(text)) return "grocery";
  if (/swiggy/.test(text) && /dineout|restaurant|food|meal/.test(text)) return "dining";
  if (/salon|haircut|hair cut|spa|beauty parlou?r/.test(text)) return "other";
  return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? "other";
}

export function inferChannel(merchant: string): PaymentChannel {
  const text = normalizePaymentText(merchant);
  if (/\bupi\b|bhim|qr code|rupay upi/.test(text)) return "upi";
  if (/google pay|gpay|airtel thanks|tata neu app|smartbuy|travel edge|partner app/.test(text)) return "app";
  if (/offline|in.store|at store|pos\b|swipe|tap/.test(text)) return "offline";
  if (/online|website|web site|web-site|checkout page|e.?commerce/.test(text)) return "online";
  return "auto";
}

const CATEGORY_LABELS: Record<Exclude<PurchaseCategory, "auto">, [string, string]> = {
  dining: ["Food delivery or dining", "Restaurant, takeaway or delivered food"],
  grocery: ["Groceries", "Groceries or everyday essentials"],
  shopping: ["Shopping", "Products such as electronics, fashion or household items"],
  travel: ["Travel", "Flights, hotels, trains or cabs"],
  utilities: ["Bill or recharge", "Electricity, mobile, broadband, gas or DTH"],
  fuel: ["Fuel", "Petrol, diesel or fuel-station payment"],
  rent: ["Rent", "House rent or housing payment"],
  education: ["Education", "School, college, tuition or course fee"],
  insurance: ["Insurance", "Insurance premium payment"],
  government: ["Government or tax", "Tax, challan or government payment"],
  wallet: ["Wallet load", "Adding money to a wallet or stored balance"],
  other: ["Other service", "Salon, professional service or another payment"],
};

const CHANNEL_LABELS: Record<Exclude<PaymentChannel, "auto">, [string, string]> = {
  online: ["Card on a website", "Paying by card on the merchant website"],
  offline: ["Card at the store", "Swiping, inserting or tapping the card in person"],
  app: ["Card in an app", "Paying inside a merchant or partner app"],
  upi: ["RuPay credit card via UPI", "Paying a merchant UPI ID or QR with an eligible RuPay credit card"],
};

function uniqueCandidates<T extends string>(values: T[], factory: (value: T) => PaymentIntentCandidate<T>) {
  return [...new Set(values)].map(factory);
}

function categoryCandidate(value: Exclude<PurchaseCategory, "auto">) {
  const labels = CATEGORY_LABELS[value];
  return { value, label: labels[0], description: labels[1] };
}

function channelCandidate(value: Exclude<PaymentChannel, "auto">) {
  const labels = CHANNEL_LABELS[value];
  return { value, label: labels[0], description: labels[1] };
}

function editDistance(left: string, right: string) {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, (_, row) => (
    Array.from({ length: columns }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
  ));
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution = matrix[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, substitution);
      if (
        row > 1 && column > 1
        && left[row - 1] === right[column - 2]
        && left[row - 2] === right[column - 1]
      ) matrix[row][column] = Math.min(matrix[row][column], matrix[row - 2][column - 2] + 1);
    }
  }
  return matrix[left.length][right.length];
}

function similarity(left: string, right: string) {
  const longest = Math.max(left.length, right.length);
  return longest ? 1 - (editDistance(left, right) / longest) : 1;
}

function aliasScore(text: string, alias: string) {
  if (` ${text} `.includes(` ${alias} `)) return 1;
  const textTokens = text.split(" ").filter(Boolean);
  const aliasTokens = alias.split(" ").filter(Boolean);
  if (!textTokens.length || !aliasTokens.length || alias.length < 4) return 0;
  if (aliasTokens.length === 1) {
    return Math.max(...textTokens.filter((token) => token.length >= 4).map((token) => similarity(token, alias)), 0);
  }
  const windows = textTokens.flatMap((_, index) => (
    [aliasTokens.length - 1, aliasTokens.length, aliasTokens.length + 1]
      .filter((size) => size > 0)
      .map((size) => textTokens.slice(index, index + size).join(" "))
      .filter(Boolean)
  ));
  return Math.max(...windows.map((window) => similarity(window, alias)), 0);
}

export function resolveMerchantEntity(rawText: string, directory: MerchantEntity[]): MerchantResolution | null {
  const text = normalizePaymentText(rawText);
  if (!text || !directory.length) return null;
  const matches = directory.flatMap((entity) => entity.aliases.map((candidateAlias) => {
    const alias = normalizePaymentText(candidateAlias);
    const score = aliasScore(text, alias);
    return { entity, alias, score, method: score === 1 ? "exact" as const : "fuzzy" as const };
  })).filter((candidate) => candidate.score >= 0.72)
    .sort((left, right) => right.score - left.score || right.alias.length - left.alias.length);
  if (!matches.length) return null;
  const winner = matches[0];
  const competingEntity = matches.find((candidate) => candidate.entity.id !== winner.entity.id);
  if (winner.method === "fuzzy" && competingEntity && winner.score - competingEntity.score < 0.08) return null;
  return {
    entityId: winner.entity.id,
    displayName: winner.entity.displayName,
    matchedAlias: winner.alias,
    score: Math.round(winner.score * 100) / 100,
    method: winner.method,
  };
}

function entityForResolution(resolution: MerchantResolution | null, directory: MerchantEntity[]) {
  return resolution ? directory.find((entity) => entity.id === resolution.entityId) ?? null : null;
}

function explicitCategoryMatches(text: string) {
  if (/swiggy/.test(text) && /instamart|grocery|groceries/.test(text)) return ["grocery"] as Array<Exclude<PurchaseCategory, "auto">>;
  if (/swiggy/.test(text) && /dineout|restaurant|food|meal|khana/.test(text)) return ["dining"] as Array<Exclude<PurchaseCategory, "auto">>;
  if (/movie|cinema|pvr|inox|bookmyshow/.test(text)) return ["other"] as Array<Exclude<PurchaseCategory, "auto">>;
  return [...new Set(CATEGORY_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([value]) => value))];
}

function textWithoutResolvedMerchant(text: string, entity: MerchantEntity | null) {
  if (!entity) return text;
  return entity.aliases.reduce((current, aliasValue) => {
    const alias = normalizePaymentText(aliasValue);
    return ` ${current} `.replace(` ${alias} `, " ").trim();
  }, text);
}

export function analysePaymentIntent(
  rawText: string,
  category: PurchaseCategory = "auto",
  channel: PaymentChannel = "auto",
  directory: MerchantEntity[] = [],
): PaymentIntentAnalysis {
  const text = normalizePaymentText(rawText);
  const merchantResolution = resolveMerchantEntity(text, directory);
  const matchedEntity = entityForResolution(merchantResolution, directory);
  let categoryValues: Exclude<PurchaseCategory, "auto">[];
  let categoryQuestion = "What is this payment for?";
  let categoryConfidence: PaymentIntentAnalysis["categoryConfidence"] = "high";
  const explicitCategories = explicitCategoryMatches(text);
  const specificCategories = matchedEntity ? explicitCategoryMatches(textWithoutResolvedMerchant(text, matchedEntity)) : [];

  if (category !== "auto") categoryValues = [category];
  else if (specificCategories.length === 1) categoryValues = specificCategories;
  else if (/swiggy/.test(text) && /instamart|grocery|groceries/.test(text)) categoryValues = ["grocery"];
  else if (/swiggy/.test(text) && /dineout|restaurant|food|meal|khana/.test(text)) categoryValues = ["dining"];
  else if (matchedEntity?.id === "swiggy" || /swiggy/.test(text)) {
    categoryValues = ["dining", "grocery"];
    categoryQuestion = "What are you ordering on Swiggy?";
    categoryConfidence = "needs_confirmation";
  } else if ((matchedEntity?.id === "amazon" || /amazon(?!\s+pay\s+(?:wallet|balance))/.test(text))
    && !/fresh|grocery|groceries|flight|hotel|travel|bill|recharge|electricity|electronics|phone|mobile|fashion|shopping|product|wallet load|add money/.test(text)) {
    categoryValues = ["shopping", "grocery", "travel", "utilities", "wallet"];
    categoryQuestion = "What are you paying for on Amazon?";
    categoryConfidence = "needs_confirmation";
  } else if (/google pay|paytm|phonepe|amazon pay/.test(text) && explicitCategories.length === 0) {
    categoryValues = ["utilities", "shopping", "wallet", "other"];
    categoryQuestion = "What is the payment inside the app for?";
    categoryConfidence = "needs_confirmation";
  } else if (!matchedEntity && explicitCategories.length === 1) {
    categoryValues = explicitCategories;
  } else if (matchedEntity?.categoryCandidates.length) {
    categoryValues = matchedEntity.categoryCandidates;
    categoryConfidence = categoryValues.length === 1 ? "high" : "needs_confirmation";
    if (categoryValues.length > 1) categoryQuestion = `What are you paying for at ${matchedEntity.displayName}?`;
  } else if (/salon|haircut|hair cut|spa|beauty parlou?r|pharmacy|chemist|medicine|medical|hospital|doctor|clinic|gym|membership|home service|movie|cinema|wedding|venue|event/.test(text)) {
    categoryValues = ["other"];
  } else {
    categoryValues = ALL_CATEGORY_VALUES;
    categoryQuestion = `What is “${rawText.trim()}” for?`;
    categoryConfidence = "needs_confirmation";
  }

  let channelValues: Exclude<PaymentChannel, "auto">[];
  let channelQuestion = "How will you make this payment?";
  let channelConfidence: PaymentIntentAnalysis["channelConfidence"] = "high";
  const explicitChannel = channel === "auto" ? inferChannel(text) : channel;
  if (explicitChannel !== "auto") channelValues = [explicitChannel];
  else if (/croma|vijay sales|reliance digital|salon|spa|store|mall/.test(text)) {
    channelValues = ["offline", "online", "app", "upi"];
    channelQuestion = /salon|spa/.test(text) ? "How will you pay for this salon visit?" : "Are you buying online or at the store?";
  } else if (/swiggy|zomato|blinkit|zepto|instamart|amazon|flipkart|myntra|bigbasket/.test(text)) {
    channelValues = ["app", "online", "upi"];
    channelQuestion = "How will you pay at checkout?";
  } else if (/flight|airline|hotel|travel|electricity|bill|recharge|broadband|insurance|premium|rent|school|college|course/.test(text)) {
    channelValues = ["app", "online", "upi"];
  } else if (/fuel|petrol|diesel|restaurant|cafe/.test(text)) {
    channelValues = ["offline", "upi"];
  } else if (matchedEntity?.channelCandidates.length) {
    channelValues = matchedEntity.channelCandidates;
  } else channelValues = ["online", "offline", "app", "upi"];

  const categoryCandidates = uniqueCandidates(categoryValues, categoryCandidate);
  const channelCandidates = uniqueCandidates(channelValues, channelCandidate);
  if (channelCandidates.length > 1) channelConfidence = "needs_confirmation";
  const overallConfidence: PaymentIntentAnalysis["overallConfidence"] = (
    !merchantResolution && categoryValues.length === ALL_CATEGORY_VALUES.length
      ? "unknown"
      : categoryConfidence === "high" && channelConfidence === "high" ? "high" : "needs_confirmation"
  );
  return {
    rawText: rawText.trim(),
    normalizedText: text,
    merchantResolution,
    categoryCandidates,
    channelCandidates,
    categoryQuestion,
    channelQuestion,
    categoryConfidence,
    channelConfidence,
    overallConfidence,
  };
}

const GENERIC_MERCHANT_TERMS = new Set([
  "salon", "spa", "haircut", "beauty", "parlour", "parlor",
  "grocery", "groceries", "essentials", "supermarket",
  "restaurant", "cafe", "food", "dinner", "lunch",
  "electronics", "shopping", "store", "mall", "clothes", "fashion",
  "flight", "hotel", "travel", "cab", "train",
  "electricity", "bill", "recharge", "broadband", "utility",
  "fuel", "petrol", "diesel", "rent", "school", "college", "fees",
  "insurance", "premium", "tax", "wallet", "payment", "purchase", "order",
]);

const GENERIC_INPUT_FILLERS = new Set([
  "a", "an", "the", "at", "for", "from", "in", "inside", "my", "near", "nearby", "local",
  "on", "to", "visit", "pay", "paying", "buy", "buying", "karna", "karni", "karne", "ka", "ki", "ke",
  "se", "pe", "mein", "hai", "another", "other",
]);

export function isGenericMerchantInput(rawText: string) {
  const tokens = normalizePaymentText(rawText).match(/[a-z0-9]+/g) ?? [];
  if (!tokens.some((token) => GENERIC_MERCHANT_TERMS.has(token))) return false;
  return tokens.every((token) => GENERIC_MERCHANT_TERMS.has(token) || GENERIC_INPUT_FILLERS.has(token) || /^\d+$/.test(token));
}

function displayMerchantName(value: string) {
  return value.split(/[\s_-]+/).filter(Boolean).map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`).join(" ");
}

function genericAlternativeLabel(rawText: string) {
  const text = normalizePaymentText(rawText);
  if (/salon|spa|haircut|beauty parlou?r/.test(text)) return "Another salon";
  if (/grocery|groceries|essentials|supermarket/.test(text)) return "Another grocery merchant";
  if (/restaurant|cafe|food|dinner|lunch/.test(text)) return "Another restaurant or food merchant";
  if (/electronics|shopping|store|mall|fashion/.test(text)) return "Another store";
  return "Another merchant";
}

export function merchantClarificationCandidates(
  rawText: string,
  categories: Array<Exclude<PurchaseCategory, "auto">>,
  offers: CardOffer[],
  asOf: string | Date = new Date(),
): MerchantIntentCandidate[] {
  if (!isGenericMerchantInput(rawText)) return [];
  const currentDate = asDate(asOf);
  const normalized = normalizePaymentText(rawText);
  const categorySet = new Set(categories);
  const candidates = new Map<string, MerchantIntentCandidate>();

  for (const offer of offers) {
    if (offer.startsAt && currentDate < new Date(offer.startsAt)) continue;
    if (offer.endsAt && currentDate > new Date(offer.endsAt)) continue;
    const offerCategories = offer.categories?.length
      ? offer.categories
      : [inferCategory(`${offer.title} ${offer.merchantMatches.join(" ")}`)];
    if (!offerCategories.some((category) => categorySet.has(category))) continue;
    for (const match of offer.merchantMatches) {
      const value = match.trim().toLowerCase();
      if (!value || value === "*" || normalized.includes(value) || candidates.has(value)) continue;
      candidates.set(value, {
        value: displayMerchantName(value),
        label: displayMerchantName(value),
        description: `Known offer: ${offer.title}`,
        offerId: offer.id,
      });
    }
  }

  if (!candidates.size) return [];
  return [
    ...candidates.values(),
    {
      value: rawText.trim(),
      label: genericAlternativeLabel(rawText),
      description: "Not one of the offer-linked merchants above",
    },
  ];
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
  const inferredChannel = input.channel === "auto" ? inferChannel(input.merchant) : input.channel;
  const channel: Exclude<PaymentChannel, "auto"> = inferredChannel === "auto" ? "online" : inferredChannel;
  const model = card.rewardModel;
  const valueMode = context.rewardValueMode ?? "standard";
  const preference = context.redemptionPreference ?? "balanced";
  const milestones = milestoneProgress(card.id, model, input, category, context);
  const assumptions = [...(model.assumptions ?? [])];
  if (input.category === "auto") assumptions.unshift(`Category auto-detected as ${category}.`);
  if (input.channel === "auto" && inferredChannel !== "auto") assumptions.unshift(`Payment route auto-detected as ${channel}.`);
  if (input.channel === "auto" && inferredChannel === "auto") assumptions.unshift("Payment route was not stated; the online route is shown only as a provisional estimate.");

  if (channel === "upi" && card.network && card.network !== "RuPay") {
    return {
      card, category, channel, rate: 0, grossValue: 0, baseValue: 0, offerValue: 0, value: 0,
      standardValue: 0, optimisedValue: 0, rewardUnits: null, rewardUnitLabel: null,
      standardRedemption: null, optimisedRedemption: null, valueMode, offersApplied: [],
      selectedRedemption: null, redemptionValues: [], bestKnownRedemptionValue: 0, milestoneProgress: milestones,
      capAmount: null, capRemaining: null, capAdjustment: 0, eligible: false,
      ruleLabel: "Credit-card UPI requires an eligible RuPay card",
      confidence: model.confidence, assumptions,
    };
  }

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
