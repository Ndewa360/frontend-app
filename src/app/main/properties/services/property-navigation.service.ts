import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

@Injectable({
  providedIn: 'root'
})
export class PropertyNavigationService {
  private loadingProperties = new Set<string>();
  private loadingSubject = new BehaviorSubject<Set<string>>(new Set());
  
  // Observable pour les composants qui veulent écouter l'état de chargement
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private router: Router,
    private languageUrlService: LanguageUrlService
  ) {}

  /**
   * Vérifie si une propriété est en cours de chargement
   */
  isPropertyLoading(propertyId: string): boolean {
    return this.loadingProperties.has(propertyId);
  }

  /**
   * Vérifie si au moins une propriété est en cours de chargement
   */
  isAnyPropertyLoading(): boolean {
    return this.loadingProperties.size > 0;
  }

  /**
   * Navigue vers les détails d'une propriété avec protection contre les clics multiples
   */
  navigateToPropertyDetails(propertyId: string): Promise<boolean> {
    if (!propertyId) return Promise.resolve(false);
    if (this.isPropertyLoading(propertyId)) return Promise.resolve(false);

    this.setPropertyLoading(propertyId, true);
    const currentLang = this.languageUrlService.getCurrentLanguage();
    return this.router.navigate([`/${currentLang}/app/properties/details`, propertyId])
      .then((success) => {
        if (success) {
          setTimeout(() => this.setPropertyLoading(propertyId, false), 1000);
        } else {
          this.setPropertyLoading(propertyId, false);
        }
        return success;
      })
      .catch(() => {
        this.setPropertyLoading(propertyId, false);
        return false;
      });
  }

  /**
   * Marque une propriété comme en cours de chargement ou non
   */
  private setPropertyLoading(propertyId: string, loading: boolean): void {
    if (loading) {
      this.loadingProperties.add(propertyId);
    } else {
      this.loadingProperties.delete(propertyId);
    }
    
    // Émettre le nouvel état
    this.loadingSubject.next(new Set(this.loadingProperties));
  }

  /**
   * Réinitialise tous les états de chargement
   */
  clearAllLoading(): void {
    this.loadingProperties.clear();
    this.loadingSubject.next(new Set());
  }

  /**
   * Obtient la liste des propriétés en cours de chargement
   */
  getLoadingProperties(): string[] {
    return Array.from(this.loadingProperties);
  }
}
