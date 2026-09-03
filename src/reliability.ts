import type { RuleConfidence } from "./recommendationEngine";

export const RELIABILITY_EVENT_NAMES = [
  "screen_viewed",
  "payment_started",
  "wallet_required",
  "clarification_shown",
  "clarification_answered",
  "recommendation_viewed",
  "recommendation_followed",
  "alternative_card_used",
  "intent_confirmed",
  "intent_corrected",
  "reward_issue_reported",
  "wallet_saved",
  "redemption_preference_updated",
] as const;

export type ReliabilityEventName = typeof RELIABILITY_EVENT_NAMES[number];
export type IntentConfidence = "high" | "needs_confirmation" | "unknown";
export type DecisionTrustLevel = "high" | "review" | "indicative";

export type DecisionTrust = {
  level: DecisionTrustLevel;
  label: string;
  explanation: string;
};

export function decisionTrust(
  ruleConfidence: RuleConfidence,
  intentConfidence: IntentConfidence,
  hasIssuerSource: boolean,
): DecisionTrust {
  if (ruleConfidence === "verified" && intentConfidence === "high" && hasIssuerSource) {
    return {
      level: "high",
      label: "High decision confidence",
      explanation: "The payment was understood and the winning reward rule is backed by an issuer source.",
    };
  }

  if (ruleConfidence === "indicative" || intentConfidence === "unknown") {
    return {
      level: "indicative",
      label: "Indicative estimate",
      explanation: "CardSmart can compare the wallet, but this result needs an issuer-terms check before paying.",
    };
  }

  return {
    level: "review",
    label: "Reviewed estimate",
    explanation: intentConfidence === "needs_confirmation"
      ? "The winning card is stable across the plausible interpretations, but the payment description was not fully specific."
      : "The rule has been reviewed, but it is not yet backed by a complete issuer-verification record.",
  };
}

function safeValue(value: unknown): string | number | boolean | null | string[] {
  if (typeof value === "string") return value.slice(0, 160);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, 12)
    .map((item) => item.slice(0, 80));
  return String(value ?? "").slice(0, 160);
}

export function safeEventMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .slice(0, 24)
      .map(([key, value]) => [key.slice(0, 64), safeValue(value)]),
  );
}

export function reliabilitySessionId(storage?: Pick<Storage, "getItem" | "setItem">) {
  const store = storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  const existing = store?.getItem("cardsmart-reliability-session");
  if (existing && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(existing)) return existing;
  const next = crypto.randomUUID();
  store?.setItem("cardsmart-reliability-session", next);
  return next;
}
