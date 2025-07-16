import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FilterField {
  name: string;
  value: any;
  defaultValue: any;
  isModified: boolean;
  isActive: boolean;
}

export interface SmartFilters {
  [key: string]: FilterField;
}

@Injectable({
  providedIn: 'root'
})
export class SmartFiltersService {
  private filtersSubject = new BehaviorSubject<SmartFilters>({});
  public filters$ = this.filtersSubject.asObservable();

  private modifiedFields = new Set<string>();

  constructor() {}

  /**
   * Initialiser les filtres avec leurs valeurs par défaut
   */
  initializeFilters(defaultFilters: { [key: string]: any }): void {
    const smartFilters: SmartFilters = {};

    Object.keys(defaultFilters).forEach(key => {
      smartFilters[key] = {
        name: key,
        value: defaultFilters[key],
        defaultValue: defaultFilters[key],
        isModified: false,
        isActive: false
      };
    });

    this.filtersSubject.next(smartFilters);
    this.modifiedFields.clear();
    console.log('🔧 Filtres intelligents initialisés:', smartFilters);
  }

  /**
   * Mettre à jour la valeur d'un filtre
   */
  updateFilter(fieldName: string, value: any): void {
    const currentFilters = this.filtersSubject.value;
    
    if (currentFilters[fieldName]) {
      const filter = currentFilters[fieldName];
      const isModified = !this.isValueEqual(value, filter.defaultValue);
      const isActive = this.isValueActive(value);

      // Marquer le champ comme modifié si la valeur a changé
      if (isModified) {
        this.modifiedFields.add(fieldName);
      } else {
        this.modifiedFields.delete(fieldName);
      }

      const updatedFilter: FilterField = {
        ...filter,
        value: value,
        isModified: isModified,
        isActive: isActive
      };

      const updatedFilters = {
        ...currentFilters,
        [fieldName]: updatedFilter
      };

      this.filtersSubject.next(updatedFilters);
      console.log(`🔧 Filtre mis à jour: ${fieldName} =`, value, `(modifié: ${isModified}, actif: ${isActive})`);
    }
  }

  /**
   * Obtenir uniquement les filtres modifiés et actifs
   */
  getActiveFilters(): { [key: string]: any } {
    const currentFilters = this.filtersSubject.value;
    const activeFilters: { [key: string]: any } = {};

    Object.keys(currentFilters).forEach(key => {
      const filter = currentFilters[key];
      
      // Inclure seulement les filtres modifiés ET actifs
      // OU la ville par défaut si aucun autre filtre n'est modifié
      if (filter.isModified && filter.isActive) {
        activeFilters[key] = filter.value;
      } else if (key === 'city' && this.modifiedFields.size === 0 && filter.isActive) {
        // Cas spécial : ville par défaut si aucun autre filtre n'est modifié
        activeFilters[key] = filter.value;
      }
    });

    console.log('🎯 Filtres actifs:', activeFilters);
    console.log('📝 Champs modifiés:', Array.from(this.modifiedFields));
    
    return activeFilters;
  }

  /**
   * Obtenir tous les filtres (pour l'affichage du formulaire)
   */
  getAllFilters(): { [key: string]: any } {
    const currentFilters = this.filtersSubject.value;
    const allFilters: { [key: string]: any } = {};

    Object.keys(currentFilters).forEach(key => {
      allFilters[key] = currentFilters[key].value;
    });

    return allFilters;
  }

  /**
   * Réinitialiser tous les filtres
   */
  resetFilters(): void {
    const currentFilters = this.filtersSubject.value;
    const resetFilters: SmartFilters = {};

    Object.keys(currentFilters).forEach(key => {
      const filter = currentFilters[key];
      resetFilters[key] = {
        ...filter,
        value: filter.defaultValue,
        isModified: false,
        isActive: this.isValueActive(filter.defaultValue)
      };
    });

    this.filtersSubject.next(resetFilters);
    this.modifiedFields.clear();
    console.log('🔄 Filtres réinitialisés');
  }

  /**
   * Réinitialiser un filtre spécifique
   */
  resetFilter(fieldName: string): void {
    const currentFilters = this.filtersSubject.value;
    
    if (currentFilters[fieldName]) {
      const filter = currentFilters[fieldName];
      const updatedFilter: FilterField = {
        ...filter,
        value: filter.defaultValue,
        isModified: false,
        isActive: this.isValueActive(filter.defaultValue)
      };

      const updatedFilters = {
        ...currentFilters,
        [fieldName]: updatedFilter
      };

      this.filtersSubject.next(updatedFilters);
      this.modifiedFields.delete(fieldName);
      console.log(`🔄 Filtre réinitialisé: ${fieldName}`);
    }
  }

  /**
   * Vérifier si une valeur est considérée comme active
   */
  private isValueActive(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && value === 0) return false;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /**
   * Comparer deux valeurs pour détecter les modifications
   */
  private isValueEqual(value1: any, value2: any): boolean {
    if (value1 === value2) return true;
    
    // Cas spéciaux pour les chaînes vides et null/undefined
    if ((value1 === '' || value1 === null || value1 === undefined) &&
        (value2 === '' || value2 === null || value2 === undefined)) {
      return true;
    }
    
    // Cas spéciaux pour les nombres
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return value1 === value2;
    }
    
    // Cas spéciaux pour les tableaux
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }
    
    return false;
  }

  /**
   * Obtenir le nombre de filtres modifiés
   */
  getModifiedFiltersCount(): number {
    return this.modifiedFields.size;
  }

  /**
   * Vérifier si des filtres ont été modifiés
   */
  hasModifiedFilters(): boolean {
    return this.modifiedFields.size > 0;
  }

  /**
   * Obtenir la liste des champs modifiés
   */
  getModifiedFields(): string[] {
    return Array.from(this.modifiedFields);
  }

  /**
   * Marquer un champ comme modifié manuellement
   */
  markFieldAsModified(fieldName: string): void {
    this.modifiedFields.add(fieldName);
    
    const currentFilters = this.filtersSubject.value;
    if (currentFilters[fieldName]) {
      const updatedFilter = {
        ...currentFilters[fieldName],
        isModified: true
      };
      
      const updatedFilters = {
        ...currentFilters,
        [fieldName]: updatedFilter
      };
      
      this.filtersSubject.next(updatedFilters);
    }
  }

  /**
   * Charger les filtres depuis l'URL
   */
  loadFiltersFromUrl(urlParams: { [key: string]: any }): void {
    const currentFilters = this.filtersSubject.value;
    
    Object.keys(urlParams).forEach(key => {
      if (currentFilters[key] && urlParams[key] !== null && urlParams[key] !== undefined) {
        this.updateFilter(key, urlParams[key]);
        this.markFieldAsModified(key);
      }
    });
    
    console.log('🔗 Filtres chargés depuis l\'URL:', urlParams);
  }
}
