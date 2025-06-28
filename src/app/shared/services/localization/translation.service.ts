import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { LocalizationService } from './localization.service';
import { Store } from '@ngxs/store';
import { UserProfileAction } from '../../store/user-profile/user-profile.actions';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private readonly currentLanguage$ = new BehaviorSubject<string>('fr');

  constructor(
    private translateService: TranslateService,
    private localizationService: LocalizationService,
    private store: Store
  ) {
    this.initializeTranslation();
  }

  /**
   * Initialise le service de traduction
   */
  private initializeTranslation(): void {
    // Configurer les langues disponibles
    const supportedLanguages = this.localizationService.getSupportedLanguages();
    const languageCodes = supportedLanguages.map(lang => lang.code);
    
    this.translateService.addLangs(languageCodes);
    this.translateService.setDefaultLang('fr');

    // Écouter les changements de localisation
    this.localizationService.getLocalizationState().subscribe(state => {
      if (state.currentLanguage !== this.currentLanguage$.value) {
        this.changeLanguage(state.currentLanguage);
      }
    });

    // Initialiser avec la langue actuelle
    const currentLanguage = this.localizationService.getCurrentLanguage();
    this.changeLanguage(currentLanguage);
  }

  /**
   * Change la langue de l'application
   */
  changeLanguage(languageCode: string): void {
    if (this.translateService.getLangs().includes(languageCode)) {
      this.translateService.use(languageCode).subscribe({
        next: () => {
          this.currentLanguage$.next(languageCode);
          console.log(`Langue changée vers: ${languageCode}`);
        },
        error: (error) => {
          console.error(`Erreur lors du changement de langue vers ${languageCode}:`, error);
        }
      });
    } else {
      console.warn(`Langue non supportée: ${languageCode}`);
    }
  }

  /**
   * Obtient la traduction d'une clé
   */
  translate(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  /**
   * Obtient la traduction instantanée d'une clé
   */
  instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Obtient la traduction de plusieurs clés
   */
  translateMultiple(keys: string[], params?: any): Observable<any> {
    return this.translateService.get(keys, params);
  }

  /**
   * Obtient la langue actuelle
   */
  getCurrentLanguage(): Observable<string> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Obtient la langue actuelle (valeur synchrone)
   */
  getCurrentLanguageValue(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Vérifie si une langue est supportée
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.translateService.getLangs().includes(languageCode);
  }

  /**
   * Obtient toutes les langues supportées
   */
  getSupportedLanguages(): string[] {
    return this.translateService.getLangs();
  }

  /**
   * Sauvegarde les préférences de langue de l'utilisateur
   */
  saveUserLanguagePreference(languageCode: string): void {
    // Mettre à jour le service de localisation
    this.localizationService.changeLanguage(languageCode);
    
    // Sauvegarder en base de données via le store
    // Note: Ceci nécessitera une action pour mettre à jour les préférences utilisateur
    this.store.dispatch(new UserProfileAction.UpdateUserLanguagePreference(languageCode));
  }

  /**
   * Formate un nombre selon la locale actuelle
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const localizationState = this.localizationService.getCurrentLocalizationState();
    return new Intl.NumberFormat(localizationState.numberFormat, options).format(value);
  }

  /**
   * Formate une devise selon la locale actuelle
   */
  formatCurrency(value: number, currencyCode?: string): string {
    const localizationState = this.localizationService.getCurrentLocalizationState();
    const currency = currencyCode || localizationState.currentCurrency;
    
    return new Intl.NumberFormat(localizationState.numberFormat, {
      style: 'currency',
      currency: currency
    }).format(value);
  }

  /**
   * Formate une date selon la locale actuelle
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const localizationState = this.localizationService.getCurrentLocalizationState();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(localizationState.numberFormat, {
      timeZone: localizationState.currentTimezone,
      ...options
    }).format(dateObj);
  }

  /**
   * Formate une date relative (il y a X jours, etc.)
   */
  formatRelativeDate(date: Date | string): string {
    const localizationState = this.localizationService.getCurrentLocalizationState();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return this.instant('COMMON.TODAY');
    } else if (diffInDays === 1) {
      return this.instant('COMMON.YESTERDAY');
    } else if (diffInDays < 7) {
      return this.instant('COMMON.DAYS_AGO', { count: diffInDays });
    } else {
      return this.formatDate(dateObj, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
}
