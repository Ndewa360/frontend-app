/**
 * Grille tarifaire « Loyers sous contrôle » côté interface.
 * Miroir de backend/src/souscription/pricing/pricing-grid.ts : le backend
 * reste la source de vérité de la facturation, ces valeurs servent à
 * l'affichage (landing page, écrans de facturation hors connexion API).
 */

export type PricingTier = 'FREE' | 'PRO_1' | 'PRO_2' | 'PRO_3' | 'PRO_4' | 'GOLD';

export const MIN_OCCUPATION_DAYS = 15;
export const FREE_MAX_PROPERTIES = 1;
export const FREE_MAX_OCCUPIED_UNITS = 4;
export const GOLD_THRESHOLD = 2_500_000;
export const TRIAL_DURATION_DAYS = 30;

export interface ProBracket {
  tier: PricingTier;
  /** Borne basse incluse du total des loyers (FCFA). */
  minRent: number;
  /** Borne haute incluse (FCFA). */
  maxRent: number;
  price: number;
}

export const PRO_BRACKETS: ProBracket[] = [
  { tier: 'PRO_1', minRent: 0, maxRent: 250_000, price: 3_000 },
  { tier: 'PRO_2', minRent: 250_001, maxRent: 500_000, price: 6_000 },
  { tier: 'PRO_3', minRent: 500_001, maxRent: 1_000_000, price: 10_000 },
  { tier: 'PRO_4', minRent: 1_000_001, maxRent: GOLD_THRESHOLD, price: 20_000 },
];

export const PRICING_CONTACT = {
  email: 'contact@ndewa-360.com',
  whatsapp: '+237 698 29 53 68',
  whatsappLink: 'https://wa.me/237698295368',
};

/** Résumé renvoyé par GET /subscription-limit/pricing. */
export interface PricingSummary {
  tier: PricingTier;
  amount: number;
  occupiedUnitsCount: number;
  totalRent: number;
  propertiesCount: number;
  proReason: 'MULTIPLE_PROPERTIES' | 'OCCUPIED_UNITS' | null;
  goldPendingCustomAmount: boolean;
  nextThreshold: { rent: number; price: number | null; tier: PricingTier } | null;
  trialActive: boolean;
  plan: string;
}

export function isPaidTier(tier: PricingTier | null | undefined): boolean {
  return !!tier && tier !== 'FREE';
}

/** Montant en FCFA avec espaces insécables : « 250 000 FCFA » ne se coupe jamais. */
export function formatFcfa(value: number | null | undefined): string {
  const digits = String(Math.round(value || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${digits} FCFA`;
}

/** Palier Pro correspondant à un total de loyers (hors règle « 2 biens / 5 logements »). */
export function proTierForRent(totalRent: number): { tier: PricingTier; price: number | null } {
  const bracket = PRO_BRACKETS.find(b => totalRent <= b.maxRent);
  return bracket ? { tier: bracket.tier, price: bracket.price } : { tier: 'GOLD', price: null };
}
