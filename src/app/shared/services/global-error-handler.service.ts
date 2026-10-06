import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ErrorLogService } from './error-log.service';

/**
 * Erreur déjà traitée par l'appelant :aucun toast global ne doit être affiché.
 *
 * À poser sur une erreur avant de la propager :
 * ```ts
 * const e = new Error('message');
 * e.handled = true;
 * throw e;
 * ```
 *
 * Ce marqueur remplace les anciens filtrages par sous-chaîne sur du texte
 * français (`message.includes('profil utilisateur')`, `includes('Réponse')`),
 * qui cessaient de fonctionner dès qu'un message changeait ou passait en
 * production dans une autre langue.
 */
export interface MarkedHandledError extends Error {
  handled: true;
}

/** Marque une erreur comme déjà traitée. À utiliser avec `throw`. */
export function markAsHandled<T extends Error>(error: T): T & MarkedHandledError {
  (error as T & MarkedHandledError).handled = true;
  return error as T & MarkedHandledError;
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private toastr: ToastrService;
  private errorLog: ErrorLogService;
  private translate: TranslateService;

  constructor(private injector: Injector, private zone: NgZone) {}

  handleError(error: any): void {
    if (!this.toastr) {
      this.toastr = this.injector.get(ToastrService);
      this.errorLog = this.injector.get(ErrorLogService);
      this.translate = this.injector.get(TranslateService);
    }

    // Erreurs HTTP : traitées par l'intercepteur et par l'appelant.
    if (error?.status !== undefined || error?.name === 'HttpErrorResponse') return;

    // Erreurs explicitement marquées comme traitées (ErrorHandlerService,
    // states NGXS, composants). Marker typé, pas de filtrage sur le texte.
    if (error?.handled === true) return;

    const message = error?.message || error?.toString() || 'Unknown error';
    const stack = error?.stack || '';

    this.errorLog.log({
      type: 'uncaught',
      message,
      stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    });

    const userMessage = this.translate.instant('NOTIFICATIONS.GENERIC_ERROR');
    this.zone.run(() => {
      this.toastr.error(
        userMessage && userMessage !== 'NOTIFICATIONS.GENERIC_ERROR'
          ? userMessage
          : 'Une erreur inattendue s\'est produite. Veuillez recharger la page.',
        'Ndewa360°',
        { timeOut: 8000, closeButton: true }
      );
    });
  }
}