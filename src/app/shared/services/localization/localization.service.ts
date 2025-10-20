import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../../store/user-profile/user-profile.state';
import { LocalizationConfigService, SupportedLanguage, SupportedCurrency } from './localization-config.service';
import { UserProfileModel } from '../../store/user-profile/user-profile.model';

// Import des locales Angular
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';

export interface LocalizationState {
  currentLanguage: string;
  currentCurrency: string;
  currentTimezone: string;
  dateFormat: string;
  numberFormat: string;
  isRTL: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {

  private readonly localizationState$ = new BehaviorSubject<LocalizationState>({
    currentLanguage: 'fr',
    currentCurrency: 'XAF',
    currentTimezone: 'Africa/Douala',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR',
    isRTL: false
  });

  private readonly localeMap = new Map([
    ['en', localeEn],
    ['fr', localeFr]
  ]);

  constructor(
    @Inject(LOCALE_ID) private currentLocale: string,
    private store: Store,
    private configService: LocalizationConfigService
  ) {
    this.initializeLocalization();
    this.registerAllLocales();
  }

  /**
   * Initialise la localisation basée sur les préférences utilisateur
   */
  private initializeLocalization(): void {
    // Écouter les changements du profil utilisateur
    this.store.select(UserProfileState.selectStateUserProfile).subscribe((userProfile: UserProfileModel) => {
      if (userProfile) {
        this.applyUserPreferences(userProfile);
      } else {
        this.applyDefaultPreferences();
      }
    });
  }

  /**
   * Enregistre toutes les locales supportées
   */
  private registerAllLocales(): void {
    this.localeMap.forEach((localeData, code) => {
      try {
        registerLocaleData(localeData, code);
      } catch (error) {
        console.warn(`Erreur lors de l'enregistrement de la locale ${code}:`, error);
      }
    });
  }

  /**
   * Applique les préférences utilisateur
   */
  private applyUserPreferences(userProfile: UserProfileModel): void {
    const config = this.configService.getConfig();
    const language = userProfile.preferredLanguage || config.defaultLanguage;
    const currency = userProfile.preferredCurrency || config.defaultCurrency;
    const timezone = userProfile.timezone || config.defaultTimezone;
    const dateFormat = userProfile.dateFormat || 'DD/MM/YYYY';
    const numberFormat = userProfile.numberFormat || this.getNumberFormatForLanguage(language);

    const languageInfo = this.configService.getLanguageByCode(language);
    
    this.updateLocalizationState({
      currentLanguage: language,
      currentCurrency: currency,
      currentTimezone: timezone,
      dateFormat: dateFormat,
      numberFormat: numberFormat,
      isRTL: languageInfo?.rtl || false
    });
  }

  /**
   * Applique les préférences par défaut
   */
  private applyDefaultPreferences(): void {
    const config = this.configService.getConfig();
    
    this.updateLocalizationState({
      currentLanguage: config.defaultLanguage,
      currentCurrency: config.defaultCurrency,
      currentTimezone: config.defaultTimezone,
      dateFormat: 'DD/MM/YYYY',
      numberFormat: this.getNumberFormatForLanguage(config.defaultLanguage),
      isRTL: false
    });
  }

  /**
   * Met à jour l'état de localisation
   */
  private updateLocalizationState(state: LocalizationState): void {
    this.localizationState$.next(state);
    
    // Appliquer les changements au DOM si nécessaire
    this.applyRTLToDocument(state.isRTL);
  }

  /**
   * Applique la direction RTL au document
   */
  private applyRTLToDocument(isRTL: boolean): void {
    const htmlElement = document.documentElement;
    if (isRTL) {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.classList.add('rtl');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.classList.remove('rtl');
    }
  }

  /**
   * Obtient le format de nombre pour une langue donnée
   */
  private getNumberFormatForLanguage(language: string): string {
    const formatMap: { [key: string]: string } = {
      'fr': 'fr-FR',
      'en': 'en-US'
    };
    return formatMap[language] || 'fr-FR';
  }

  // API publique

  /**
   * Obtient l'état actuel de localisation
   */
  getLocalizationState(): Observable<LocalizationState> {
    return this.localizationState$.asObservable();
  }

  /**
   * Obtient l'état actuel de localisation (valeur synchrone)
   */
  getCurrentLocalizationState(): LocalizationState {
    return this.localizationState$.value;
  }

  /**
   * Change la langue actuelle
   */
  changeLanguage(languageCode: string): void {
    if (this.configService.isLanguageSupported(languageCode)) {
      const currentState = this.localizationState$.value;
      const languageInfo = this.configService.getLanguageByCode(languageCode);
      
      this.updateLocalizationState({
        ...currentState,
        currentLanguage: languageCode,
        numberFormat: this.getNumberFormatForLanguage(languageCode),
        isRTL: languageInfo?.rtl || false
      });
    }
  }

  /**
   * Change la devise actuelle
   */
  changeCurrency(currencyCode: string): void {
    if (this.configService.isCurrencySupported(currencyCode)) {
      const currentState = this.localizationState$.value;
      this.updateLocalizationState({
        ...currentState,
        currentCurrency: currencyCode
      });
    }
  }

  /**
   * Obtient les langues supportées
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return this.configService.getSupportedLanguages();
  }

  /**
   * Obtient les devises supportées
   */
  getSupportedCurrencies(): SupportedCurrency[] {
    return this.configService.getSupportedCurrencies();
  }

  /**
   * Obtient la langue actuelle
   */
  getCurrentLanguage(): string {
    return this.localizationState$.value.currentLanguage;
  }

  /**
   * Obtient la devise actuelle
   */
  getCurrentCurrency(): string {
    return this.localizationState$.value.currentCurrency;
  }

  /**
   * Vérifie si la langue actuelle est RTL
   */
  isCurrentLanguageRTL(): boolean {
    return this.localizationState$.value.isRTL;
  }
}
