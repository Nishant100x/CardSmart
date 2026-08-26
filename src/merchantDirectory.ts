import type { MerchantEntity, PaymentChannel, PurchaseCategory, RuleConfidence } from "./recommendationEngine";

type MerchantSeed = {
  id: string;
  displayName: string;
  aliases: string[];
  categories: Array<Exclude<PurchaseCategory, "auto">>;
  channels: Array<Exclude<PaymentChannel, "auto">>;
  confidence?: RuleConfidence;
};

function merchant(seed: MerchantSeed): MerchantEntity {
  return {
    id: seed.id,
    displayName: seed.displayName,
    aliases: seed.aliases,
    categoryCandidates: seed.categories,
    channelCandidates: seed.channels,
    confidence: seed.confidence ?? "reviewed",
  };
}

export const FALLBACK_MERCHANT_DIRECTORY: MerchantEntity[] = [
  merchant({ id: "croma", displayName: "Croma", aliases: ["croma", "chroma"], categories: ["shopping"], channels: ["offline", "online", "app", "upi"] }),
  merchant({ id: "reliance-digital", displayName: "Reliance Digital", aliases: ["reliance digital", "reliance electronics"], categories: ["shopping"], channels: ["offline", "online", "app", "upi"] }),
  merchant({ id: "vijay-sales", displayName: "Vijay Sales", aliases: ["vijay sales"], categories: ["shopping"], channels: ["offline", "online", "app", "upi"] }),
  merchant({ id: "flipkart", displayName: "Flipkart", aliases: ["flipkart", "flip kart"], categories: ["shopping"], channels: ["app", "online", "upi"] }),
  merchant({ id: "myntra", displayName: "Myntra", aliases: ["myntra"], categories: ["shopping"], channels: ["app", "online", "upi"] }),
  merchant({ id: "nykaa", displayName: "Nykaa", aliases: ["nykaa", "naykaa"], categories: ["shopping"], channels: ["app", "online", "upi"] }),
  merchant({ id: "amazon", displayName: "Amazon", aliases: ["amazon", "amazon india"], categories: ["shopping", "grocery", "travel", "utilities", "wallet"], channels: ["app", "online", "upi"] }),
  merchant({ id: "swiggy", displayName: "Swiggy", aliases: ["swiggy", "swigy"], categories: ["dining", "grocery"], channels: ["app", "online", "upi"] }),
  merchant({ id: "zomato", displayName: "Zomato", aliases: ["zomato", "zomatto"], categories: ["dining"], channels: ["app", "online", "upi"] }),
  merchant({ id: "blinkit", displayName: "Blinkit", aliases: ["blinkit", "blink it", "grofers"], categories: ["grocery"], channels: ["app", "online", "upi"] }),
  merchant({ id: "zepto", displayName: "Zepto", aliases: ["zepto"], categories: ["grocery"], channels: ["app", "online", "upi"] }),
  merchant({ id: "bigbasket", displayName: "BigBasket", aliases: ["bigbasket", "big basket", "bbnow"], categories: ["grocery"], channels: ["app", "online", "upi"] }),
  merchant({ id: "dmart", displayName: "DMart", aliases: ["dmart", "d mart", "dmart ready"], categories: ["grocery", "shopping"], channels: ["offline", "app", "online", "upi"] }),
  merchant({ id: "lakme", displayName: "Lakme Salon", aliases: ["lakme", "lakme salon"], categories: ["other"], channels: ["offline", "online", "app", "upi"] }),
  merchant({ id: "urban-company", displayName: "Urban Company", aliases: ["urban company", "urban clap", "urbanclap"], categories: ["other"], channels: ["app", "online"] }),
  merchant({ id: "bookmyshow", displayName: "BookMyShow", aliases: ["bookmyshow", "book my show", "bms"], categories: ["other"], channels: ["app", "online"] }),
  merchant({ id: "makemytrip", displayName: "MakeMyTrip", aliases: ["makemytrip", "make my trip", "mmt"], categories: ["travel"], channels: ["app", "online"] }),
  merchant({ id: "cleartrip", displayName: "Cleartrip", aliases: ["cleartrip", "clear trip"], categories: ["travel"], channels: ["app", "online"] }),
  merchant({ id: "ixigo", displayName: "ixigo", aliases: ["ixigo"], categories: ["travel"], channels: ["app", "online"] }),
  merchant({ id: "irctc", displayName: "IRCTC", aliases: ["irctc", "rail connect"], categories: ["travel"], channels: ["app", "online"] }),
  merchant({ id: "uber", displayName: "Uber", aliases: ["uber"], categories: ["travel"], channels: ["app"] }),
  merchant({ id: "ola", displayName: "Ola", aliases: ["ola", "ola cabs"], categories: ["travel"], channels: ["app"] }),
  merchant({ id: "airtel", displayName: "Airtel", aliases: ["airtel", "airtel thanks"], categories: ["utilities"], channels: ["app", "online"] }),
  merchant({ id: "google-pay", displayName: "Google Pay", aliases: ["google pay", "gpay"], categories: ["utilities", "shopping", "other"], channels: ["app"] }),
  merchant({ id: "phonepe", displayName: "PhonePe", aliases: ["phonepe", "phone pe"], categories: ["utilities", "shopping", "wallet", "other"], channels: ["app"] }),
  merchant({ id: "paytm", displayName: "Paytm", aliases: ["paytm"], categories: ["utilities", "shopping", "travel", "wallet", "other"], channels: ["app", "online"] }),
  merchant({ id: "tata-neu", displayName: "Tata Neu", aliases: ["tata neu", "tata new"], categories: ["shopping", "grocery", "travel", "utilities"], channels: ["app"] }),
  merchant({ id: "hdfc-smartbuy", displayName: "HDFC SmartBuy", aliases: ["smartbuy", "hdfc smartbuy", "smart buy"], categories: ["shopping", "travel"], channels: ["app", "online"] }),
  merchant({ id: "indianoil", displayName: "IndianOil", aliases: ["indianoil", "indian oil", "iocl"], categories: ["fuel"], channels: ["offline", "upi"] }),
  merchant({ id: "hpcl", displayName: "HPCL", aliases: ["hpcl", "hindustan petroleum"], categories: ["fuel"], channels: ["offline", "upi"] }),
  merchant({ id: "bpcl", displayName: "BPCL", aliases: ["bpcl", "bharat petroleum"], categories: ["fuel"], channels: ["offline", "upi"] }),
  merchant({ id: "apollo-pharmacy", displayName: "Apollo Pharmacy", aliases: ["apollo", "apollo pharmacy", "apollo 24 7", "apollo247"], categories: ["other"], channels: ["offline", "app", "online", "upi"] }),
  merchant({ id: "cult-fit", displayName: "Cult.fit", aliases: ["cult fit", "cultfit", "curefit"], categories: ["other"], channels: ["app", "online"] }),
  merchant({ id: "tanishq", displayName: "Tanishq", aliases: ["tanishq"], categories: ["shopping"], channels: ["offline", "online", "app", "upi"] }),
  merchant({ id: "apple-store", displayName: "Apple Store", aliases: ["apple store", "apple india"], categories: ["shopping"], channels: ["offline", "online", "app", "upi"] }),
];
