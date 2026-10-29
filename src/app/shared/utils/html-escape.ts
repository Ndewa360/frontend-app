/**
 * Échappe une valeur avant de l'insérer dans du HTML construit à la main
 * (fenêtres d'impression, documents générés). Sans cela, un nom de locataire
 * contenant du HTML s'exécuterait dans une fenêtre de même origine que
 * l'application.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
