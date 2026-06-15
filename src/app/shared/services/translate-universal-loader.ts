import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { join } from 'path';

/**
 * Loader de traduction pour Angular Universal (SSR / Prerender).
 * Lit les fichiers JSON directement depuis le filesystem Node.js
 * au lieu de faire des requêtes HTTP — ce qui est impossible côté serveur
 * car le serveur HTTP n'est pas encore démarré au moment du rendu.
 *
 * Utilisé uniquement dans AppServerModule.
 */
export class TranslateUniversalLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    try {
      // En prerender/SSR, process.cwd() pointe vers la racine du projet
      // Les assets sont dans dist/app/browser/assets/i18n/ après le build
      // ou dans src/assets/i18n/ en développement
      const possiblePaths = [
        join(process.cwd(), `dist/app/browser/assets/i18n/${lang}.json`),
        join(process.cwd(), `src/assets/i18n/${lang}.json`),
      ];

      // Utiliser require() pour lire le fichier de façon synchrone
      // (fs.readFileSync serait aussi valable)
      for (const filePath of possiblePaths) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const translations = require(filePath);
          return of(translations);
        } catch {
          // Essayer le chemin suivant
        }
      }

      console.warn(`[TranslateUniversalLoader] Fichier de traduction introuvable pour la langue: ${lang}`);
      return of({});
    } catch (err) {
      console.error(`[TranslateUniversalLoader] Erreur lors du chargement de la traduction ${lang}:`, err);
      return of({});
    }
  }
}
