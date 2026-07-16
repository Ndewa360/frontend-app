import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MonitoringService } from '../services/monitoring.service';
import { ErrorThrottleService } from '../services/error-throttle.service';
import { ErrorLevel, ErrorSource } from '../models/monitoring.models';
import { environment } from '../../../environments/environment';

@Injectable()
export class MonitoringInterceptor implements HttpInterceptor {
  // Chemins exclus pour éviter la boucle infinie
  private readonly excludedUrls = ['/monitoring', '/health'];

  constructor(
    private monitoringService: MonitoringService,
    private errorThrottleService: ErrorThrottleService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(req).pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        if (responseTime > 5000) {
          console.warn(`[Monitoring] Requête lente: ${req.url} (${responseTime}ms)`);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Ne jamais logger les erreurs des routes monitoring — évite la boucle infinie
        if (!this.isExcludedUrl(req.url)) {
          if (environment.production || this.isCriticalError(error)) {
            this.logHttpError(error, req, startTime);
          } else {
            this.errorThrottleService.logError(
              `HTTP ${error.status}: ${req.method} ${req.url} - ${error.message}`,
              'HTTP_ERROR',
              'error'
            );
          }
        }
        return throwError(() => error);
      })
    );
  }

  private isExcludedUrl(url: string): boolean {
    return this.excludedUrls.some(excluded => url.includes(excluded));
  }

  private logHttpError(error: HttpErrorResponse, request: HttpRequest<any>, startTime: number): void {
    const responseTime = Date.now() - startTime;

    let level = ErrorLevel.MEDIUM;
    if (error.status >= 500) level = ErrorLevel.HIGH;
    else if (error.status === 0) level = ErrorLevel.CRITICAL;
    else if (error.status >= 400) level = ErrorLevel.MEDIUM;
    else level = ErrorLevel.LOW;

    let source = ErrorSource.NETWORK;
    if (error.status === 401 || error.status === 403) source = ErrorSource.AUTHENTICATION;
    else if (error.status === 422 || error.status === 400) source = ErrorSource.VALIDATION;
    else if (error.status >= 500) source = ErrorSource.BACKEND;

    const errorData = {
      message: this.getErrorMessage(error),
      stackTrace: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
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
      tags: [`status-${error.status}`, `method-${request.method.toLowerCase()}`, source.toLowerCase()]
    };

    this.monitoringService.logError(errorData).subscribe({ error: () => {} });
  }

  private isCriticalError(error: HttpErrorResponse): boolean {
    return error.status >= 500 || error.status === 401 || error.status === 403 || error.status === 0;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};
    if (headers?.keys) {
      headers.keys().forEach((key: string) => {
        if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
          sanitized[key] = headers.get(key);
        }
      });
    }
    return sanitized;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    ['password', 'token', 'secret', 'key', 'auth'].forEach(field => {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }

  private extractFeature(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      return segments.length > 0 ? segments[0] : 'unknown';
    } catch {
      const segments = url.split('/').filter(Boolean);
      return segments.length > 0 ? segments[0] : 'unknown';
    }
  }
}
