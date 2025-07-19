import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from './localization/translation.service';

@Injectable({
  providedIn: 'root'
})
export class SearchTranslationTestService {

  constructor(
    private translate: TranslateService,
    private translationService: TranslationService
  ) {}

  /**
   * Teste toutes les traductions du module de recherche
   */
  async testSearchTranslations(): Promise<void> {
    console.group('🔍 Test des traductions du module de recherche');
    
    // Tester les traductions de base
    this.testBasicSearchTranslations();
    
    // Tester les traductions des filtres
    this.testFilterTranslations();
    
    // Tester les traductions mobiles
    this.testMobileTranslations();
    
    // Tester les traductions des gammes de prix
    this.testPriceRangeTranslations();
    
    // Tester avec différentes langues
    await this.testMultiLanguageSearch();
    
    console.groupEnd();
  }

  /**
   * Teste les traductions de base de la recherche
   */
  private testBasicSearchTranslations(): void {
    console.group('📝 Traductions de base');
    
    const basicKeys = [
      'SEARCH.PLACEHOLDER',
      'SEARCH.MOBILE_PLACEHOLDER',
      'SEARCH.SEARCHING',
      'SEARCH.SEARCHING_SUBTITLE',
      'SEARCH.NO_RESULTS',
      'SEARCH.AVAILABLE',
      'SEARCH.PER_MONTH'
    ];

    basicKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions des filtres
   */
  private testFilterTranslations(): void {
    console.group('🔧 Traductions des filtres');
    
    const filterKeys = [
      'SEARCH.FILTERS',
      'SEARCH.LOCATION',
      'SEARCH.CITY',
      'SEARCH.ALL_CITIES',
      'SEARCH.SELECT_CITY',
      'SEARCH.BUDGET',
      'SEARCH.ROOM_TYPE',
      'SEARCH.AMENITIES',
      'SEARCH.SORT_BY'
    ];

    filterKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions des équipements
   */
  private testAmenitiesTranslations(): void {
    console.group('🏠 Traductions des équipements');
    
    const amenityKeys = [
      'SEARCH.WIFI',
      'SEARCH.AIR_CONDITIONER',
      'SEARCH.KITCHEN',
      'SEARCH.PARKING',
      'SEARCH.BALCONY',
      'SEARCH.SECURITY'
    ];

    amenityKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions mobiles
   */
  private testMobileTranslations(): void {
    console.group('📱 Traductions mobiles');
    
    const mobileKeys = [
      'SEARCH.MOBILE_PLACEHOLDER',
      'SEARCH.LOAD_MORE',
      'SEARCH.NO_MORE_RESULTS',
      'SEARCH.VIEW_GRID',
      'SEARCH.VIEW_LIST',
      'SEARCH.APPLY_FILTERS',
      'SEARCH.RESET_FILTERS'
    ];

    mobileKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions des gammes de prix
   */
  private testPriceRangeTranslations(): void {
    console.group('💰 Traductions des gammes de prix');
    
    const priceRangeKeys = [
      'SEARCH.PRICE_RANGES.UNDER_50K',
      'SEARCH.PRICE_RANGES.50K_100K',
      'SEARCH.PRICE_RANGES.100K_200K',
      'SEARCH.PRICE_RANGES.200K_300K',
      'SEARCH.PRICE_RANGES.OVER_300K'
    ];

    priceRangeKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions avec paramètres
   */
  private testParameterizedSearchTranslations(): void {
    console.group('🔧 Traductions avec paramètres');
    
    const testCases = [
      {
        key: 'SEARCH.RESULTS_FOUND',
        params: { count: 1 },
        expected: 'logement'
      },
      {
        key: 'SEARCH.RESULTS_FOUND',
        params: { count: 5 },
        expected: 'logements'
      }
    ];

    testCases.forEach(testCase => {
      const translation = this.translate.instant(testCase.key, testCase.params);
      const isValid = translation.includes(testCase.expected);
      console.log(`${isValid ? '✅' : '❌'} ${testCase.key} (${testCase.params.count}): "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions dans différentes langues
   */
  private async testMultiLanguageSearch(): Promise<void> {
    console.group('🌐 Test multi-langues');
    
    const languages = ['fr', 'en', 'es'];
    const testKey = 'SEARCH.SEARCHING';
    
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
   * Génère un rapport de diagnostic pour le module de recherche
   */
  generateSearchDiagnosticReport(): void {
    console.group('📊 Rapport de diagnostic - Module de recherche');
    
    const currentLang = this.translationService.getCurrentLanguage();
    console.log(`Langue actuelle: ${currentLang}`);
    
    // Tester les clés critiques pour la recherche
    const criticalSearchKeys = [
      'SEARCH.PLACEHOLDER',
      'SEARCH.MOBILE_PLACEHOLDER',
      'SEARCH.SEARCHING',
      'SEARCH.NO_RESULTS',
      'SEARCH.FILTERS',
      'SEARCH.AVAILABLE'
    ];
    
    console.log('\nClés critiques de recherche:');
    criticalSearchKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
      console.log(`- ${key}: ${status}`);
    });
    
    // Tester les équipements
    const amenityKeys = [
      'SEARCH.WIFI',
      'SEARCH.KITCHEN',
      'SEARCH.PARKING',
      'SEARCH.SECURITY'
    ];
    
    console.log('\nÉquipements:');
    amenityKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
      console.log(`- ${key}: ${status}`);
    });
    
    console.groupEnd();
  }

  /**
   * Teste les traductions des messages de fallback
   */
  private testFallbackTranslations(): void {
    console.group('⚠️ Messages de fallback');
    
    const fallbackKeys = [
      'SEARCH.FALLBACK_TITLE',
      'SEARCH.FALLBACK_MESSAGE',
      'SEARCH.RETRY_LOCATION'
    ];

    fallbackKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
      console.log(`${isTranslated ? '✅' : '❌'} ${key}: "${translation}"`);
    });
    
    console.groupEnd();
  }

  /**
   * Lance tous les tests de recherche
   */
  async runAllSearchTests(): Promise<void> {
    console.log('🚀 Lancement des tests de traduction - Module de recherche');
    console.log('='.repeat(60));
    
    await this.testSearchTranslations();
    this.testParameterizedSearchTranslations();
    this.testAmenitiesTranslations();
    this.testFallbackTranslations();
    this.generateSearchDiagnosticReport();
    
    console.log('='.repeat(60));
    console.log('✅ Tests du module de recherche terminés');
  }
}
