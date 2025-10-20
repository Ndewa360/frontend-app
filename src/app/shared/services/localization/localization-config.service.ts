import { Injectable } from '@angular/core';

export interface SupportedLanguage {
  code: string; // Code ISO 639-1
  name: string;
  nativeName: string;
  flag: string; // Emoji ou chemin vers l'icône
  rtl?: boolean; // Right-to-left
}

export interface SupportedCurrency {
  code: string; // Code ISO 4217
  name: string;
  symbol: string;
  countries: string[]; // Pays utilisant cette devise
}

export interface LocalizationConfig {
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTimezone: string;
  supportedLanguages: SupportedLanguage[];
  supportedCurrencies: SupportedCurrency[];
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationConfigService {

  private readonly config: LocalizationConfig = {
    defaultLanguage: 'fr',
    defaultCurrency: 'XAF',
    defaultTimezone: 'Africa/Douala',
    
    supportedLanguages: [
      {
        code: 'fr',
        name: 'Français',
        nativeName: 'Français',
        flag: '🇫🇷'
      },
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸'
      },

    ],
    
    supportedCurrencies: [
      {
        code: 'XAF',
        name: 'Franc CFA (CEMAC)',
        symbol: 'FCFA',
        countries: ['Cameroun', 'Tchad', 'République centrafricaine', 'Congo', 'Gabon', 'Guinée équatoriale']
      },
      {
        code: 'XOF',
        name: 'Franc CFA (UEMOA)',
        symbol: 'FCFA',
        countries: ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Guinée-Bissau']
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        countries: ['France', 'Allemagne', 'Espagne', 'Italie', 'Belgique', 'Pays-Bas']
      },
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        countries: ['États-Unis', 'Canada']
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        countries: ['Royaume-Uni']
      },
      {
        code: 'MAD',
        name: 'Dirham marocain',
        symbol: 'DH',
        countries: ['Maroc']
      },
      {
        code: 'DZD',
        name: 'Dinar algérien',
        symbol: 'DA',
        countries: ['Algérie']
      },
      {
        code: 'TND',
        name: 'Dinar tunisien',
        symbol: 'TND',
        countries: ['Tunisie']
      }
    ]
  };

  getConfig(): LocalizationConfig {
    return this.config;
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return this.config.supportedLanguages;
  }

  getSupportedCurrencies(): SupportedCurrency[] {
    return this.config.supportedCurrencies;
  }

  getLanguageByCode(code: string): SupportedLanguage | undefined {
    return this.config.supportedLanguages.find(lang => lang.code === code);
  }

  getCurrencyByCode(code: string): SupportedCurrency | undefined {
    return this.config.supportedCurrencies.find(currency => currency.code === code);
  }

  getDefaultLanguage(): string {
    return this.config.defaultLanguage;
  }

  getDefaultCurrency(): string {
    return this.config.defaultCurrency;
  }

  getDefaultTimezone(): string {
    return this.config.defaultTimezone;
  }

  isLanguageSupported(code: string): boolean {
    return this.config.supportedLanguages.some(lang => lang.code === code);
  }

  isCurrencySupported(code: string): boolean {
    return this.config.supportedCurrencies.some(currency => currency.code === code);
  }
}
