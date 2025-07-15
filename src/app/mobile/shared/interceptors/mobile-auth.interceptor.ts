import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';

import { MobileAutoLoginService } from '../services/mobile-auto-login.service';

@Injectable()
export class MobileAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private autoLoginService: MobileAutoLoginService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas ajouter le token pour les requêtes d'authentification
    if (this.isAuthRequest(req)) {
      return next.handle(req);
    }

    return this.addTokenToRequest(req, next);
  }

  /**
   * Ajouter le token à la requête
   */
  private addTokenToRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      this.autoLoginService.getAccessToken().then(token => {
        if (token) {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          
          next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 401) {
                return this.handle401Error(authReq, next);
              }
              return throwError(error);
            })
          ).subscribe(observer);
        } else {
          // Pas de token, envoyer la requête sans authentification
          next.handle(req).subscribe(observer);
        }
      }).catch(error => {
        console.error('Erreur lors de la récupération du token:', error);
        next.handle(req).subscribe(observer);
      });
    });
  }

  /**
   * Gérer les erreurs 401 (Non autorisé)
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return new Observable(observer => {
        this.autoLoginService.refreshAccessToken().then(success => {
          if (success) {
            this.isRefreshing = false;
            
            // Obtenir le nouveau token et refaire la requête
            this.autoLoginService.getAccessToken().then(newToken => {
              this.refreshTokenSubject.next(newToken);
              
              const authReq = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              
              next.handle(authReq).subscribe(observer);
            });
          } else {
            // Échec du rafraîchissement, déconnecter
            this.isRefreshing = false;
            this.autoLoginService.logout();
            observer.error(new HttpErrorResponse({
              status: 401,
              statusText: 'Token refresh failed'
            }));
          }
        }).catch(error => {
          this.isRefreshing = false;
          this.autoLoginService.logout();
          observer.error(error);
        });
      });
    } else {
      // Un rafraîchissement est déjà en cours, attendre
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          const authReq = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(authReq);
        })
      );
    }
  }

  /**
   * Vérifier si c'est une requête d'authentification
   */
  private isAuthRequest(req: HttpRequest<any>): boolean {
    const authUrls = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];
    return authUrls.some(url => req.url.includes(url));
  }
}
