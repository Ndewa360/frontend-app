import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MonitoringService } from '../services/monitoring.service';
import { ErrorLevel, ErrorSource } from '../models/monitoring.models';
import { environment } from '../../../environments/environment';

@Injectable()
export class MonitoringInterceptor implements HttpInterceptor {
  constructor(private monitoringService: MonitoringService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(req).pipe(
      tap(() => {
        // Mesurer le temps de réponse pour les métriques
        const responseTime = Date.now() - startTime;
        this.trackResponseTime(req.url, responseTime);
      }),
      catchError((error: HttpErrorResponse) => {
        // Logger l'erreur HTTP seulement en production ou si c'est critique
        if (environment.production || this.isCriticalError(error)) {
          this.logHttpError(error, req, startTime);
        }

        // En développement, logger aussi dans la console
        if (!environment.production) {
          console.error('🌐 HTTP Error intercepted:', {
            url: req.url,
            method: req.method,
            status: error.status,
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }

        return throwError(() => error);
      })
    );
  }

  private logHttpError(error: HttpErrorResponse, request: HttpRequest<any>, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    // Déterminer le niveau d'erreur
    let level = ErrorLevel.MEDIUM;
    if (error.status >= 500) {
      level = ErrorLevel.HIGH;
    } else if (error.status >= 400) {
      level = ErrorLevel.MEDIUM;
    } else if (error.status === 0) {
      // Erreur réseau (pas de connexion)
      level = ErrorLevel.CRITICAL;
    } else {
      level = ErrorLevel.LOW;
    }

    // Déterminer la source
    let source = ErrorSource.NETWORK;
    if (error.status === 401 || error.status === 403) {
      source = ErrorSource.AUTHENTICATION;
    } else if (error.status === 422 || error.status === 400) {
      source = ErrorSource.VALIDATION;
    } else if (error.status >= 500) {
      source = ErrorSource.BACKEND;
    }

    // Extraire les informations de l'erreur
    const errorData = {
      message: this.getErrorMessage(error),
      stackTrace: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        headers: error.headers,
        error: error.error,
        responseTime
      },
      level,
      source,
      url: request.url,
      component: 'HTTP Client',
      feature: this.extractFeature(request.url),
      additionalData: {
        method: request.method,
        requestHeaders: this.sanitizeHeaders(request.headers),
        requestBody: this.sanitizeRequestBody(request.body),
        responseTime,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      },
      tags: [
        `status-${error.status}`,
        `method-${request.method.toLowerCase()}`,
        source.toLowerCase()
      ]
    };

    // Logger l'erreur
    this.monitoringService.logError(errorData).subscribe({
      error: (logError) => console.error('Failed to log HTTP error:', logError)
    });

    // Ajouter une alerte si c'est critique
    if (level === ErrorLevel.HIGH || level === ErrorLevel.CRITICAL) {
      this.monitoringService.addAlert({
        type: 'error',
        title: 'Erreur HTTP Critique',
        message: `${request.method} ${request.url} - ${error.status} ${error.statusText}`,
        source,
        level,
        autoClose: true,
        duration: 10000
      });
    }
  }

  private isCriticalError(error: HttpErrorResponse): boolean {
    // Définir quelles erreurs HTTP sont critiques
    return error.status >= 500 || 
           error.status === 401 || 
           error.status === 403 ||
           error.status === 0; // Erreurs réseau
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    
    if (headers && headers.keys) {
      headers.keys().forEach((key: string) => {
        // Exclure les headers sensibles
        if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
          sanitized[key] = headers.get(key);
        }
      });
    }
    
    return sanitized;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Supprimer les champs sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private extractFeature(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[0]; // Premier segment après le domaine
      }
    } catch (e) {
      // Si l'URL n'est pas valide, essayer de l'analyser comme un chemin relatif
      const segments = url.split('/').filter(Boolean);
      if (segments.length > 0) {
        return segments[0];
      }
    }
    return 'unknown';
  }

  private trackResponseTime(url: string, responseTime: number): void {
    // Ici vous pouvez implémenter le tracking des temps de réponse
    // pour les métriques en temps réel
    if (responseTime > 5000) { // Plus de 5 secondes
      this.monitoringService.addAlert({
        type: 'warning',
        title: 'Réponse Lente',
        message: `Requête vers ${url} a pris ${responseTime}ms`,
        autoClose: true,
        duration: 5000
      });
    }
  }
}
