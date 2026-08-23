import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const CACHE_KEY = 'ndewa_exchange_rates';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure
const API = `${environment.apiUrl}/admin/platform-finance`;

const FALLBACK_RATES: Record<string, number> = {
  XAF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 609.871,
  GBP: 1 / 782.50,
  NGN: 1 / 0.55,
  GHS: 1 / 5.20,
  CDF: 1 / 0.26,
  CAD: 1 / 447.00,
};

export interface ExchangeRateResult {
  baseCurrency: string;
  rates: Record<string, number>;
  source: 'api' | 'cache' | 'fallback';
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private rates$ = new BehaviorSubject<ExchangeRateResult | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Récupère les taux de change depuis le backend (qui fetch l'API externe).
   * Priorité : cache localStorage → backend → fallback hardcodé.
   */
  getRates(): Observable<ExchangeRateResult> {
    // 1. Vérifier le cache
    const cached = this.getCachedRates();
    if (cached) {
      this.rates$.next(cached);
      return of(cached);
    }

    // 2. Fetch depuis le backend (qui gère l'API externe + cache serveur)
    return this.fetchFromBackend().pipe(
      tap(result => {
        this.cacheRates(result);
        this.rates$.next(result);
      }),
      catchError(() => {
        // 3. Fallback hardcodé
        const fallback: ExchangeRateResult = {
          baseCurrency: 'XAF',
          rates: FALLBACK_RATES,
          source: 'fallback',
          updatedAt: new Date(),
        };
        this.rates$.next(fallback);
        return of(fallback);
      }),
    );
  }

  /**
   * Convertit un montant depuis XAF vers la devise cible.
   */
  convert(amountInXaf: number, targetCurrency: string, rates: Record<string, number>): number {
    if (targetCurrency === 'XAF') return amountInXaf;
    const rate = rates[targetCurrency] || 1;
    return Math.floor((amountInXaf || 0) * rate * 100) / 100;
  }

  /**
   * Observable courant des taux.
   */
  get rates(): Observable<ExchangeRateResult | null> {
    return this.rates$.asObservable();
  }

  // ── Backend ──────────────────────────────────────────────────────────────

  private fetchFromBackend(): Observable<ExchangeRateResult> {
    return this.http.get<any>(`${API}/exchange-rates`).pipe(
      map(response => {
        const data = response?.data;
        if (data?.rates) {
          return {
            baseCurrency: data.baseCurrency || 'XAF',
            rates: data.rates,
            source: data.source || 'api',
            updatedAt: new Date(data.updatedAt || Date.now()),
          };
        }
        throw new Error('Invalid backend response');
      }),
    );
  }

  // ── Cache localStorage ──────────────────────────────────────────────────

  private getCachedRates(): ExchangeRateResult | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const age = Date.now() - new Date(parsed.updatedAt || parsed.fetchedAt).getTime();
      if (age > CACHE_TTL_MS) return null;
      return { ...parsed, updatedAt: new Date(parsed.updatedAt || parsed.fetchedAt), source: 'cache' };
    } catch {
      return null;
    }
  }

  private cacheRates(result: ExchangeRateResult): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch { /* ignore */ }
  }
}
