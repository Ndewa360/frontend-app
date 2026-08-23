import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Store } from '@ngxs/store';
import { ExchangeRateService } from './exchange-rate.service';
import { UserProfileState } from '../../../shared/store/user-profile/user-profile.state';
import { UserProfileAction } from '../../../shared/store/user-profile/user-profile.actions';

const STORAGE_KEY = 'ndewa_currency';

const ADMIN_CURRENCIES: string[] = ['XAF', 'EUR', 'USD'];

const CURRENCY_LABELS: Record<string, string> = {
  XAF: 'FCFA (XAF)',
  EUR: 'Euro (EUR)',
  USD: 'Dollar (USD)',
};

const CURRENCY_CONFIG: Record<string, { locale: string; currency: string }> = {
  XAF: { locale: 'fr-FR', currency: 'XAF' },
  EUR: { locale: 'fr-FR', currency: 'EUR' },
  USD: { locale: 'en-US', currency: 'USD' },
};

/**
 * Devise globale de l'espace admin.
 * Tous les montants du backend sont en XAF ; la conversion/formatage est
 * centralisée ici et s'applique à toutes les pages admin sans rechargement.
 */
@Injectable({ providedIn: 'root' })
export class AdminCurrencyService {
  rates: Record<string, number> = { XAF: 1 };

  private selectedCurrency$ = new BehaviorSubject<string>('XAF');

  constructor(
    private store: Store,
    private exchangeRateService: ExchangeRateService,
  ) {}

  get currency(): string {
    return this.selectedCurrency$.getValue();
  }

  get currencyChange$(): BehaviorSubject<string> {
    return this.selectedCurrency$;
  }

  get availableCurrencies(): string[] {
    return ADMIN_CURRENCIES;
  }

  get currencyLabels(): Record<string, string> {
    return CURRENCY_LABELS;
  }

  init(): void {
    this.refreshRates();
    const stored = this.readStoredCurrency();
    if (stored) this.selectedCurrency$.next(stored);
  }

  setCurrency(code: string): void {
    if (!ADMIN_CURRENCIES.includes(code)) return;
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
    this.selectedCurrency$.next(code);
    this.refreshRates();
    if (this.store.selectSnapshot(UserProfileState.selectStateUserProfile)) {
      this.store.dispatch(new UserProfileAction.UpdateUserCurrencyPreference(code));
    }
  }

  convert(amountInXaf: number, targetCurrency?: string): number {
    const target = targetCurrency || this.currency;
    if (target === 'XAF') return amountInXaf || 0;
    const rate = this.rates[target] || 1;
    return Math.floor((amountInXaf || 0) * rate * 100) / 100;
  }

  format(amountInXaf: number, targetCurrency?: string): string {
    const target = targetCurrency || this.currency;
    const rate = target === 'XAF' ? 1 : this.rates[target] || 1;
    const raw = (amountInXaf || 0) * rate;

    // Troncature à 2 décimales (pas d'arrondi)
    const converted = target === 'XAF'
      ? Math.floor(raw)
      : Math.floor(raw * 100) / 100;

    const cfg = CURRENCY_CONFIG[target] || CURRENCY_CONFIG['XAF'];
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      minimumFractionDigits: target === 'XAF' ? 0 : 2,
      maximumFractionDigits: target === 'XAF' ? 0 : 2,
    }).format(converted);
  }

  refreshRates(): void {
    this.exchangeRateService.getRates().subscribe({
      next: (result) => {
        if (result?.rates) this.rates = result.rates;
      },
      error: () => {},
    });
  }

  private readStoredCurrency(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ADMIN_CURRENCIES.includes(stored)) return stored;
    } catch { /* ignore */ }
    const preferred = this.store.selectSnapshot(UserProfileState.selectStateUserProfile)?.preferredCurrency;
    return preferred && ADMIN_CURRENCIES.includes(preferred) ? preferred : null;
  }
}
