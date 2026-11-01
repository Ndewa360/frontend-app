/**
 * Langue courante de l'application, lue à une seule source de vérité.
 *
 * Deux clés coexistaient : `selectedLanguage` (langue de l'URL, écrite par
 * LanguageUrlService) et `ndiye-preferred-language` (écrite par
 * TranslationService et lue pour le format des dates). L'interface pouvait
 * être en anglais avec des dates au format français, ou l'inverse.
 *
 * Ordre : préfixe de l'URL (/fr, /en), puis le choix enregistré, puis la
 * langue du navigateur.
 */
export const LANGUAGE_STORAGE_KEY = 'selectedLanguage';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'ndiye-preferred-language';
const SUPPORTED = ['fr', 'en'];

export function currentAppLanguage(): string {
  if (typeof window === 'undefined') return 'fr';
  try {
    const fromUrl = (window.location?.pathname || '').split('/')[1];
    if (SUPPORTED.includes(fromUrl)) return fromUrl;
  } catch {}
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {}
  try {
    const browser = (navigator.language || '').split('-')[0].toLowerCase();
    if (SUPPORTED.includes(browser)) return browser;
  } catch {}
  return 'fr';
}

/** Enregistre la langue sous les deux clés (compatibilité avec le code existant). */
export function saveAppLanguage(lang: string): void {
  if (!SUPPORTED.includes(lang)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, lang);
  } catch {}
}

/**
 * Valeur de LOCALE_ID qui suit la langue courante. Angular fige LOCALE_ID au
 * démarrage ; cet objet résout la locale à chaque utilisation (DatePipe,
 * DecimalPipe, CurrencyPipe…), si bien qu'un changement de langue s'applique
 * au format des dates et des nombres sans recharger la page.
 */
export class DynamicLocaleId extends String {
  override toString(): string {
    return currentAppLanguage() === 'en' ? 'en-US' : 'fr-FR';
  }

  override valueOf(): string {
    return this.toString();
  }
}
