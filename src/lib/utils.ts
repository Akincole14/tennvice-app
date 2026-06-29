import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIER_LABELS: Record<string, string> = {
  BASIC:      "Essential",
  STANDARD:   "Standard",
  PLUS:       "Premium",
  PREMIUM:    "Premium",
  ENTERPRISE: "Landlords",
};

export const SUBSCRIPTION_TIERS = {
  BASIC: {
    label: "Essential",
    price: 20,
    visitsPerYear: 2,
    discount: 30,
    emergencyCallouts: 0,
    tagline: "Biannual check — 2 visits annually",
    features: [
      "2 visits per year (every 6 months)",
      "Full digital service logbook",
      "Full written report every visit",
      "Up to 30% off all repair costs",
      "Priority appointment booking",
    ],
  },
  STANDARD: {
    label: "Standard",
    price: 30,
    visitsPerYear: 3,
    discount: 30,
    emergencyCallouts: 1,
    tagline: "Checks every 4 months — 3 visits annually",
    features: [
      "3 visits per year (every 4 months)",
      "Full digital service logbook",
      "Damp & mould monitoring",
      "Up to 30% off all repair costs",
      "Emergency priority response",
      "1 free emergency call-out per year",
    ],
  },
  PLUS: {
    label: "Premium",
    price: 50,
    visitsPerYear: 4,
    discount: 30,
    emergencyCallouts: 2,
    tagline: "Checks every 3 months — 4 visits annually",
    features: [
      "4 visits per year (every 3 months)",
      "Comprehensive digital logbook",
      "Proactive hazard reporting",
      "Up to 30% off all repair costs",
      "Same-day emergency response",
      "2 free emergency call-outs per year",
    ],
  },
  PREMIUM: {
    label: "Premium",
    price: 50,
    visitsPerYear: 4,
    discount: 30,
    emergencyCallouts: 2,
    tagline: "Checks every 3 months — 4 visits annually",
    hidden: true,
    features: [
      "4 visits per year (every 3 months)",
      "Comprehensive digital logbook",
      "Proactive hazard reporting",
      "Up to 30% off all repair costs",
      "Same-day emergency response",
      "2 free emergency call-outs per year",
    ],
  },
  ENTERPRISE: {
    label: "Landlords",
    price: 0,
    visitsPerYear: 12,
    discount: 30,
    emergencyCallouts: Infinity,
    tagline: "Multiple properties, one account",
    features: [
      "All Premium benefits",
      "Multiple properties under one account",
      "Meets legal electrical & gas obligations",
      "Up to 30% off all repair costs",
      "Dedicated account manager",
      "Unlimited emergency call-outs",
    ],
  },
} as const;
