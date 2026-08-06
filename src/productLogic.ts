import type { PaymentChannel, PurchaseCategory } from "./recommendationEngine";

export type SavedPaymentContext = {
  category: PurchaseCategory;
  paymentChannel: PaymentChannel;
};

const PURCHASE_CATEGORIES = new Set<PurchaseCategory>([
  "auto", "dining", "grocery", "shopping", "travel", "utilities", "fuel",
  "rent", "education", "insurance", "government", "wallet", "other",
]);

const PAYMENT_CHANNELS = new Set<PaymentChannel>([
  "auto", "online", "offline", "upi", "app",
]);

export function savedPaymentContext(value: unknown): SavedPaymentContext {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const category = PURCHASE_CATEGORIES.has(record.category as PurchaseCategory)
    ? record.category as PurchaseCategory
    : "auto";
  const paymentChannel = PAYMENT_CHANNELS.has(record.payment_channel as PaymentChannel)
    ? record.payment_channel as PaymentChannel
    : "auto";
  return { category, paymentChannel };
}

export function uniqueKnownIds(ids: string[], knownIds: Iterable<string>) {
  const known = new Set(knownIds);
  return Array.from(new Set(ids.filter((id) => known.has(id))));
}

export function netIncrementalValue(annualIncrementalReward: number, annualFee: number) {
  return Math.round(annualIncrementalReward - annualFee);
}

export function incomeBandValue(value: string) {
  const values: Record<string, number> = {
    "Below ₹25,000": 20000,
    "₹25,000–₹49,999": 37500,
    "₹50,000–₹99,999": 75000,
    "₹1,00,000–₹1,99,999": 150000,
    "₹2,00,000–₹4,99,999": 300000,
    "₹5,00,000+": 500000,
  };
  return values[value] ?? 0;
}

export function annualFeeLimit(value: string) {
  const values: Record<string, number> = {
    "Lifetime free only": 0,
    "Up to ₹1,000": 1000,
    "Up to ₹3,000": 3000,
    "Up to ₹10,000": 10000,
    "Any fee if value is higher": Number.POSITIVE_INFINITY,
  };
  return values[value] ?? 0;
}
