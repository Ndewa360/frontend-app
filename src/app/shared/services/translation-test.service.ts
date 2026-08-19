import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from './localization/translation.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationTestService {

  constructor(
    private translate: TranslateService,
    private translationService: TranslationService
  ) {}

  /**
   * Teste les traductions de base
   */
  testBasicTranslations(): void {
    const testKeys = [
      'COMMON.SAVE',
      'COMMON.CANCEL',
      'SEARCH.PLACEHOLDER',
      'FILTERS.PERIOD',
      'MODALS.TENANT.ADD_TITLE'
    ];

    testKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
    });
  }

  /**
   * Teste le changement de langue
   */
  async testLanguageChange(): Promise<void> {
    const languages = ['fr', 'en', 'es'];
    const testKey = 'COMMON.SAVE';
    
    for (const lang of languages) {
      this.translationService.changeLanguage(lang);
      
      // Attendre un peu pour que la traduction se charge
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const translation = this.translate.instant(testKey);
    }
  }

  /**
   * Teste les traductions avec paramètres
   */
  testParameterizedTranslations(): void {
    const testCases = [
      {
        key: 'SEARCH.RESULTS_COUNT',
        params: { count: 5 },
        expected: 'résultats'
      },
      {
        key: 'COMMON.DAYS_AGO',
        params: { count: 3 },
        expected: 'jours'
      }
    ];

    testCases.forEach(testCase => {
      const translation = this.translate.instant(testCase.key, testCase.params);
      const isValid = translation.includes(testCase.expected);
    });
  }

  /**
   * Teste la persistance des préférences
   */
  testLanguagePersistence(): void {
    // Tester localStorage
    const savedLang = localStorage.getItem('ndiye-preferred-language');
    
    // Tester les langues supportées
    const supportedLanguages = this.translationService.getSupportedLanguagesWithMetadata();
  }

  /**
   * Lance tous les tests
   */
  async runAllTests(): Promise<void> {
    this.testBasicTranslations();
    this.testParameterizedTranslations();
    this.testLanguagePersistence();
    await this.testLanguageChange();
  }

  /**
   * Affiche un rapport de diagnostic
   */
  generateDiagnosticReport(): void {
    const currentLang = this.translationService.getCurrentLanguage();
    const availableLangs = this.translate.getLangs();
    const defaultLang = this.translate.getDefaultLang();
    
    // Tester quelques clés critiques
    const criticalKeys = [
      'COMMON.SAVE',
      'COMMON.CANCEL',
      'SEARCH.PLACEHOLDER',
      'MODALS.TENANT.ADD_TITLE'
    ];
    
    criticalKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
    });
  }
}
