import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

/* eslint-disable @typescript-eslint/no-var-requires */
// Traductions intégrées au bundle serveur à la compilation (chemins
// littéraux). L'ancien chargeur cherchait les fichiers JSON sur le disque
// avec un chemin calculé : dans le bundle, ce require dynamique échouait et
// renvoyait {}, et sur Vercel les fichiers de dist/app/browser ne sont pas
// dans la fonction serveur. Les pages rendues côté serveur (accueil,
// recherche, tarifs, centre d'aide) contenaient donc des clés
// (« HEADER.HOME », « LANDING.HERO.TITLE »…) au lieu des textes : c'est ce
// que lisaient les moteurs de recherche et les assistants IA.
const TRANSLATIONS: Record<string, any> = {
  fr: { ...require('../../../assets/i18n/fr.json'), ...require('../../../assets/i18n/fr-legal.json') },
  en: { ...require('../../../assets/i18n/en.json'), ...require('../../../assets/i18n/en-legal.json') },
};
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * Chargeur de traductions du rendu serveur (SSR), utilisé uniquement dans
 * AppServerModule. Textes de base et textes juridiques (pages légales) ;
 * l'administration n'est jamais rendue côté serveur.
 */
export class TranslateUniversalLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    return of(TRANSLATIONS[lang] ?? TRANSLATIONS['fr']);
  }
}
