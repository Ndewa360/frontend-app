import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

@Component({
  selector: 'app-landing-footer',
  templateUrl: './landing-footer.component.html',
  styleUrls: ['./landing-footer.component.scss']
})
export class LandingFooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentDate = new Date();
  currentLanguage = 'fr';
  supportedLanguages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
  isLanguageDropdownOpen = false;

  constructor(
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService
  ) { }

  ngOnInit(): void {
    this.currentLanguage = this.languageUrlService.getCurrentLanguage();
    
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.currentLanguage = event.lang;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleLanguageDropdown(): void {
    this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
  }

  changeLanguage(languageCode: string): void {
    if (languageCode !== this.currentLanguage) {
      this.languageUrlService.changeLanguage(languageCode);
      this.isLanguageDropdownOpen = false;
    }
  }

  getCurrentLanguageDisplay(): string {
    const language = this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
    return language ? `${language.flag} ${language.name}` : 'Français';
  }

  getCurrentLanguageFlag(): string {
    const language = this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
    return language ? language.flag : '🇫🇷';
  }

  getCurrentLanguageName(): string {
    const language = this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
    return language ? language.name : 'Français';
  }

  closeLanguageDropdown(): void {
    this.isLanguageDropdownOpen = false;
  }

  trackByLanguage(index: number, language: any): string {
    return language.code;
  }

}
