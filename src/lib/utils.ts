import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUBSCRIPTION_TIERS = {
  BASIC: {
    label: "Basic",
    price: 15,
    visitsPerYear: 2,
    discount: 20,
    emergencyCallouts: 0,
    features: ["2 visits per year", "Minor checks", "20% discount on parts & labour"],
  },
  STANDARD: {
    label: "Standard",
    price: 22,
    visitsPerYear: 2,
    discount: 20,
    emergencyCallouts: 0,
    features: ["2 visits per year", "Boiler check (no service)", "20% discount on parts & labour"],
  },
  PLUS: {
    label: "Plus",
    price: 27,
    visitsPerYear: 4,
    discount: 30,
    emergencyCallouts: 0,
    features: ["Flexible visit frequency", "System & cylinder flushing", "30% discount on parts & labour"],
  },
  PREMIUM: {
    label: "Premium",
    price: 50,
    visitsPerYear: 4,
    discount: 40,
    emergencyCallouts: 2,
    features: [
      "All Plus benefits",
      "Annual boiler service",
      "40% discount on parts & labour",
      "2 emergency call-outs per year",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    price: 75,
    visitsPerYear: 12,
    discount: 50,
    emergencyCallouts: Infinity,
    features: [
      "All Premium benefits",
      "12 visits per year",
      "50% discount on parts & labour",
      "Unlimited emergency call-outs",
      "Dedicated account manager",
    ],
  },
} as const;
