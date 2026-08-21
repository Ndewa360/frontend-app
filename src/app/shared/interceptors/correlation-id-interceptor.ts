import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Génère un identifiant de corrélation unique par requête et l'attache
 * aux en-têtes `x-correlation-id` + `x-app-source`.
 * L'ID renvoyé par le backend est capturé pour le reporting d'erreurs
 * (permet de croiser une erreur frontend avec les logs backend/Loki).
 */
@Injectable()
export class CorrelationIdInterceptor implements HttpInterceptor {

  /** Dernier ID de corrélation reçu du backend (ou généré localement). */
  private static lastCorrelationId: string | null = null;

  static getLastCorrelationId(): string | null {
    return CorrelationIdInterceptor.lastCorrelationId;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const correlationId = this.generateUuid();
    CorrelationIdInterceptor.lastCorrelationId = correlationId;

    const cloned = req.clone({
      setHeaders: {
        'x-correlation-id': correlationId,
        'x-app-source': 'web',
      },
    });

    return next.handle(cloned).pipe(
      tap(
        (event) => {
          if (event instanceof HttpResponse) {
            const backendId = event.headers.get('x-correlation-id');
            if (backendId) {
              CorrelationIdInterceptor.lastCorrelationId = backendId;
            }
          }
        },
        (error) => {
          if (error instanceof HttpErrorResponse) {
            const backendId = error.headers?.get('x-correlation-id');
            if (backendId) {
              CorrelationIdInterceptor.lastCorrelationId = backendId;
            }
          }
        }
      )
    );
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    // Fallback pour navigateurs sans crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
