import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LanguageUrlService {
  private supportedLanguages = ['en', 'fr'];
  private defaultLanguage = 'fr';
  private currentLanguage = 'fr';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.initializeLanguageFromUrl();
  }

  private initializeLanguageFromUrl(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const urlSegments = this.router.url.split('/');
        const langFromUrl = urlSegments[1];
        
        if (this.supportedLanguages.includes(langFromUrl)) {
          this.setLanguage(langFromUrl);
        } else {
          // Utiliser la langue préservée ou par défaut si pas de langue dans l'URL
          const currentPath = this.router.url;
          if (!currentPath.startsWith('/en') && !currentPath.startsWith('/fr')) {
            const preferredLang = this.getPreferredLanguage();
            this.router.navigate([`/${preferredLang}${currentPath}`]);
          }
        }
      });
  }

  setLanguage(lang: string): void {
    if (this.supportedLanguages.includes(lang)) {
      this.currentLanguage = lang;
      this.translate.use(lang);
      localStorage.setItem('selectedLanguage', lang);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  changeLanguage(newLang: string): void {
    if (this.supportedLanguages.includes(newLang) && newLang !== this.currentLanguage) {
      const currentUrl = this.router.url;
      const urlWithoutLang = currentUrl.replace(`/${this.currentLanguage}`, '');
      this.router.navigate([`/${newLang}${urlWithoutLang}`]);
    }
  }

  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Obtient la langue préférée (préservée ou par défaut)
   */
  private getPreferredLanguage(): string {
    try {
      const preservedLang = localStorage.getItem('ndiye-preferred-language');
      if (preservedLang && this.supportedLanguages.includes(preservedLang)) {
        return preservedLang;
      }
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer la langue préservée:', error);
    }
    return this.defaultLanguage;
  }
}