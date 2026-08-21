import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CorrelationIdInterceptor } from '../interceptors/correlation-id-interceptor';
import { environment } from 'src/environments/environment';

export interface ErrorLogEntry {
  type: 'uncaught' | 'http' | 'rejection' | 'custom';
  message: string;
  stack?: string;
  statusCode?: number;
  url?: string;
  method?: string;
  timestamp: string;
  extra?: Record<string, any>;
}

const STORAGE_KEY = 'ndewa360_error_buffer';

@Injectable({ providedIn: 'root' })
export class ErrorLogService {

  private buffer: ErrorLogEntry[] = [];
  private readonly maxBufferSize = 20;
  private readonly flushInterval = 30000;
  private flushTimer: any;
  private isFlushing = false;

  constructor(private http: HttpClient) {
    this.restoreBuffer();
    this.startFlushTimer();
    this.registerLifecycleHooks();
  }

  log(entry: ErrorLogEntry): void {
    // Déduplication : même message + même URL dans les 5 dernières secondes
    const duplicate = this.buffer.some(existing =>
      existing.message === entry.message &&
      existing.url === entry.url &&
      Math.abs(new Date(existing.timestamp).getTime() - new Date(entry.timestamp).getTime()) < 5000
    );
    if (duplicate) return;

    this.buffer.push({
      ...entry,
      extra: {
        ...entry.extra,
        correlationId: CorrelationIdInterceptor.getLastCorrelationId() || undefined,
        pageUrl: typeof location !== 'undefined' ? location.href : undefined,
      },
    });

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0 || this.isFlushing) return;

    const payload = [...this.buffer];
    this.buffer = [];

    this.http.post(`${environment.apiUrl}/health/errors`, {
      errors: payload,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      appVersion: environment.version,
    }).subscribe({
      next: () => this.clearPersistedBuffer(),
      error: () => {
        // Remet les erreurs en tête de buffer et persiste pour un envoi ultérieur
        this.buffer.unshift(...payload);
        this.persistBuffer();
      }
    });
  }

  private registerLifecycleHooks(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      this.flush();
      this.persistBuffer();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
        this.persistBuffer();
      }
    });

    window.addEventListener('online', () => this.flush());
  }

  private persistBuffer(): void {
    try {
      if (this.buffer.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer.slice(0, this.maxBufferSize)));
      }
    } catch {
      // localStorage plein ou indisponible — on ignore silencieusement
    }
  }

  private restoreBuffer(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const restored: ErrorLogEntry[] = JSON.parse(stored);
        if (Array.isArray(restored) && restored.length > 0) {
          this.buffer = restored.slice(0, this.maxBufferSize);
          // Tente un flush immédiat des erreurs hors ligne
          setTimeout(() => this.flush(), 5000);
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  private clearPersistedBuffer(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }
}
