import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ErrorLogService } from './error-log.service';

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

    // Ignorer les erreurs HTTP — déjà gérées par les catchError des states NGXS
    if (error?.status !== undefined || error?.name === 'HttpErrorResponse') return;

    // Ignorer les erreurs custom déjà gérées (marquées handled ou venant de NGXS)
    if (error?.handled === true) return;

    // Ignorer les erreurs de profil utilisateur — gérées dans user-profile.state.ts
    if (error?.message?.includes('profil utilisateur') || error?.message?.includes('Réponse')) return;

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
