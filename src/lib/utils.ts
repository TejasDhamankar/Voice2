import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as INR currency
 * @param amount - Amount in rupees
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Plan type definitions
export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: number | null;
  minutes: number | string;
  agents: number | string;
  extraMinuteRate: number | null;
  features: string[];
  popular?: boolean;
}

// Plan configurations
export const plans: Record<PlanId, Plan> = {
   free: {
    id: 'free',
    name: "Free",
    price: 0,
    minutes: 0,
    agents: 0,
    extraMinuteRate: null,
    features: [
      "Limited access to features",
      "No calling capabilities",
      "Perfect for exploration",
      "Basic support",
    ],
    popular: false,
  },
  starter: {
    id: 'starter',
    name: "Starter",
    price: 2499,
    minutes: 300,
    agents: 1,
    extraMinuteRate: null, // No extra minutes for starter
    features: [
      "300 minutes included",
      "1 AI agent",
      "Basic voice selection",
      "Standard support",
    ],
    popular: false,
  },
  growth: {
    id: 'growth',
    name: "Growth",
    price: 5999,
    minutes: 800,
    agents: 3,
    extraMinuteRate: 550, // ₹5.50 per minute
    features: [
      "800 minutes included",
      "3 AI agents",
      "Standard voice selection",
      "Priority email support",
      "Purchase Extra Minutes",
    ],
    popular: true,
  },
  pro: {
    id: 'pro',
    name: "Pro",
    price: 11999,
    minutes: 1800,
    agents: 7,
    extraMinuteRate: 500, // ₹5.00 per minute
    features: [
      "1,800 minutes included",
      "7 AI agents",
      "Premium voice selection",
      "Priority support",
      "Team collaboration",
      "Purchase Extra Minutes",
    ],
    popular: false,
  },
  enterprise: {
    id: 'enterprise',
    name: "Enterprise",
    price: null, // Custom pricing
    minutes: "5,000+",
    agents: "15+",
    extraMinuteRate: 450, // ₹4.50 per minute
    features: [
      "5,000+ minutes included",
      "15+ AI agents",
      "All premium voices",
      "Dedicated account manager",
      "Custom integrations",
      "Purchase Extra Minutes",
    ],
    popular: false,
  }
};


