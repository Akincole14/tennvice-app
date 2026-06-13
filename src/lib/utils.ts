import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIER_LABELS: Record<string, string> = {
  BASIC:      "Standard",
  STANDARD:   "Plus",
  PLUS:       "Premium",
  PREMIUM:    "10-Plus",
  ENTERPRISE: "Landlords",
};

export const SUBSCRIPTION_TIERS = {
  BASIC: {
    label: "Standard",
    price: 19,
    visitsPerYear: 2,
    discount: 20,
    emergencyCallouts: 0,
    features: ["2 visits per year", "Minor checks", "20% discount on parts & labour (after 6 months)"],
  },
  STANDARD: {
    label: "Plus",
    price: 26,
    visitsPerYear: 2,
    discount: 20,
    emergencyCallouts: 0,
    features: ["2 visits per year", "Boiler check (no service)", "20% discount on parts & labour (after 6 months)"],
  },
  PLUS: {
    label: "Premium",
    price: 35,
    visitsPerYear: 4,
    discount: 20,
    emergencyCallouts: 0,
    features: ["Flexible visit frequency", "System & cylinder flushing", "20% discount on parts & labour (after 6 months)"],
  },
  PREMIUM: {
    label: "10-Plus",
    price: 40,
    visitsPerYear: 4,
    discount: 20,
    emergencyCallouts: 2,
    features: [
      "All Premium benefits",
      "Annual boiler service",
      "20% discount on parts & labour (after 6 months)",
      "2 emergency call-outs per year",
    ],
  },
  ENTERPRISE: {
    label: "Landlords",
    price: 0,
    visitsPerYear: 12,
    discount: 20,
    emergencyCallouts: Infinity,
    features: [
      "All 10-Plus benefits",
      "12 visits per year",
      "20% discount on parts & labour (after 6 months)",
      "Unlimited emergency call-outs",
      "Dedicated account manager",
    ],
  },
} as const;
