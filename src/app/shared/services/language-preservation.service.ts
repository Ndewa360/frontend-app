import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LanguagePreservationService {

  constructor(
    private translate: TranslateService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  preserveCurrentLanguage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const currentLanguage = this.translate.currentLang || 'fr';
      localStorage.setItem('ndiye-preferred-language', currentLanguage);
    } catch (error) {}
  }

  getPreservedLanguage(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem('ndiye-preferred-language');
    } catch (error) {
      return null;
    }
  }

  getLocalizedMessage(key: string, languageCode?: string): string {
    const lang = languageCode || this.getCurrentOrPreservedLanguage();
    const fallbackMessages: { [lang: string]: { [key: string]: string } } = {
      'fr': {
        'NOTIFICATIONS.SESSION_EXPIRED': 'Votre session a expiré. Veuillez vous reconnecter.',
        'NOTIFICATIONS.SERVER_ERROR': 'Erreur serveur. Veuillez réessayer.',
        'NOTIFICATIONS.NETWORK_ERROR': 'Erreur de connexion. Vérifiez votre réseau.',
        'NOTIFICATIONS.AUTH_REQUIRED': 'Veuillez vous connecter pour accéder à cette page.',
        'COMMON.INFO': 'Information',
        'COMMON.ERROR': 'Erreur',
        'COMMON.WARNING': 'Attention'
      },
      'en': {
        'NOTIFICATIONS.SESSION_EXPIRED': 'Your session has expired. Please log in again.',
        'NOTIFICATIONS.SERVER_ERROR': 'Server error. Please try again.',
        'NOTIFICATIONS.NETWORK_ERROR': 'Connection error. Check your network.',
        'NOTIFICATIONS.AUTH_REQUIRED': 'Please log in to access this page.',
        'COMMON.INFO': 'Information',
        'COMMON.ERROR': 'Error',
        'COMMON.WARNING': 'Warning'
      }
    };

    try {
      const translatedMessage = this.translate.instant(key);
      if (translatedMessage && translatedMessage !== key) {
        return translatedMessage;
      }
    } catch (error) {}

    const languageMessages = fallbackMessages[lang] || fallbackMessages['fr'];
    return languageMessages[key] || key;
  }

  clearPreservedLanguage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.removeItem('ndiye-preferred-language');
    } catch (error) {}
  }

  getCurrentOrPreservedLanguage(): string {
    return this.translate.currentLang || this.getPreservedLanguage() || 'fr';
  }

  buildUrlWithLanguage(path: string, language?: string): string {
    const lang = language || this.getCurrentOrPreservedLanguage();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${lang}${cleanPath}`;
  }

  navigateWithLanguage(path: string, queryParams?: any): void {
    const urlWithLang = this.buildUrlWithLanguage(path);
    this.router.navigate([urlWithLang], { queryParams });
  }

  redirectToLogin(returnUrl?: string): void {
    const queryParams: any = {};
    if (returnUrl) {
      queryParams.returnUrl = encodeURIComponent(returnUrl);
    }
    this.navigateWithLanguage('/auth/signin', queryParams);
  }

  redirectToHome(): void {
    this.navigateWithLanguage('/app/dashboard');
  }
}
