import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marque une requête dont l'erreur ne doit jamais être signalée à l'utilisateur
 * par l'intercepteur HTTP.
 *
 * L'intercepteur enregistre toujours l'échec dans `ErrorLogService` : la
 * télémétrie n'est jamais perdue. Seule l'affichage est neutralisé.
 *
 * À utiliser pour :
 *  - les requêtes de chargement de page (le `DataDrivenLoaderService` affiche
 *    un état d'erreur avec action « Réessayer ») ;
 *  - les requêtes de fond (health check, prefetch, SEO, chargement de traduction) ;
 *  - les lectures dont l'échec est attendu (404 métier, lien de paiement absent) ;
 *  - les requêtes dont l'appelant affiche déjà son propre message.
 */
export const SILENT_HTTP_ERRORS = new HttpContextToken<boolean>(() => false);

/** Marque une requête comme déjà traitée par l'appelant. Alias de lecture de {@link SILENT_HTTP_ERRORS}. */
export function isSilentHttpError(context: HttpContext): boolean {
  return context.get(SILENT_HTTP_ERRORS);
}

/**
 * Contexte prêt à l'emploi pour une requête silencieuse.
 *
 * ```ts
 * this.http.get<User[]>(url, { context: silentHttp() })
 * ```
 */
export function silentHttp(): HttpContext {
  return new HttpContext().set(SILENT_HTTP_ERRORS, true);
}