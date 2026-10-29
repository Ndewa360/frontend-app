/**
 * Date au format AAAA-MM-JJ dans le fuseau de l'utilisateur.
 *
 * `toISOString()` donne la date UTC : au Cameroun (UTC+1) elle vaut la veille
 * entre minuit et 1 h, et pour un propriétaire de la diaspora (UTC-5) le
 * lendemain chaque soir après 19 h.
 */
export function toLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
