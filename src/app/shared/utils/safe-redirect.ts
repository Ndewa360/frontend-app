/** Domaines externes vers lesquels l'application peut rediriger (paiement). */
const ALLOWED_EXTERNAL_HOSTS = ['checkout.stripe.com'];
const OWN_DOMAIN = 'ndewa-360.com';

/**
 * Vrai si `url` reste sur l'application, sur un sous-domaine Ndewa360 ou sur
 * un prestataire de paiement autorisé. L'URL est analysée (et non comparée
 * comme une chaîne) : `//evil.com` ou `https://evil.com/?checkout.stripe.com`
 * sont refusées.
 */
export function isAllowedRedirect(url: string | null | undefined): boolean {
  if (!url || typeof window === 'undefined') return false;
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.origin);
  } catch {
    return false;
  }
  if (parsed.origin === window.location.origin) return true;
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_EXTERNAL_HOSTS.includes(host) || host === OWN_DOMAIN || host.endsWith(`.${OWN_DOMAIN}`);
}
