import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Erreur HTTP déjà traitée par l'appelant.
 *
 * Le drapeau `handled` est ce que `GlobalErrorHandler` inspecte pour ne pas
 * afficher de toast générique par-dessus une erreur déjà expliquée.
 */
export interface HandledHttpError extends HttpErrorResponse {
  handled: true;
  /** Origine métier, utile pour la télémétrie. */
  context?: string;
  /** Message normalisé, affichable tel quel. */
  userMessage?: string;
}

/**
 * Traduit une `HttpErrorResponse` en informations exploitables.
 *
 * Ce service n'affiche **plus** de toast : l'intercepteur HTTP s'en charge,
 * et uniquement pour les requêtes relevant d'une action utilisateur. Voir
 * `http/http-error-context.ts` et `AppLoadingPhaseService`.
 *
 * Il reste utile pour deux choses :
 *  - normaliser les codes/messages une seule fois ;
 *  - allow-lister les codes techniques qui ne doivent jamais atteindre
 *    l'utilisateur.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /** Messages techniques à ne jamais exposer à l'utilisateur. */
  private readonly TECHNICAL_PATTERNS: RegExp[] = [
    /nested bson depth/i,
    /bson/i,
    /document exceeds maximum/i,
    /MongoServerError/i,
    /MongoError/i,
    /CastError/i,
    /ValidationError/i,
    /buffering timed out/i,
    /topology/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /parsePhoneNumber/i,
    /Cannot read propert/i,
    /socket hang up/i,
    /getaddrinfo/i,
  ];

  private readonly GENERIC_MESSAGE = 'Une erreur est survenue. Veuillez réessayer.';

  /**
   * Normalise puis propage l'erreur. Aucun affichage.
   *
   * L'erreur retournée est une `HandledError` : `GlobalErrorHandler` la
   * reconnaîtra et n'affichera pas de toast générique par-dessus.
   */
  handleHttpError(error: HttpErrorResponse, context?: string): Observable<never> {
    return throwError(() => this.toHandledError(error, context));
  }

  /**
   * Construit une erreur marquée comme déjà traitée.
   *
   * Le marqueur remplace les anciens filtrages par sous-chaîne sur du texte
   * français (`includes('Réponse')`), qui cassaient dès qu'un message changeait.
   */
  toHandledError(error: HttpErrorResponse, context?: string): HandledHttpError {
    const info = this.parseHttpError(error);
    const handled = error as HandledHttpError;
    handled.handled = true;
    if (context) {
      handled.context = context;
    }
    handled.userMessage = info.message;
    return handled;
  }

  /**
   * Parse les erreurs HTTP en informations utilisateur.
   */
  parseHttpError(error: HttpErrorResponse): ErrorInfo {
    switch (error?.status) {
      case 0:
        return { message: 'Aucune connexion internet. Vérifiez votre connexion.', code: 'NO_INTERNET' };

      case 400:
        return {
          message: error.error?.message || 'Données invalides',
          code: 'BAD_REQUEST',
          details: error.error?.details,
        };

      case 401:
        return { message: 'Session expirée. Veuillez vous reconnecter.', code: 'UNAUTHORIZED' };

      case 403:
        return { message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.', code: 'FORBIDDEN' };

      case 404:
        return { message: 'Ressource non trouvée', code: 'NOT_FOUND' };

      case 409:
        return { message: error.error?.message || 'Conflit de données', code: 'CONFLICT' };

      case 422:
        return {
          message: 'Données de validation incorrectes',
          code: 'VALIDATION_ERROR',
          details: error.error?.errors,
        };

      case 500:
        return { message: 'Erreur serveur. Veuillez réessayer plus tard.', code: 'SERVER_ERROR' };

      case 503:
        return { message: 'Service temporairement indisponible', code: 'SERVICE_UNAVAILABLE' };

      default:
        return { message: this.sanitize(error.error?.message) || 'Une erreur inattendue s\'est produite', code: 'UNKNOWN_ERROR' };
    }
  }

  /** Masque un message technique derrière un texte générique. */
  sanitize(message: any): string {
    const msg = Array.isArray(message) ? message[0] : (message || '');
    if (typeof msg === 'string' && this.TECHNICAL_PATTERNS.some(r => r.test(msg))) {
      return this.GENERIC_MESSAGE;
    }
    return typeof msg === 'string' ? msg : '';
  }

  /**
   * Aplatit un objet d'erreurs de validation en liste de messages.
   */
  handleFormValidationError(errors: any): string[] {
    const messages: string[] = [];
    if (errors && typeof errors === 'object') {
      Object.keys(errors).forEach(field => {
        const fieldErrors = errors[field];
        if (Array.isArray(fieldErrors)) {
          messages.push(...fieldErrors);
        } else if (typeof fieldErrors === 'string') {
          messages.push(fieldErrors);
        }
      });
    }
    return messages;
  }
}