import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class ErrorLogService {

  private buffer: ErrorLogEntry[] = [];
  private readonly maxBufferSize = 20;
  private readonly flushInterval = 30000;
  private flushTimer: any;

  constructor(private http: HttpClient) {
    this.startFlushTimer();
  }

  log(entry: ErrorLogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const payload = [...this.buffer];
    this.buffer = [];

    this.http.post(`${environment.apiUrl}/health/errors`, {
      errors: payload,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      appVersion: environment.version,
    }).subscribe({
      error: () => {
        this.buffer.unshift(...payload.slice(0, 5));
      }
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }
}
