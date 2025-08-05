import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyNavigationService {
  private loadingProperties = new Set<string>();
  private loadingSubject = new BehaviorSubject<Set<string>>(new Set());
  
  // Observable pour les composants qui veulent écouter l'état de chargement
  public loading$ = this.loadingSubject.asObservable();

  constructor(private router: Router) {}

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
    // Vérifier si cette propriété est déjà en cours de chargement
    if (this.isPropertyLoading(propertyId)) {
      console.log(`⏳ Navigation vers ${propertyId} déjà en cours, ignorée`);
      return Promise.resolve(false);
    }

    // Marquer comme en cours de chargement
    this.setPropertyLoading(propertyId, true);
    console.log(`🚀 Navigation vers les détails de la propriété ${propertyId}`);

    // Naviguer vers la page de détails
    return this.router.navigate(['/app/properties/details', propertyId])
      .then((success) => {
        if (success) {
          console.log(`✅ Navigation réussie vers ${propertyId}`);
          // Garder le loading pendant un moment pour éviter les clics rapides
          setTimeout(() => {
            this.setPropertyLoading(propertyId, false);
          }, 1000); // 1 seconde de protection
        } else {
          console.error(`❌ Échec de navigation vers ${propertyId}`);
          this.setPropertyLoading(propertyId, false);
        }
        return success;
      })
      .catch((error) => {
        console.error(`❌ Erreur lors de la navigation vers ${propertyId}:`, error);
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
    console.log('🧹 Tous les états de chargement réinitialisés');
  }

  /**
   * Obtient la liste des propriétés en cours de chargement
   */
  getLoadingProperties(): string[] {
    return Array.from(this.loadingProperties);
  }
}
