import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface TranslationValidationResult {
  language: string;
  missingKeys: string[];
  emptyValues: string[];
  totalKeys: number;
  completionPercentage: number;
  isValid: boolean;
}

export interface ValidationSummary {
  languages: TranslationValidationResult[];
  overallStatus: 'complete' | 'incomplete' | 'error';
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TranslationValidatorService {

  // Clés obligatoires pour le fonctionnement de base
  private readonly requiredKeys = [
    'COMMON.SAVE',
    'COMMON.CANCEL',
    'COMMON.DELETE',
    'COMMON.EDIT',
    'COMMON.ADD',
    'COMMON.LOADING',
    'COMMON.ERROR',
    'COMMON.SUCCESS',
    'NOTIFICATIONS.SUCCESS',
    'NOTIFICATIONS.ERROR',
    'MODALS.TENANT.ADD_TITLE',
    'MODALS.TENANT.EDIT_TITLE',
    'MODALS.PAYMENT.ADD_TITLE',
    'MODALS.PAYMENT.EDIT_TITLE'
  ];

  constructor(private translate: TranslateService) {}

  /**
   * Valide toutes les traductions pour toutes les langues
   */
  validateAllTranslations(): Observable<ValidationSummary> {
    const supportedLanguages = this.translate.getLangs();
    
    if (supportedLanguages.length === 0) {
      return of({
        languages: [],
        overallStatus: 'error',
        recommendations: ['Aucune langue configurée']
      });
    }

    const validations = supportedLanguages.map(lang => 
      this.validateLanguage(lang)
    );

    return forkJoin(validations).pipe(
      map(results => this.generateSummary(results)),
      catchError(error => {
        console.error('Erreur lors de la validation des traductions:', error);
        return of({
          languages: [],
          overallStatus: 'error',
          recommendations: ['Erreur lors de la validation']
        });
      })
    );
  }

  /**
   * Valide les traductions pour une langue spécifique
   */
  validateLanguage(language: string): Observable<TranslationValidationResult> {
    return new Observable(observer => {
      this.translate.getTranslation(language).subscribe({
        next: (translations) => {
          const result = this.analyzeTranslations(language, translations);
          observer.next(result);
          observer.complete();
        },
        error: (error) => {
          console.error(`Erreur lors du chargement des traductions pour ${language}:`, error);
          observer.next({
            language,
            missingKeys: [],
            emptyValues: [],
            totalKeys: 0,
            completionPercentage: 0,
            isValid: false
          });
          observer.complete();
        }
      });
    });
  }

  /**
   * Analyse les traductions d'une langue
   */
  private analyzeTranslations(language: string, translations: any): TranslationValidationResult {
    const allKeys = this.extractAllKeys(translations);
    const missingKeys: string[] = [];
    const emptyValues: string[] = [];

    // Vérifier les clés obligatoires
    this.requiredKeys.forEach(key => {
      const value = this.getNestedValue(translations, key);
      if (value === undefined || value === null) {
        missingKeys.push(key);
      } else if (typeof value === 'string' && value.trim() === '') {
        emptyValues.push(key);
      }
    });

    // Vérifier toutes les clés pour les valeurs vides
    allKeys.forEach(key => {
      const value = this.getNestedValue(translations, key);
      if (typeof value === 'string' && value.trim() === '') {
        if (!emptyValues.includes(key)) {
          emptyValues.push(key);
        }
      }
    });

    const totalKeys = allKeys.length;
    const validKeys = totalKeys - missingKeys.length - emptyValues.length;
    const completionPercentage = totalKeys > 0 ? Math.round((validKeys / totalKeys) * 100) : 0;

    return {
      language,
      missingKeys,
      emptyValues,
      totalKeys,
      completionPercentage,
      isValid: missingKeys.length === 0 && emptyValues.length === 0
    };
  }

  /**
   * Extrait toutes les clés d'un objet de traduction
   */
  private extractAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...this.extractAllKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
    }
    
    return keys;
  }

  /**
   * Obtient une valeur imbriquée dans un objet
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Génère un résumé de validation
   */
  private generateSummary(results: TranslationValidationResult[]): ValidationSummary {
    const recommendations: string[] = [];
    let overallStatus: 'complete' | 'incomplete' | 'error' = 'complete';

    // Analyser les résultats
    const incompleteLanguages = results.filter(r => !r.isValid);
    
    if (incompleteLanguages.length > 0) {
      overallStatus = 'incomplete';
      
      incompleteLanguages.forEach(lang => {
        if (lang.missingKeys.length > 0) {
          recommendations.push(
            `${lang.language}: ${lang.missingKeys.length} clés manquantes`
          );
        }
        if (lang.emptyValues.length > 0) {
          recommendations.push(
            `${lang.language}: ${lang.emptyValues.length} valeurs vides`
          );
        }
      });
    }

    // Recommandations générales
    const avgCompletion = results.reduce((sum, r) => sum + r.completionPercentage, 0) / results.length;
    
    if (avgCompletion < 90) {
      recommendations.push('Complétion moyenne faible, révision recommandée');
    }

    if (results.length < 2) {
      recommendations.push('Ajouter plus de langues pour une meilleure internationalisation');
    }

    return {
      languages: results,
      overallStatus,
      recommendations
    };
  }

  /**
   * Génère un rapport détaillé
   */
  generateReport(): Observable<string> {
    return this.validateAllTranslations().pipe(
      map(summary => {
        let report = '🌍 RAPPORT DE VALIDATION DES TRADUCTIONS\n';
        report += '='.repeat(50) + '\n\n';
        
        report += `📊 Statut général: ${this.getStatusEmoji(summary.overallStatus)} ${summary.overallStatus.toUpperCase()}\n\n`;
        
        // Détails par langue
        summary.languages.forEach(lang => {
          report += `🏳️ ${lang.language.toUpperCase()}\n`;
          report += `   Complétion: ${lang.completionPercentage}%\n`;
          report += `   Total clés: ${lang.totalKeys}\n`;
          report += `   Clés manquantes: ${lang.missingKeys.length}\n`;
          report += `   Valeurs vides: ${lang.emptyValues.length}\n`;
          report += `   Statut: ${lang.isValid ? '✅ Valide' : '❌ Invalide'}\n\n`;
        });
        
        // Recommandations
        if (summary.recommendations.length > 0) {
          report += '💡 RECOMMANDATIONS\n';
          report += '-'.repeat(20) + '\n';
          summary.recommendations.forEach(rec => {
            report += `• ${rec}\n`;
          });
        }
        
        return report;
      })
    );
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'complete': return '✅';
      case 'incomplete': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  }
}
