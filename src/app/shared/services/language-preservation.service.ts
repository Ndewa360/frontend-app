import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LanguagePreservationService {

  constructor(
    private translate: TranslateService,
    private router: Router
  ) {}

  /**
   * Préserve la langue actuelle dans le localStorage
   */
  preserveCurrentLanguage(): void {
    try {
      const currentLanguage = this.translate.currentLang || 'fr';
      localStorage.setItem('ndiye-preferred-language', currentLanguage);
    } catch (error) {
      console.warn('⚠️ Impossible de préserver la langue:', error);
    }
  }

  /**
   * Récupère la langue préservée du localStorage
   */
  getPreservedLanguage(): string | null {
    try {
      return localStorage.getItem('ndiye-preferred-language');
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer la langue préservée:', error);
      return null;
    }
  }

  /**
   * Obtient un message localisé avec fallback selon la langue spécifiée
   */
  getLocalizedMessage(key: string, languageCode?: string): string {
    const lang = languageCode || this.getCurrentOrPreservedLanguage();
    
    // Messages de fallback par langue
    const fallbackMessages: { [lang: string]: { [key: string]: string } } = {
      'fr': {
        'NOTIFICATIONS.SESSION_EXPIRED': 'Votre session a expiré. Veuillez vous reconnecter.',
        'NOTIFICATIONS.SERVER_ERROR': 'Erreur serveur. Veuillez réessayer.',
        'NOTIFICATIONS.NETWORK_ERROR': 'Erreur de connexion. Vérifiez votre réseau.',
        'COMMON.INFO': 'Information',
        'COMMON.ERROR': 'Erreur',
        'COMMON.WARNING': 'Attention'
      },
      'en': {
        'NOTIFICATIONS.SESSION_EXPIRED': 'Your session has expired. Please log in again.',
        'NOTIFICATIONS.SERVER_ERROR': 'Server error. Please try again.',
        'NOTIFICATIONS.NETWORK_ERROR': 'Connection error. Check your network.',
        'COMMON.INFO': 'Information',
        'COMMON.ERROR': 'Error',
        'COMMON.WARNING': 'Warning'
      },
      'es': {
        'NOTIFICATIONS.SESSION_EXPIRED': 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        'NOTIFICATIONS.SERVER_ERROR': 'Error del servidor. Por favor, inténtelo de nuevo.',
        'NOTIFICATIONS.NETWORK_ERROR': 'Error de conexión. Verifique su red.',
        'COMMON.INFO': 'Información',
        'COMMON.ERROR': 'Error',
        'COMMON.WARNING': 'Advertencia'
      }
    };

    // Essayer d'abord avec le service de traduction
    try {
      const translatedMessage = this.translate.instant(key);
      if (translatedMessage && translatedMessage !== key) {
        return translatedMessage;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la traduction:', error);
    }

    // Utiliser les messages de fallback
    const languageMessages = fallbackMessages[lang] || fallbackMessages['fr'];
    return languageMessages[key] || key;
  }

  /**
   * Nettoie la langue préservée du localStorage
   */
  clearPreservedLanguage(): void {
    try {
      localStorage.removeItem('ndiye-preferred-language');
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer la langue préservée:', error);
    }
  }

  /**
   * Obtient la langue actuelle ou préservée
   */
  getCurrentOrPreservedLanguage(): string {
    return this.translate.currentLang || this.getPreservedLanguage() || 'fr';
  }

  /**
   * Génère une URL avec la langue appropriée
   */
  buildUrlWithLanguage(path: string, language?: string): string {
    const lang = language || this.getCurrentOrPreservedLanguage();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${cleanPath}`;
  }

  /**
   * Redirige vers une URL avec la langue appropriée
   */
  navigateWithLanguage(path: string, queryParams?: any): void {
    const urlWithLang = this.buildUrlWithLanguage(path);
    this.router.navigate([urlWithLang], { queryParams });
  }

  /**
   * Redirige vers la page de connexion avec la langue appropriée
   */
  redirectToLogin(returnUrl?: string): void {
    const queryParams: any = {};
    if (returnUrl) {
      queryParams.returnUrl = encodeURIComponent(returnUrl);
    }
    this.navigateWithLanguage('/auth/signin', queryParams);
  }

  /**
   * Redirige vers la page d'accueil avec la langue appropriée
   */
  redirectToHome(): void {
    this.navigateWithLanguage('/app/dashboard');
  }
}