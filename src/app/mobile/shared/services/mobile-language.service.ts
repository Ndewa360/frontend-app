import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TranslationService } from '../../../shared/services/localization/translation.service';
import { MultilingualNotificationService } from '../../../shared/services/notification/multilingual-notification.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileLanguageService {

  private readonly currentLanguage$ = new BehaviorSubject<string>('fr');
  private readonly isInitialized$ = new BehaviorSubject<boolean>(false);

  constructor(
    private platform: Platform,
    private translationService: TranslationService,
    private notificationService: MultilingualNotificationService
  ) {
    this.initializeMobileLanguage();
  }

  /**
   * Initialise la langue pour mobile
   */
  private async initializeMobileLanguage(): Promise<void> {
    try {
      console.log('📱 Initialisation du service de langue mobile...');

      // Attendre que la plateforme soit prête
      await this.platform.ready();

      // Détecter la langue du système mobile
      const systemLanguage = await this.detectSystemLanguage();
      console.log('📱 Langue du système détectée:', systemLanguage);

      // Écouter les changements de langue du service principal
      this.translationService.getCurrentLanguage().subscribe(language => {
        if (language !== this.currentLanguage$.value) {
          this.currentLanguage$.next(language);
          console.log('📱 Langue mobile mise à jour:', language);
        }
      });

      // Initialiser avec la langue du système si supportée
      if (systemLanguage && this.translationService.isLanguageSupported(systemLanguage)) {
        this.translationService.changeLanguage(systemLanguage);
      }

      this.isInitialized$.next(true);
      console.log('✅ Service de langue mobile initialisé');

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la langue mobile:', error);
      this.isInitialized$.next(true); // Marquer comme initialisé même en cas d'erreur
    }
  }

  /**
   * Détecte la langue du système mobile
   */
  private async detectSystemLanguage(): Promise<string | null> {
    try {
      // Méthode 1: Utiliser Capacitor Device si disponible
      if (this.platform.is('capacitor')) {
        try {
          const { Device } = await import('@capacitor/device');
          const languageInfo = await Device.getLanguageCode();
          const languageCode = languageInfo.value?.substring(0, 2);
          
          if (languageCode) {
            console.log('📱 Langue détectée via Capacitor Device:', languageCode);
            return languageCode;
          }
        } catch (capacitorError) {
          console.warn('⚠️ Capacitor Device non disponible:', capacitorError);
        }
      }

      // Méthode 2: Utiliser Ionic Native Globalization si disponible
      if (this.platform.is('cordova')) {
        try {
          const { Globalization } = await import('@ionic-native/globalization/ngx');
          const globalization = new Globalization();
          const locale = await globalization.getPreferredLanguage();
          const languageCode = locale.value?.substring(0, 2);
          
          if (languageCode) {
            console.log('📱 Langue détectée via Globalization:', languageCode);
            return languageCode;
          }
        } catch (globalizationError) {
          console.warn('⚠️ Globalization non disponible:', globalizationError);
        }
      }

      // Méthode 3: Fallback sur navigator.language
      const browserLanguage = navigator.language?.substring(0, 2);
      if (browserLanguage) {
        console.log('📱 Langue détectée via navigator:', browserLanguage);
        return browserLanguage;
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur lors de la détection de la langue système:', error);
      return null;
    }
  }

  /**
   * Change la langue et sauvegarde la préférence
   */
  async changeLanguage(languageCode: string): Promise<void> {
    try {
      // Changer la langue via le service principal
      this.translationService.changeLanguage(languageCode);
      
      // Sauvegarder la préférence
      await this.translationService.saveLanguagePreference(languageCode);
      
      // Afficher une notification
      await this.notificationService.languageChanged(languageCode);
      
      console.log('📱 Langue mobile changée vers:', languageCode);

    } catch (error) {
      console.error('❌ Erreur lors du changement de langue mobile:', error);
      await this.notificationService.error('NOTIFICATIONS.LANGUAGE_CHANGE_ERROR');
    }
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
   * Vérifie si le service est initialisé
   */
  isInitialized(): Observable<boolean> {
    return this.isInitialized$.asObservable();
  }

  /**
   * Obtient les langues supportées
   */
  getSupportedLanguages() {
    return this.translationService.getSupportedLanguagesWithMetadata();
  }

  /**
   * Obtient le nom d'affichage d'une langue
   */
  getLanguageDisplayName(languageCode: string): string {
    return this.translationService.getLanguageDisplayName(languageCode);
  }

  /**
   * Réinitialise la langue vers celle du système
   */
  async resetToSystemLanguage(): Promise<void> {
    try {
      const systemLanguage = await this.detectSystemLanguage();
      
      if (systemLanguage && this.translationService.isLanguageSupported(systemLanguage)) {
        await this.changeLanguage(systemLanguage);
        console.log('📱 Langue réinitialisée vers celle du système:', systemLanguage);
      } else {
        // Fallback vers français
        await this.changeLanguage('fr');
        console.log('📱 Langue réinitialisée vers le français (fallback)');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation de la langue:', error);
      await this.changeLanguage('fr'); // Fallback sécurisé
    }
  }
}
