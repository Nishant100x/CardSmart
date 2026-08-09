-- CardSmart card catalogue seed v1
-- Generated from the approved V10.6 expanded production source.
-- Safe to re-run: identities are updated; existing version 1 rows are preserved.
-- Does not modify public.cards, profiles, or interactions.

begin;

create temporary table _cardsmart_catalog_seed (
  payload jsonb not null
) on commit drop;

insert into _cardsmart_catalog_seed(payload)
values ($cardsmart_seed$
[
  {
    "id": "hdfc-swiggy",
    "bank": "HDFC Bank",
    "name": "Swiggy",
    "network": "Mastercard",
    "colors": [
      "#ff641e",
      "#cf341e"
    ],
    "accent": "#ffd6c2",
    "bestFor": [
      "Food delivery",
      "Dining"
    ],
    "baseRate": 1,
    "rates": {
      "dining": 5,
      "online": 1,
      "grocery": 5
    },
    "merchantRates": {
      "swiggy": 10
    },
    "cap": "₹1,500 cashback / month on Swiggy",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "10% on eligible Swiggy App spends, subject to a ₹1,500 billing-cycle cap.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "Cashback",
      "exclusions": [
        "fuel",
        "rent",
        "wallet",
        "government"
      ],
      "merchantRules": [
        {
          "matches": [
            "swiggy"
          ],
          "rate": 10,
          "channels": [
            "online",
            "app"
          ],
          "capAmount": 1500,
          "label": "10% eligible Swiggy App cashback"
        },
        {
          "matches": [
            "*"
          ],
          "rate": 5,
          "channels": [
            "online",
            "app"
          ],
          "categories": [
            "shopping"
          ],
          "capAmount": 1500,
          "label": "5% eligible online-category cashback"
        }
      ],
      "categoryRates": {
        "dining": 1,
        "grocery": 1,
        "travel": 1,
        "shopping": 1,
        "utilities": 1,
        "education": 1,
        "insurance": 1,
        "other": 1
      },
      "assumptions": [
        "Non-Swiggy 5% eligibility depends on the merchant category code; unrecognised online spends use the 1% base rate."
      ]
    },
    "discovery": {
      "annualFee": 500,
      "minMonthlyIncome": 25000,
      "goals": [
        "Simple cashback",
        "Low fees"
      ]
    }
  },
  {
    "id": "sbi-cashback",
    "bank": "SBI Card",
    "name": "Cashback",
    "network": "VISA",
    "colors": [
      "#202b69",
      "#10183d"
    ],
    "accent": "#c8d1ff",
    "bestFor": [
      "Online shopping",
      "Everyday"
    ],
    "baseRate": 1,
    "rates": {
      "online": 5,
      "dining": 5,
      "travel": 5,
      "grocery": 5
    },
    "cap": "₹2,000 online + ₹2,000 offline cashback / statement cycle",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "From 1 Apr 2026: 5% eligible online and 1% eligible offline spends; ₹4,000 aggregate cycle cap.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "Cashback",
      "exclusions": [
        "utilities",
        "insurance",
        "fuel",
        "rent",
        "wallet",
        "education",
        "government"
      ],
      "channelRates": {
        "online": 5,
        "app": 5,
        "offline": 1,
        "upi": 1
      },
      "defaultCapAmount": 2000,
      "assumptions": [
        "The applicable online/offline sub-cap is reduced by the cap usage entered for this card.",
        "Jewellery, railways, tolls and digital gaming are also excluded; enter the category explicitly when relevant."
      ]
    },
    "discovery": {
      "annualFee": 999,
      "minMonthlyIncome": 30000,
      "goals": [
        "Simple cashback",
        "Low fees"
      ]
    }
  },
  {
    "id": "axis-atlas",
    "bank": "Axis Bank",
    "name": "Atlas",
    "network": "VISA",
    "colors": [
      "#132b2b",
      "#071718"
    ],
    "accent": "#a9ffc8",
    "bestFor": [
      "Flights",
      "Hotels"
    ],
    "baseRate": 2,
    "rates": {
      "travel": 5,
      "dining": 2,
      "online": 2
    },
    "cap": "Milestone-based EDGE Miles",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5 EDGE Miles/₹100 on eligible travel and 2/₹100 on other eligible spends; value assumes ₹1 per EDGE Mile.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "EDGE Miles value",
      "categoryRates": {
        "travel": 5
      },
      "assumptions": [
        "Uses ₹1 as the comparison value of one EDGE Mile.",
        "Travel acceleration is limited to eligible airlines, hotels and Travel EDGE; exact MCC recognition can vary."
      ]
    },
    "discovery": {
      "annualFee": 5000,
      "minMonthlyIncome": 100000,
      "goals": [
        "Travel rewards",
        "Premium benefits"
      ]
    }
  },
  {
    "id": "hdfc-millennia",
    "bank": "HDFC Bank",
    "name": "Millennia",
    "network": "VISA",
    "colors": [
      "#584b82",
      "#25203d"
    ],
    "accent": "#e3dcff",
    "bestFor": [
      "Partner brands",
      "Online"
    ],
    "baseRate": 1,
    "rates": {
      "online": 5,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "merchantRates": {
      "swiggy": 5,
      "amazon": 5,
      "flipkart": 5
    },
    "cap": "₹1,000 cashback / month on 5% spends",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5% on ten eligible partner merchants, capped at ₹1,000 per calendar month; 1% base cashback has a separate ₹1,000 cap.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "CashPoints value",
      "exclusions": [
        "fuel",
        "rent",
        "wallet",
        "government"
      ],
      "merchantRules": [
        {
          "matches": [
            "amazon",
            "bookmyshow",
            "cult.fit",
            "flipkart",
            "myntra",
            "sony liv",
            "swiggy",
            "tata cliq",
            "uber",
            "zomato"
          ],
          "rate": 5,
          "capAmount": 1000,
          "label": "5% Millennia partner cashback"
        }
      ],
      "defaultCapAmount": 1000,
      "assumptions": [
        "Partner cashback depends on the issuer recognising the merchant ID.",
        "EMI transactions do not earn cashback."
      ]
    },
    "discovery": {
      "annualFee": 1000,
      "minMonthlyIncome": 35000,
      "goals": [
        "Simple cashback",
        "Low fees"
      ]
    }
  },
  {
    "id": "amazon-icici",
    "bank": "ICICI Bank",
    "name": "Amazon Pay",
    "network": "VISA",
    "colors": [
      "#202226",
      "#050607"
    ],
    "accent": "#ffcd72",
    "bestFor": [
      "Amazon",
      "Bills"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "merchantRates": {
      "amazon": 5
    },
    "cap": "No published cashback cap",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5% on Amazon.in assumes Prime membership; non-Prime earns 3%. Other eligible payments earn 1%.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "Amazon Pay balance",
      "merchantRules": [
        {
          "matches": [
            "amazon"
          ],
          "rate": 5,
          "channels": [
            "online",
            "app"
          ],
          "categories": [
            "shopping",
            "travel"
          ],
          "label": "Amazon Prime purchase reward"
        }
      ],
      "assumptions": [
        "Amazon rate assumes an active Prime membership; choose another card if the user is non-Prime and the 3% rate changes the result.",
        "Amazon Pay partner merchants may earn 2% when paid through Amazon Pay."
      ]
    },
    "discovery": {
      "annualFee": 0,
      "minMonthlyIncome": 30000,
      "goals": [
        "Simple cashback",
        "Low fees"
      ]
    }
  },
  {
    "id": "hsbc-liveplus",
    "bank": "HSBC",
    "name": "Live+",
    "network": "VISA",
    "colors": [
      "#aa1428",
      "#5f0815"
    ],
    "accent": "#ffd0d6",
    "bestFor": [
      "Dining",
      "Groceries"
    ],
    "baseRate": 1.5,
    "rates": {
      "dining": 10,
      "grocery": 10,
      "online": 1.5
    },
    "cap": "₹1,000 accelerated cashback / month",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "10% on eligible dining, food delivery and grocery spends, capped at ₹1,000 monthly; most other eligible spends earn 1.5%.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "Cashback",
      "exclusions": [
        "utilities"
      ],
      "merchantRules": [
        {
          "matches": [
            "*"
          ],
          "rate": 10,
          "categories": [
            "dining",
            "grocery"
          ],
          "capAmount": 1000,
          "label": "10% dining / food delivery / grocery cashback"
        }
      ],
      "assumptions": [
        "The ₹1,000 cap is shared across dining, food delivery and groceries."
      ]
    },
    "discovery": {
      "annualFee": 999,
      "minMonthlyIncome": 50000,
      "goals": [
        "Simple cashback"
      ]
    }
  },
  {
    "id": "hdfc-infinia",
    "bank": "HDFC Bank",
    "name": "Infinia Metal",
    "network": "VISA",
    "colors": [
      "#3b4148",
      "#101316"
    ],
    "accent": "#e6edf1",
    "bestFor": [
      "Travel",
      "Premium spends"
    ],
    "baseRate": 3.3,
    "rates": {
      "travel": 3.3,
      "online": 3.3,
      "dining": 3.3,
      "grocery": 3.3
    },
    "cap": "Base rewards plus channel-specific SmartBuy limits",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5 Reward Points per ₹150 eligible retail spend. Value shown assumes ₹1 per point through eligible travel redemption.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "Reward Point value",
      "assumptions": [
        "Uses ₹1 per Reward Point; statement credit or other redemptions can be worth less.",
        "SmartBuy acceleration is not applied unless a specific verified booking route is modelled."
      ]
    },
    "discovery": {
      "annualFee": 12500,
      "minMonthlyIncome": 300000,
      "goals": [
        "Travel rewards",
        "Premium benefits"
      ]
    }
  },
  {
    "id": "axis-ace",
    "bank": "Axis Bank",
    "name": "ACE",
    "network": "VISA",
    "colors": [
      "#7e183d",
      "#351020"
    ],
    "accent": "#ffd1e1",
    "bestFor": [
      "Utility bills",
      "Everyday"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "grocery": 1.5
    },
    "merchantRates": {
      "utilities": 5
    },
    "cap": "₹500 accelerated cashback / month",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5% on eligible utilities via Google Pay, 4% on Swiggy/Zomato/Ola, and 1.5% on other eligible spends.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "Cashback",
      "exclusions": [
        "fuel",
        "rent",
        "wallet",
        "education",
        "insurance",
        "government"
      ],
      "merchantRules": [
        {
          "matches": [
            "gpay",
            "google pay"
          ],
          "rate": 5,
          "channels": [
            "app"
          ],
          "categories": [
            "utilities"
          ],
          "capAmount": 500,
          "label": "5% Google Pay utility cashback"
        },
        {
          "matches": [
            "swiggy",
            "zomato",
            "ola"
          ],
          "rate": 4,
          "channels": [
            "online",
            "app"
          ],
          "capAmount": 500,
          "label": "4% partner cashback"
        }
      ],
      "assumptions": [
        "The ₹500 cap is shared across the 5% and 4% cashback buckets.",
        "Utilities paid outside Google Pay earn no cashback."
      ]
    },
    "discovery": {
      "annualFee": 499,
      "minMonthlyIncome": 40000,
      "goals": [
        "Simple cashback",
        "Low fees"
      ]
    }
  },
  {
    "id": "amex-mrcc",
    "bank": "American Express",
    "name": "Membership Rewards",
    "network": "AMEX",
    "colors": [
      "#2a7fa2",
      "#143d53"
    ],
    "accent": "#c9f2ff",
    "bestFor": [
      "Milestones",
      "Rewards"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Monthly transaction milestones",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Base estimate assumes 1 MR point per ₹50 and ₹0.50 per point. Monthly milestone bonuses are shown as upside, not guaranteed value.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "Membership Rewards value",
      "exclusions": [
        "fuel",
        "insurance",
        "utilities"
      ],
      "assumptions": [
        "Uses ₹0.50 per Membership Rewards point.",
        "The 1,000-point bonus for four ₹1,500+ transactions is not included because monthly qualifying transaction count is not tracked."
      ]
    },
    "discovery": null
  },
  {
    "id": "hdfc-regalia-gold",
    "bank": "HDFC Bank",
    "name": "Regalia Gold",
    "network": "VISA",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Travel",
      "Lounge"
    ],
    "baseRate": 1.3,
    "rates": {
      "online": 1.3,
      "dining": 1.3,
      "travel": 2.6,
      "grocery": 1.3
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": {
      "annualFee": 2500,
      "minMonthlyIncome": 100000,
      "goals": [
        "Travel rewards",
        "Premium benefits"
      ]
    }
  },
  {
    "id": "hdfc-dcb-metal",
    "bank": "HDFC Bank",
    "name": "Diners Club Black Metal",
    "network": "Diners Club",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Travel",
      "Premium rewards"
    ],
    "baseRate": 3.3,
    "rates": {
      "online": 3.3,
      "dining": 3.3,
      "travel": 5,
      "grocery": 3.3
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": {
      "annualFee": 10000,
      "minMonthlyIncome": 250000,
      "goals": [
        "Travel rewards",
        "Premium benefits"
      ]
    }
  },
  {
    "id": "hdfc-tata-neu-infinity",
    "bank": "HDFC Bank",
    "name": "Tata Neu Infinity",
    "network": "RuPay",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Tata brands",
      "UPI"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "travel": 1.5,
      "grocery": 1.5
    },
    "merchantRates": {
      "tata": 5
    },
    "cap": "500 NeuCoins / month on eligible UPI payments",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "5% NeuCoins on eligible Tata brands; up to 1.5% on eligible UPI via Tata Neu UPI ID.",
    "rewardModel": {
      "confidence": "verified",
      "reviewedOn": "August 2026",
      "rewardLabel": "NeuCoins value",
      "exclusions": [
        "fuel",
        "wallet",
        "rent",
        "government"
      ],
      "merchantRules": [
        {
          "matches": [
            "tata neu upi"
          ],
          "rate": 1.5,
          "channels": [
            "upi"
          ],
          "capAmount": 500,
          "label": "Tata Neu UPI reward"
        },
        {
          "matches": [
            "tata"
          ],
          "rate": 5,
          "channels": [
            "online",
            "app"
          ],
          "label": "Eligible Tata brand reward"
        },
        {
          "matches": [
            "*"
          ],
          "rate": 0.5,
          "channels": [
            "upi"
          ],
          "capAmount": 500,
          "label": "Eligible RuPay UPI base reward"
        }
      ],
      "assumptions": [
        "The extra 1% on UPI requires a Tata Neu UPI ID; other eligible UPI earns 0.5% from the card."
      ]
    },
    "discovery": null
  },
  {
    "id": "hdfc-tata-neu-plus",
    "bank": "HDFC Bank",
    "name": "Tata Neu Plus",
    "network": "RuPay",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Tata brands",
      "UPI"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "merchantRates": {
      "tata": 2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hdfc-marriott-bonvoy",
    "bank": "HDFC Bank",
    "name": "Marriott Bonvoy",
    "network": "Mastercard",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Marriott",
      "Hotels"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "travel": 3,
      "grocery": 1.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hdfc-indianoil",
    "bank": "HDFC Bank",
    "name": "IndianOil",
    "network": "RuPay",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Fuel",
      "Groceries"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hdfc-freedom",
    "bank": "HDFC Bank",
    "name": "Freedom",
    "network": "VISA",
    "colors": [
      "#314b7e",
      "#101a32"
    ],
    "accent": "#eef3ff",
    "bestFor": [
      "Everyday",
      "Entry level"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-simplyclick",
    "bank": "SBI Card",
    "name": "SimplyCLICK",
    "network": "VISA",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Online shopping",
      "Partner brands"
    ],
    "baseRate": 0.25,
    "rates": {
      "online": 1.25,
      "dining": 0.25,
      "travel": 0.25,
      "grocery": 0.25
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-simplysave",
    "bank": "SBI Card",
    "name": "SimplySAVE",
    "network": "RuPay",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Dining",
      "Groceries"
    ],
    "baseRate": 0.25,
    "rates": {
      "online": 0.25,
      "dining": 2.5,
      "travel": 0.25,
      "grocery": 2.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-prime",
    "bank": "SBI Card",
    "name": "PRIME",
    "network": "VISA",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Lifestyle",
      "Milestones"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 2.5,
      "travel": 0.5,
      "grocery": 2.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-elite",
    "bank": "SBI Card",
    "name": "ELITE",
    "network": "VISA",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Lifestyle",
      "Movies"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 1.25,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-bpcl-octane",
    "bank": "SBI Card",
    "name": "BPCL Octane",
    "network": "RuPay",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "BPCL fuel",
      "Dining"
    ],
    "baseRate": 0.25,
    "rates": {
      "online": 0.25,
      "dining": 0.25,
      "travel": 0.25,
      "grocery": 0.25
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-bpcl",
    "bank": "SBI Card",
    "name": "BPCL",
    "network": "RuPay",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "BPCL fuel",
      "Everyday"
    ],
    "baseRate": 0.25,
    "rates": {
      "online": 0.25,
      "dining": 0.25,
      "travel": 0.25,
      "grocery": 0.25
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-irctc-premier",
    "bank": "SBI Card",
    "name": "IRCTC Premier",
    "network": "RuPay",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Rail travel",
      "IRCTC"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 1.5,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sbi-miles",
    "bank": "SBI Card",
    "name": "MILES",
    "network": "VISA",
    "colors": [
      "#245aa4",
      "#132853"
    ],
    "accent": "#e5efff",
    "bestFor": [
      "Flights",
      "Travel rewards"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 1,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-magnus",
    "bank": "Axis Bank",
    "name": "Magnus",
    "network": "VISA",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Premium travel",
      "Milestones"
    ],
    "baseRate": 1.2,
    "rates": {
      "online": 1.2,
      "dining": 1.2,
      "travel": 2.4,
      "grocery": 1.2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-burgundy-private",
    "bank": "Axis Bank",
    "name": "Burgundy Private",
    "network": "VISA",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Premium rewards",
      "Travel"
    ],
    "baseRate": 2,
    "rates": {
      "online": 2,
      "dining": 2,
      "travel": 4,
      "grocery": 2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-airtel",
    "bank": "Axis Bank",
    "name": "Airtel",
    "network": "Mastercard",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Airtel bills",
      "Utilities"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "merchantRates": {
      "airtel": 25
    },
    "cap": "Accelerated cashback cap depends on base cashback earned",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "25% Airtel and 10% utility cashback requires Airtel Thanks App; current caps are linked to 1% base cashback earned in the cycle.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "Cashback",
      "merchantRules": [
        {
          "matches": [
            "airtel"
          ],
          "rate": 25,
          "channels": [
            "app"
          ],
          "label": "25% Airtel Thanks App cashback"
        },
        {
          "matches": [
            "electricity",
            "gas bill",
            "utility"
          ],
          "rate": 10,
          "channels": [
            "app"
          ],
          "categories": [
            "utilities"
          ],
          "label": "10% Airtel Thanks utility cashback"
        }
      ],
      "assumptions": [
        "The dynamic cap cannot be calculated without the statement cycle's eligible 1% base cashback, so the displayed value is pre-cap."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-flipkart",
    "bank": "Axis Bank",
    "name": "Flipkart",
    "network": "VISA",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Flipkart",
      "Online shopping"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "merchantRates": {
      "flipkart": 5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-neo",
    "bank": "Axis Bank",
    "name": "Neo",
    "network": "RuPay",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Partner offers",
      "Dining"
    ],
    "baseRate": 0.2,
    "rates": {
      "online": 0.2,
      "dining": 0.2,
      "travel": 0.2,
      "grocery": 0.2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-my-zone",
    "bank": "Axis Bank",
    "name": "My Zone",
    "network": "RuPay",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Movies",
      "Food delivery"
    ],
    "baseRate": 0.2,
    "rates": {
      "online": 0.2,
      "dining": 0.2,
      "travel": 0.2,
      "grocery": 0.2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-indianoil",
    "bank": "Axis Bank",
    "name": "IndianOil",
    "network": "RuPay",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "IndianOil fuel",
      "UPI"
    ],
    "baseRate": 0.2,
    "rates": {
      "online": 0.2,
      "dining": 0.2,
      "travel": 0.2,
      "grocery": 0.2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-select",
    "bank": "Axis Bank",
    "name": "SELECT",
    "network": "VISA",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Lifestyle",
      "Lounge"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "axis-rewards",
    "bank": "Axis Bank",
    "name": "Rewards",
    "network": "RuPay",
    "colors": [
      "#8e204d",
      "#3a1024"
    ],
    "accent": "#ffe1ec",
    "bestFor": [
      "Department stores",
      "Everyday"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-emeralde-private-metal",
    "bank": "ICICI Bank",
    "name": "Emeralde Private Metal",
    "network": "Mastercard",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Premium travel",
      "Luxury"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "travel": 3,
      "grocery": 1.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-sapphiro",
    "bank": "ICICI Bank",
    "name": "Sapphiro",
    "network": "Mastercard",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Lounge",
      "Movies"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-rubyx",
    "bank": "ICICI Bank",
    "name": "Rubyx",
    "network": "Mastercard",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Lifestyle",
      "Travel"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-coral",
    "bank": "ICICI Bank",
    "name": "Coral",
    "network": "RuPay",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Everyday",
      "Movies"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-platinum-chip",
    "bank": "ICICI Bank",
    "name": "Platinum Chip",
    "network": "VISA",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Everyday",
      "Entry level"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-makemytrip-signature",
    "bank": "ICICI Bank",
    "name": "MakeMyTrip Signature",
    "network": "VISA",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "Flights",
      "Hotels"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 2,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "icici-hpcl-super-saver",
    "bank": "ICICI Bank",
    "name": "HPCL Super Saver",
    "network": "RuPay",
    "colors": [
      "#b54d25",
      "#4c1c12"
    ],
    "accent": "#ffe8d8",
    "bestFor": [
      "HPCL fuel",
      "Utilities"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-millennia",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST Millennia",
    "network": "RuPay",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Everyday",
      "UPI"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-classic",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST Classic",
    "network": "RuPay",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Everyday",
      "Rail lounge"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-select",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST Select",
    "network": "VISA",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Travel",
      "Low forex"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 1,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-wealth",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST Wealth",
    "network": "VISA",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Travel",
      "Lounge"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 1.5,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-wow",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST WOW!",
    "network": "VISA",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Zero forex",
      "FD-backed"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-first-power-plus",
    "bank": "IDFC FIRST Bank",
    "name": "FIRST Power+",
    "network": "RuPay",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "HPCL fuel",
      "UPI"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-mayura",
    "bank": "IDFC FIRST Bank",
    "name": "Mayura",
    "network": "VISA",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Travel",
      "Premium rewards"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 2,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "idfc-ashva",
    "bank": "IDFC FIRST Bank",
    "name": "Ashva",
    "network": "VISA",
    "colors": [
      "#7b1d3b",
      "#32101d"
    ],
    "accent": "#ffe0ea",
    "bestFor": [
      "Travel",
      "Lifestyle"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 1.5,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hsbc-travelone",
    "bank": "HSBC",
    "name": "TravelOne",
    "network": "Mastercard",
    "colors": [
      "#b4142c",
      "#4e0711"
    ],
    "accent": "#ffe0e5",
    "bestFor": [
      "Flights",
      "Miles transfer"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 2,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hsbc-premier",
    "bank": "HSBC",
    "name": "Premier",
    "network": "Mastercard",
    "colors": [
      "#b4142c",
      "#4e0711"
    ],
    "accent": "#ffe0e5",
    "bestFor": [
      "Premium travel",
      "Miles transfer"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "travel": 2,
      "grocery": 1.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "hsbc-visa-platinum",
    "bank": "HSBC",
    "name": "Visa Platinum",
    "network": "VISA",
    "colors": [
      "#b4142c",
      "#4e0711"
    ],
    "accent": "#ffe0e5",
    "bestFor": [
      "Everyday",
      "Lifetime free"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "amex-platinum-travel",
    "bank": "American Express",
    "name": "Platinum Travel",
    "network": "AMEX",
    "colors": [
      "#27799b",
      "#12394e"
    ],
    "accent": "#d9f5ff",
    "bestFor": [
      "Milestones",
      "Travel"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Annual spend milestones are not included in one-payment estimates",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Base estimate assumes 1 MR point per ₹50 and ₹0.50 per point; milestone value needs annual spend tracking.",
    "rewardModel": {
      "confidence": "reviewed",
      "reviewedOn": "August 2026",
      "rewardLabel": "Membership Rewards value",
      "exclusions": [
        "fuel",
        "insurance",
        "utilities"
      ],
      "assumptions": [
        "Uses ₹0.50 per Membership Rewards point.",
        "Annual milestone bonuses are not added to a single-payment result."
      ]
    },
    "discovery": null
  },
  {
    "id": "amex-smartearn",
    "bank": "American Express",
    "name": "SmartEarn",
    "network": "AMEX",
    "colors": [
      "#27799b",
      "#12394e"
    ],
    "accent": "#d9f5ff",
    "bestFor": [
      "Partner brands",
      "Online"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 2.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "amex-platinum-reserve",
    "bank": "American Express",
    "name": "Platinum Reserve",
    "network": "AMEX",
    "colors": [
      "#27799b",
      "#12394e"
    ],
    "accent": "#d9f5ff",
    "bestFor": [
      "Lifestyle",
      "Lounge"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "amex-platinum",
    "bank": "American Express",
    "name": "Platinum Card",
    "network": "AMEX",
    "colors": [
      "#27799b",
      "#12394e"
    ],
    "accent": "#d9f5ff",
    "bestFor": [
      "Luxury travel",
      "Concierge"
    ],
    "baseRate": 1.5,
    "rates": {
      "online": 1.5,
      "dining": 1.5,
      "travel": 3,
      "grocery": 1.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "indusind-eazydiner",
    "bank": "IndusInd Bank",
    "name": "EazyDiner",
    "network": "VISA",
    "colors": [
      "#5d326d",
      "#26122f"
    ],
    "accent": "#f2dcff",
    "bestFor": [
      "Dining",
      "Restaurant discounts"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 4,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "indusind-eazydiner-platinum",
    "bank": "IndusInd Bank",
    "name": "EazyDiner Platinum",
    "network": "RuPay",
    "colors": [
      "#5d326d",
      "#26122f"
    ],
    "accent": "#f2dcff",
    "bestFor": [
      "Dining",
      "UPI"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 2,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "indusind-tiger",
    "bank": "IndusInd Bank",
    "name": "Tiger",
    "network": "VISA",
    "colors": [
      "#5d326d",
      "#26122f"
    ],
    "accent": "#f2dcff",
    "bestFor": [
      "Travel",
      "Lifestyle"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1.5,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "indusind-legend",
    "bank": "IndusInd Bank",
    "name": "Legend",
    "network": "VISA",
    "colors": [
      "#5d326d",
      "#26122f"
    ],
    "accent": "#f2dcff",
    "bestFor": [
      "Weekend spends",
      "Lifestyle"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 0.75,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "indusind-pioneer-legacy",
    "bank": "IndusInd Bank",
    "name": "Pioneer Legacy",
    "network": "VISA",
    "colors": [
      "#5d326d",
      "#26122f"
    ],
    "accent": "#f2dcff",
    "bestFor": [
      "Premium banking",
      "Lifestyle"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 0.75,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "au-ixigo",
    "bank": "AU Small Finance Bank",
    "name": "ixigo",
    "network": "VISA",
    "colors": [
      "#ec7a22",
      "#71320b"
    ],
    "accent": "#fff0d9",
    "bestFor": [
      "Travel",
      "Zero forex"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 2,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "au-lit",
    "bank": "AU Small Finance Bank",
    "name": "LIT",
    "network": "VISA",
    "colors": [
      "#ec7a22",
      "#71320b"
    ],
    "accent": "#fff0d9",
    "bestFor": [
      "Custom rewards",
      "Online"
    ],
    "baseRate": 1,
    "rates": {
      "online": 2,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "au-zenith-plus",
    "bank": "AU Small Finance Bank",
    "name": "Zenith+",
    "network": "Mastercard",
    "colors": [
      "#ec7a22",
      "#71320b"
    ],
    "accent": "#fff0d9",
    "bestFor": [
      "Premium travel",
      "Lounge"
    ],
    "baseRate": 1.25,
    "rates": {
      "online": 1.25,
      "dining": 1.25,
      "travel": 2,
      "grocery": 1.25
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "au-vetta",
    "bank": "AU Small Finance Bank",
    "name": "Vetta",
    "network": "VISA",
    "colors": [
      "#ec7a22",
      "#71320b"
    ],
    "accent": "#fff0d9",
    "bestFor": [
      "Lifestyle",
      "Lounge"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 0.75,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "au-altura-plus",
    "bank": "AU Small Finance Bank",
    "name": "Altura+",
    "network": "RuPay",
    "colors": [
      "#ec7a22",
      "#71320b"
    ],
    "accent": "#fff0d9",
    "bestFor": [
      "Everyday",
      "UPI"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "kotak-zen",
    "bank": "Kotak Mahindra Bank",
    "name": "Zen",
    "network": "VISA",
    "colors": [
      "#d42434",
      "#5f0b13"
    ],
    "accent": "#ffe1e4",
    "bestFor": [
      "Shopping",
      "Lifestyle"
    ],
    "baseRate": 1,
    "rates": {
      "online": 2,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "kotak-league-platinum",
    "bank": "Kotak Mahindra Bank",
    "name": "League Platinum",
    "network": "RuPay",
    "colors": [
      "#d42434",
      "#5f0b13"
    ],
    "accent": "#ffe1e4",
    "bestFor": [
      "Milestones",
      "Everyday"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "kotak-indianoil",
    "bank": "Kotak Mahindra Bank",
    "name": "IndianOil",
    "network": "RuPay",
    "colors": [
      "#d42434",
      "#5f0b13"
    ],
    "accent": "#ffe1e4",
    "bestFor": [
      "IndianOil fuel",
      "Dining"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 2,
      "travel": 0.5,
      "grocery": 2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "kotak-pvr-inox",
    "bank": "Kotak Mahindra Bank",
    "name": "PVR INOX",
    "network": "VISA",
    "colors": [
      "#d42434",
      "#5f0b13"
    ],
    "accent": "#ffe1e4",
    "bestFor": [
      "Movies",
      "Entertainment"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "kotak-myntra",
    "bank": "Kotak Mahindra Bank",
    "name": "Myntra",
    "network": "Mastercard",
    "colors": [
      "#d42434",
      "#5f0b13"
    ],
    "accent": "#ffe1e4",
    "bestFor": [
      "Myntra",
      "Fashion"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "merchantRates": {
      "myntra": 5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sc-smart",
    "bank": "Standard Chartered",
    "name": "Smart",
    "network": "VISA",
    "colors": [
      "#1b7568",
      "#0a3430"
    ],
    "accent": "#d9fff7",
    "bestFor": [
      "Online cashback",
      "Everyday"
    ],
    "baseRate": 1,
    "rates": {
      "online": 2,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sc-ultimate",
    "bank": "Standard Chartered",
    "name": "Ultimate",
    "network": "VISA",
    "colors": [
      "#1b7568",
      "#0a3430"
    ],
    "accent": "#d9fff7",
    "bestFor": [
      "Premium rewards",
      "Lounge"
    ],
    "baseRate": 3.3,
    "rates": {
      "online": 3.3,
      "dining": 3.3,
      "travel": 3.3,
      "grocery": 3.3
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sc-rewards",
    "bank": "Standard Chartered",
    "name": "Rewards",
    "network": "VISA",
    "colors": [
      "#1b7568",
      "#0a3430"
    ],
    "accent": "#d9fff7",
    "bestFor": [
      "Milestones",
      "Lounge"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sc-platinum-rewards",
    "bank": "Standard Chartered",
    "name": "Platinum Rewards",
    "network": "VISA",
    "colors": [
      "#1b7568",
      "#0a3430"
    ],
    "accent": "#d9fff7",
    "bestFor": [
      "Dining",
      "Fuel"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 2.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "sc-easemytrip",
    "bank": "Standard Chartered",
    "name": "EaseMyTrip",
    "network": "VISA",
    "colors": [
      "#1b7568",
      "#0a3430"
    ],
    "accent": "#d9fff7",
    "bestFor": [
      "Travel bookings",
      "Hotels"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 2,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "rbl-shoprite",
    "bank": "RBL Bank",
    "name": "ShopRite",
    "network": "Mastercard",
    "colors": [
      "#33457d",
      "#131d3e"
    ],
    "accent": "#e2e8ff",
    "bestFor": [
      "Groceries",
      "Movies"
    ],
    "baseRate": 0.25,
    "rates": {
      "online": 0.25,
      "dining": 0.25,
      "travel": 0.25,
      "grocery": 5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "rbl-world-safari",
    "bank": "RBL Bank",
    "name": "World Safari",
    "network": "Mastercard",
    "colors": [
      "#33457d",
      "#131d3e"
    ],
    "accent": "#e2e8ff",
    "bestFor": [
      "Zero forex",
      "Travel"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 1,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "rbl-play",
    "bank": "RBL Bank",
    "name": "Play",
    "network": "Mastercard",
    "colors": [
      "#33457d",
      "#131d3e"
    ],
    "accent": "#e2e8ff",
    "bestFor": [
      "Movies",
      "Entertainment"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "rbl-salaryse-up",
    "bank": "RBL Bank",
    "name": "SalarySe UP",
    "network": "RuPay",
    "colors": [
      "#33457d",
      "#131d3e"
    ],
    "accent": "#e2e8ff",
    "bestFor": [
      "UPI",
      "Everyday rewards"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "rbl-indianoil-xtra",
    "bank": "RBL Bank",
    "name": "IndianOil XTRA",
    "network": "RuPay",
    "colors": [
      "#33457d",
      "#131d3e"
    ],
    "accent": "#e2e8ff",
    "bestFor": [
      "IndianOil fuel",
      "UPI"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "yes-marquee",
    "bank": "YES BANK",
    "name": "MARQUÉE",
    "network": "Mastercard",
    "colors": [
      "#1657a7",
      "#0b2b5c"
    ],
    "accent": "#e0edff",
    "bestFor": [
      "Premium rewards",
      "Low forex"
    ],
    "baseRate": 2,
    "rates": {
      "online": 3,
      "dining": 2,
      "travel": 3,
      "grocery": 2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "yes-reserv",
    "bank": "YES BANK",
    "name": "RESERV",
    "network": "Mastercard",
    "colors": [
      "#1657a7",
      "#0b2b5c"
    ],
    "accent": "#e0edff",
    "bestFor": [
      "Travel",
      "Lifestyle"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 2,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "yes-byoc",
    "bank": "YES BANK",
    "name": "BYOC",
    "network": "RuPay",
    "colors": [
      "#1657a7",
      "#0b2b5c"
    ],
    "accent": "#e0edff",
    "bestFor": [
      "Custom benefits",
      "UPI"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "yes-klick",
    "bank": "YES BANK",
    "name": "Klick",
    "network": "RuPay",
    "colors": [
      "#1657a7",
      "#0b2b5c"
    ],
    "accent": "#e0edff",
    "bestFor": [
      "UPI cashback",
      "Everyday"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 1,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "yes-elite-plus",
    "bank": "YES BANK",
    "name": "Elite+",
    "network": "VISA",
    "colors": [
      "#1657a7",
      "#0b2b5c"
    ],
    "accent": "#e0edff",
    "bestFor": [
      "Lifestyle",
      "Lounge"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 0.75,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-eterna",
    "bank": "BOBCARD",
    "name": "ETERNA",
    "network": "Mastercard",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "Travel",
      "Dining"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 3.75,
      "dining": 3.75,
      "travel": 3.75,
      "grocery": 0.75
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-premier",
    "bank": "BOBCARD",
    "name": "PREMIER",
    "network": "RuPay",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "Travel",
      "Dining"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 2,
      "travel": 2,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-select",
    "bank": "BOBCARD",
    "name": "SELECT",
    "network": "RuPay",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "Everyday",
      "UPI"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-easy",
    "bank": "BOBCARD",
    "name": "Easy",
    "network": "RuPay",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "Groceries",
      "Everyday"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-snapdeal",
    "bank": "BOBCARD",
    "name": "Snapdeal",
    "network": "RuPay",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "Snapdeal",
      "Online shopping"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 0.4
    },
    "merchantRates": {
      "snapdeal": 2.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "bobcard-hpcl-energie",
    "bank": "BOBCARD",
    "name": "HPCL ENERGIE",
    "network": "RuPay",
    "colors": [
      "#d36a22",
      "#61280c"
    ],
    "accent": "#ffead9",
    "bestFor": [
      "HPCL fuel",
      "UPI"
    ],
    "baseRate": 0.4,
    "rates": {
      "online": 0.4,
      "dining": 0.4,
      "travel": 0.4,
      "grocery": 0.4
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "federal-celesta",
    "bank": "Federal Bank",
    "name": "Celesta",
    "network": "VISA",
    "colors": [
      "#255ca8",
      "#102b55"
    ],
    "accent": "#e1edff",
    "bestFor": [
      "Travel",
      "Premium lifestyle"
    ],
    "baseRate": 1,
    "rates": {
      "online": 1,
      "dining": 1,
      "travel": 2,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "federal-imperio",
    "bank": "Federal Bank",
    "name": "Imperio",
    "network": "VISA",
    "colors": [
      "#255ca8",
      "#102b55"
    ],
    "accent": "#e1edff",
    "bestFor": [
      "Healthcare",
      "Family spends"
    ],
    "baseRate": 0.75,
    "rates": {
      "online": 0.75,
      "dining": 0.75,
      "travel": 0.75,
      "grocery": 1
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "federal-signet",
    "bank": "Federal Bank",
    "name": "Signet",
    "network": "RuPay",
    "colors": [
      "#255ca8",
      "#102b55"
    ],
    "accent": "#e1edff",
    "bestFor": [
      "Shopping",
      "Entertainment"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 1,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "federal-wave",
    "bank": "Federal Bank",
    "name": "Wave",
    "network": "RuPay",
    "colors": [
      "#255ca8",
      "#102b55"
    ],
    "accent": "#e1edff",
    "bestFor": [
      "UPI",
      "Everyday"
    ],
    "baseRate": 0.5,
    "rates": {
      "online": 0.5,
      "dining": 0.5,
      "travel": 0.5,
      "grocery": 0.5
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "federal-scapia",
    "bank": "Federal Bank",
    "name": "Scapia",
    "network": "VISA",
    "colors": [
      "#255ca8",
      "#102b55"
    ],
    "accent": "#e1edff",
    "bestFor": [
      "Travel",
      "Zero forex"
    ],
    "baseRate": 2,
    "rates": {
      "online": 2,
      "dining": 2,
      "travel": 2,
      "grocery": 2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  },
  {
    "id": "onecard-metal",
    "bank": "OneCard",
    "name": "Metal Card",
    "network": "VISA",
    "colors": [
      "#4b4c51",
      "#15161a"
    ],
    "accent": "#f3f3f4",
    "bestFor": [
      "Top categories",
      "App controls"
    ],
    "baseRate": 0.2,
    "rates": {
      "online": 1,
      "dining": 0.2,
      "travel": 0.2,
      "grocery": 0.2
    },
    "cap": "Detailed caps and milestones being verified",
    "capUsed": 0,
    "trackedValue": 0,
    "note": "Illustrative prototype rate. Full issuer rules will be verified before production.",
    "rewardModel": {
      "confidence": "indicative",
      "rewardLabel": "Estimated reward value",
      "assumptions": [
        "Catalogue rate is indicative and has not yet been fully modelled against issuer terms."
      ]
    },
    "discovery": null
  }
]
$cardsmart_seed$::jsonb);

do $$
declare
  actual_count integer;
  distinct_count integer;
begin
  select
    jsonb_array_length(payload),
    (
      select count(distinct item->>'id')
      from jsonb_array_elements(payload) item
    )
  into actual_count, distinct_count
  from _cardsmart_catalog_seed;

  if actual_count <> 97 then
    raise exception 'CardSmart seed expected 97 cards, found %', actual_count;
  end if;

  if distinct_count <> actual_count then
    raise exception 'CardSmart seed contains duplicate card IDs';
  end if;
end;
$$;

insert into public.card_catalog (
  id,
  issuer,
  name,
  network,
  status
)
select
  item->>'id',
  item->>'bank',
  item->>'name',
  item->>'network',
  'active'
from _cardsmart_catalog_seed seed
cross join lateral jsonb_array_elements(seed.payload) item
on conflict (id) do update set
  issuer = excluded.issuer,
  name = excluded.name,
  network = excluded.network,
  status = excluded.status;

insert into public.card_versions (
  card_id,
  version_no,
  status,
  effective_from,
  reward_model,
  fees,
  eligibility,
  benefits,
  terms_and_conditions,
  source_urls,
  change_summary,
  source_checked_at,
  reviewed_at,
  published_at
)
select
  item->>'id',
  1,
  'published',
  now(),
  (item - 'id' - 'bank' - 'name' - 'network' - 'discovery'),
  case
    when item->'discovery' is null or item->'discovery' = 'null'::jsonb then '{}'::jsonb
    else jsonb_build_object('annualFee', item->'discovery'->'annualFee')
  end,
  case
    when item->'discovery' is null or item->'discovery' = 'null'::jsonb then '{}'::jsonb
    else jsonb_build_object('minMonthlyIncome', item->'discovery'->'minMonthlyIncome')
  end,
  jsonb_strip_nulls(
    jsonb_build_object(
      'bestFor', item->'bestFor',
      'goals', item->'discovery'->'goals'
    )
  ),
  jsonb_build_object(
    'cap', item->'cap',
    'note', item->'note',
    'exclusions', coalesce(item->'rewardModel'->'exclusions', '[]'::jsonb),
    'assumptions', coalesce(item->'rewardModel'->'assumptions', '[]'::jsonb)
  ),
  '{}'::text[],
  'Initial migration from CardSmart V10.6 production catalogue',
  null,
  case
    when item->'rewardModel'->>'confidence' in ('verified', 'reviewed') then now()
    else null
  end,
  now()
from _cardsmart_catalog_seed seed
cross join lateral jsonb_array_elements(seed.payload) item
on conflict (card_id, version_no) do nothing;

commit;

-- Verification result. Expected: 97 cards, 97 published v1 versions.
select
  count(*) as active_cards,
  count(*) filter (
    where cv.reward_model->'rewardModel'->>'confidence' = 'verified'
  ) as verified_cards,
  count(*) filter (
    where cv.reward_model->'rewardModel'->>'confidence' = 'reviewed'
  ) as reviewed_cards,
  count(*) filter (
    where cv.reward_model->'rewardModel'->>'confidence' = 'indicative'
  ) as indicative_cards,
  count(*) filter (
    where cv.fees ? 'annualFee'
  ) as discovery_ready_cards
from public.card_catalog cc
join public.card_versions cv on cv.card_id = cc.id
where cc.status = 'active'
  and cv.status = 'published'
  and cv.version_no = 1;
