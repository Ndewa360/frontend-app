import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { LocalizationService } from './localization.service';
import { Store, Select } from '@ngxs/store';
import { UserProfileAction } from '../../store/user-profile/user-profile.actions';
import { UserProfileState } from '../../store/user-profile/user-profile.state';
import { LanguagePreservationService } from '../language-preservation.service';

import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private readonly currentLanguage$ = new BehaviorSubject<string>('fr');
  private readonly supportedLanguages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' }
  ];

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<any>;
  private userProfile: any;

  constructor(
    private translateService: TranslateService,
    private localizationService: LocalizationService,
    private store: Store,
    private languagePreservation: LanguagePreservationService
  ) {
    this.initializeTranslation();
  }

  /**
   * Initialise le service de traduction
   */
  private async initializeTranslation(): Promise<void> {
    // Configurer les langues disponibles
    const languageCodes = this.supportedLanguages.map(lang => lang.code);

    this.translateService.addLangs(languageCodes);
    this.translateService.setDefaultLang('fr');

    // Déterminer la langue initiale
    const initialLanguage = await this.determineInitialLanguage();

    // Écouter les changements de profil utilisateur
    this.userProfile$.subscribe(profile => {
      if (profile?.preferredLanguage && profile.preferredLanguage !== this.currentLanguage$.value) {
        this.changeLanguage(profile.preferredLanguage);
      }
      this.userProfile = profile;
    });

    // Écouter les changements de localisation
    this.localizationService.getLocalizationState().subscribe(state => {
      if (state.currentLanguage !== this.currentLanguage$.value) {
        this.changeLanguage(state.currentLanguage);
      }
    });

    // Initialiser avec la langue déterminée
    this.changeLanguage(initialLanguage);
  }

  /**
   * Détermine la langue initiale selon la plateforme
   */
  private async determineInitialLanguage(): Promise<string> {
    try {
      // 1. Vérifier si l'utilisateur a une préférence dans son profil (utilisateur connecté)
      const userProfile = await this.userProfile$.pipe(take(1)).toPromise();
      if (userProfile?.preferredLanguage && this.isLanguageSupported(userProfile.preferredLanguage)) {
        return userProfile.preferredLanguage;
      }

      // 2. Vérifier la langue préservée (après déconnexion)
      const preservedLanguage = this.languagePreservation.getPreservedLanguage();
      if (preservedLanguage && this.isLanguageSupported(preservedLanguage)) {
        return preservedLanguage;
      }

      // 3. Vérifier le localStorage (utilisateur non connecté avec préférence sauvegardée)
      const savedLanguage = this.getLanguageFromLocalStorage();
      if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
        return savedLanguage;
      }

      // 4. Utiliser la langue du navigateur
      const browserLanguage = this.getBrowserLanguage();
      if (browserLanguage && this.isLanguageSupported(browserLanguage)) {
        return browserLanguage;
      }

      // 5. Fallback : français par défaut
      return 'fr';

    } catch (error) {
      // Log error without exposing sensitive information
      console.error('Erreur lors de la détermination de la langue');
      return 'fr';
    }
  }



  /**
   * Obtient la langue du navigateur
   */
  private getBrowserLanguage(): string | null {
    return navigator.language?.substring(0, 2) || null;
  }

  /**
   * Vérifie si une langue est supportée
   */
  private isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  /**
   * Change la langue de l'application
   */
  changeLanguage(languageCode: string): void {
    if (!languageCode || !this.isLanguageSupported(languageCode)) {
      console.warn('Langue non supportée');
      return;
    }

    if (this.translateService.getLangs().includes(languageCode)) {
      this.translateService.use(languageCode).subscribe({
        next: () => {
          this.currentLanguage$.next(languageCode);
          this.saveLanguageToLocalStorage(languageCode);
          this.saveLanguagePreference(languageCode);
        },
        error: () => {
          console.error('Erreur lors du changement de langue');
        }
      });
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

  /**
   * Obtient les langues supportées avec leurs métadonnées
   */
  getSupportedLanguagesWithMetadata() {
    return this.supportedLanguages;
  }

  /**
   * Sauvegarde la préférence de langue dans le localStorage
   */
  private saveLanguageToLocalStorage(languageCode: string): void {
    try {
      if (languageCode && this.isLanguageSupported(languageCode)) {
        localStorage.setItem('ndiye-preferred-language', languageCode);
      }
    } catch (error) {
      console.warn('Impossible de sauvegarder dans localStorage');
    }
  }

  /**
   * Récupère la préférence de langue du localStorage
   */
  private getLanguageFromLocalStorage(): string | null {
    try {
      return localStorage.getItem('ndiye-preferred-language');
    } catch (error) {
      console.warn('Impossible de lire localStorage');
      return null;
    }
  }

  /**
   * Sauvegarde la préférence de langue dans le profil utilisateur (seulement si connecté)
   */
  private async saveLanguagePreference(languageCode: string): Promise<void> {
    try {
      if (this.userProfile && this.userProfile._id && languageCode && this.isLanguageSupported(languageCode)) {
        this.store.dispatch(new UserProfileAction.UpdateUserProfile({
          preferredLanguage: languageCode
        }, this.userProfile._id));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence de langue');
    }
  }

  /**
   * Obtient la langue formatée pour l'affichage
   */
  getLanguageDisplayName(languageCode: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === languageCode);
    return language ? `${language.flag} ${language.name}` : languageCode;
  }

  /**
   * Détecte si l'utilisateur est sur mobile (basé sur l'user agent)
   */
  isMobilePlatform(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Détecte si l'utilisateur est sur desktop
   */
  isDesktopPlatform(): boolean {
    return !this.isMobilePlatform();
  }
}
