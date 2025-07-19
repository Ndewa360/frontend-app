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
    console.group('🧪 Test des traductions de base');
    
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
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste le changement de langue
   */
  async testLanguageChange(): Promise<void> {
    console.group('🌐 Test du changement de langue');
    
    const languages = ['fr', 'en', 'es'];
    const testKey = 'COMMON.SAVE';
    
    for (const lang of languages) {
      this.translationService.changeLanguage(lang);
      
      // Attendre un peu pour que la traduction se charge
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const translation = this.translate.instant(testKey);
      console.log(`${lang.toUpperCase()}: "${translation}"`);
    }
    
    console.groupEnd();
  }

  /**
   * Teste les traductions avec paramètres
   */
  testParameterizedTranslations(): void {
    console.group('🔧 Test des traductions avec paramètres');
    
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
      console.log(`${isValid ? '✅' : '❌'} ${testCase.key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste la persistance des préférences
   */
  testLanguagePersistence(): void {
    console.group('💾 Test de la persistance des langues');
    
    // Tester localStorage
    const savedLang = localStorage.getItem('ndiye-preferred-language');
    console.log(`Langue sauvegardée: ${savedLang || 'Aucune'}`);
    
    // Tester les langues supportées
    const supportedLanguages = this.translationService.getSupportedLanguagesWithMetadata();
    console.log('Langues supportées:', supportedLanguages.map(l => l.code));
    
    console.groupEnd();
  }

  /**
   * Lance tous les tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Lancement des tests de traduction...');
    console.log('='.repeat(50));
    
    this.testBasicTranslations();
    this.testParameterizedTranslations();
    this.testLanguagePersistence();
    await this.testLanguageChange();
    
    console.log('='.repeat(50));
    console.log('✅ Tests de traduction terminés');
  }

  /**
   * Affiche un rapport de diagnostic
   */
  generateDiagnosticReport(): void {
    console.group('📊 Rapport de diagnostic des traductions');
    
    const currentLang = this.translationService.getCurrentLanguage();
    const availableLangs = this.translate.getLangs();
    const defaultLang = this.translate.getDefaultLang();
    
    console.log('Configuration actuelle:');
    console.log(`- Langue actuelle: ${currentLang}`);
    console.log(`- Langue par défaut: ${defaultLang}`);
    console.log(`- Langues disponibles: ${availableLangs.join(', ')}`);
    
    // Tester quelques clés critiques
    const criticalKeys = [
      'COMMON.SAVE',
      'COMMON.CANCEL',
      'SEARCH.PLACEHOLDER',
      'MODALS.TENANT.ADD_TITLE'
    ];
    
    console.log('\nClés critiques:');
    criticalKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
      console.log(`- ${key}: ${status}`);
    });
    
    console.groupEnd();
  }
}
