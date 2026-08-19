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

  async testSearchTranslations(): Promise<void> {
    this.testBasicSearchTranslations();
    this.testFilterTranslations();
    this.testMobileTranslations();
    this.testPriceRangeTranslations();
    await this.testMultiLanguageSearch();
  }

  private testBasicSearchTranslations(): void {
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
    });
  }

  private testFilterTranslations(): void {
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
    });
  }

  private testAmenitiesTranslations(): void {
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
    });
  }

  private testMobileTranslations(): void {
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
    });
  }

  private testPriceRangeTranslations(): void {
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
    });
  }

  private testParameterizedSearchTranslations(): void {
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
    });
  }

  private async testMultiLanguageSearch(): Promise<void> {
    const languages = ['fr', 'en', 'es'];
    const testKey = 'SEARCH.SEARCHING';
    
    for (const lang of languages) {
      this.translationService.changeLanguage(lang);
      
      // Attendre un peu pour que la traduction se charge
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const translation = this.translate.instant(testKey);
    }
  }

  generateSearchDiagnosticReport(): void {
    const currentLang = this.translationService.getCurrentLanguage();
    
    const criticalSearchKeys = [
      'SEARCH.PLACEHOLDER',
      'SEARCH.MOBILE_PLACEHOLDER',
      'SEARCH.SEARCHING',
      'SEARCH.NO_RESULTS',
      'SEARCH.FILTERS',
      'SEARCH.AVAILABLE'
    ];
    
    criticalSearchKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
    });
    
    const amenityKeys = [
      'SEARCH.WIFI',
      'SEARCH.KITCHEN',
      'SEARCH.PARKING',
      'SEARCH.SECURITY'
    ];
    
    amenityKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const status = translation !== key ? '✅ OK' : '❌ MANQUANTE';
    });
  }

  private testFallbackTranslations(): void {
    const fallbackKeys = [
      'SEARCH.FALLBACK_TITLE',
      'SEARCH.FALLBACK_MESSAGE',
      'SEARCH.RETRY_LOCATION'
    ];

    fallbackKeys.forEach(key => {
      const translation = this.translate.instant(key);
      const isTranslated = translation !== key;
    });
  }

  async runAllSearchTests(): Promise<void> {
    await this.testSearchTranslations();
    this.testParameterizedSearchTranslations();
    this.testAmenitiesTranslations();
    this.testFallbackTranslations();
    this.generateSearchDiagnosticReport();
  }
}
