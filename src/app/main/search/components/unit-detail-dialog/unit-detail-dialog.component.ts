import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchPropertyModel } from 'src/app/shared/store';

export interface UnitDetailDialogData {
  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentIndex: number;
}

@Component({
  selector: 'app-unit-detail-dialog',
  templateUrl: './unit-detail-dialog.component.html',
  styleUrls: ['./unit-detail-dialog.component.scss']
})
export class UnitDetailDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Données du dialog
  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentUnitIndex: number;
  
  // État de la galerie d'images
  currentImageIndex = 0;
  isImageGalleryVisible = false;

  // Navigation
  canNavigatePrevious = false;
  canNavigateNext = false;

  // Accès premium
  hasPremiumAccess = false; // À gérer selon la logique métier

  constructor(
    public dialogRef: MatDialogRef<UnitDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitDetailDialogData,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.unit = data.unit;
    this.allUnits = data.allUnits;
    this.currentUnitIndex = data.currentIndex;
  }

  ngOnInit(): void {
    this.updateNavigationState();
    this.setupKeyboardNavigation();
    this.updateUrlWithUnit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Met à jour l'état de navigation
   */
  private updateNavigationState(): void {
    this.canNavigatePrevious = this.currentUnitIndex > 0;
    this.canNavigateNext = this.currentUnitIndex < this.allUnits.length - 1;
  }

  /**
   * Configure la navigation au clavier
   */
  private setupKeyboardNavigation(): void {
    // Écouter les événements clavier
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Gère les événements clavier
   */
  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeDialog();
        break;
      case 'ArrowLeft':
        if (this.canNavigatePrevious) {
          this.navigateToPrevious();
        }
        break;
      case 'ArrowRight':
        if (this.canNavigateNext) {
          this.navigateToNext();
        }
        break;
    }
  }

  /**
   * Met à jour l'URL avec l'unité actuelle
   */
  private updateUrlWithUnit(): void {
    const currentParams = this.route.snapshot.queryParams;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...currentParams,
        unit: this.unit._id
      },
      replaceUrl: true
    });
  }

  /**
   * Supprime le paramètre unit de l'URL
   */
  private removeUnitFromUrl(): void {
    const currentParams = { ...this.route.snapshot.queryParams };
    delete currentParams['unit'];
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: currentParams,
      replaceUrl: true
    });
  }

  /**
   * Navigation vers l'unité précédente avec animation
   */
  navigateToPrevious(): void {
    if (this.canNavigatePrevious) {
      this.addUnitTransition();
      this.currentUnitIndex--;
      this.unit = this.allUnits[this.currentUnitIndex];
      this.currentImageIndex = 0;
      this.updateNavigationState();
      this.updateUrlWithUnit();
    }
  }

  /**
   * Navigation vers l'unité suivante avec animation
   */
  navigateToNext(): void {
    if (this.canNavigateNext) {
      this.addUnitTransition();
      this.currentUnitIndex++;
      this.unit = this.allUnits[this.currentUnitIndex];
      this.currentImageIndex = 0;
      this.updateNavigationState();
      this.updateUrlWithUnit();
    }
  }

  /**
   * Ferme le dialog sans affecter les données
   */
  closeDialog(): void {
    this.removeUnitFromUrl();
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));

    // Fermer le dialog sans passer de données pour éviter de vider la liste
    this.dialogRef.close(null);
  }

  /**
   * Obtient les images de l'unité
   */
  getUnitImages(): string[] {
    const images: string[] = [];

    // Images de la propriété
    if (this.unit.property?.medias?.length) {
      images.push(...this.unit.property.medias);
    }

    // Images de l'unité elle-même
    if (this.unit.medias?.length) {
      images.push(...this.unit.medias);
    }

    // Image principale de la propriété
    if (this.unit.property?.image) {
      images.push(this.unit.property.image);
    }

    // Image principale de l'unité
    if (this.unit.image) {
      images.push(this.unit.image);
    }

    // Image par défaut si aucune image
    if (images.length === 0) {
      images.push('/assets/images/default-property.jpg');
    }

    // Supprimer les doublons
    return [...new Set(images)];
  }

  /**
   * Navigation dans les images avec effet de transition
   */
  previousImage(): void {
    const images = this.getUnitImages();
    if (images.length > 1) {
      this.addImageTransition();
      this.currentImageIndex = this.currentImageIndex > 0
        ? this.currentImageIndex - 1
        : images.length - 1;
    }
  }

  nextImage(): void {
    const images = this.getUnitImages();
    if (images.length > 1) {
      this.addImageTransition();
      this.currentImageIndex = this.currentImageIndex < images.length - 1
        ? this.currentImageIndex + 1
        : 0;
    }
  }

  goToImage(index: number): void {
    if (index !== this.currentImageIndex) {
      this.addImageTransition();
      this.currentImageIndex = index;
    }
  }

  /**
   * Ajoute un effet de transition fluide et élégant lors du changement d'image
   */
  private addImageTransition(): void {
    const imageElement = document.querySelector('.property-image') as HTMLElement;
    if (imageElement) {
      // Phase 1: Fade out avec effet de slide
      imageElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      imageElement.style.opacity = '0';
      imageElement.style.transform = 'scale(0.95) translateX(-10px)';
      imageElement.style.filter = 'blur(2px)';

      setTimeout(() => {
        // Phase 2: Fade in avec effet de slide opposé
        imageElement.style.transform = 'scale(0.95) translateX(10px)';

        setTimeout(() => {
          // Phase 3: Retour à la normale
          imageElement.style.opacity = '1';
          imageElement.style.transform = 'scale(1) translateX(0)';
          imageElement.style.filter = 'blur(0)';
        }, 50);
      }, 150);
    }
  }

  /**
   * Animation de changement d'unité plus fluide
   */
  private addUnitTransition(): void {
    const dialogElement = document.querySelector('.unit-detail-dialog') as HTMLElement;
    if (dialogElement) {
      dialogElement.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      dialogElement.style.opacity = '0.8';
      dialogElement.style.transform = 'scale(0.98)';

      setTimeout(() => {
        dialogElement.style.opacity = '1';
        dialogElement.style.transform = 'scale(1)';
      }, 200);
    }
  }

  /**
   * Ouvre la galerie d'images en plein écran
   */
  openImageGallery(): void {
    this.isImageGalleryVisible = true;
  }

  /**
   * Ferme la galerie d'images
   */
  closeImageGallery(): void {
    this.isImageGalleryVisible = false;
  }

  /**
   * Formate le prix
   */
  formatPrice(price: number): string {
    if (!price) return 'Prix sur demande';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Vérifie si un équipement est disponible
   */
  hasAmenity(amenity: string): boolean {
    if (!this.unit) return false;
    
    switch (amenity) {
      case 'kitchen':
        return this.unit.specifity?.hasKitchen || false;
      case 'privateShower':
        return this.unit.specifity?.isInternalShower || false;
      case 'parking':
        return this.unit.property?.hasParking || false;
      case 'security':
        return this.unit.property?.hasClosure || false;
      default:
        return false;
    }
  }

  /**
   * Obtient les initiales du propriétaire
   */
  getOwnerInitials(owner: any): string {
    if (!owner?.fullName) return 'P';
    
    const names = owner.fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Action de contact du propriétaire
   */
  onContactOwner(): void {
    // Logique de contact du propriétaire
    console.log('Contacter le propriétaire:', this.unit.property?.owner);
  }

  /**
   * Gère l'achat de l'accès premium
   */
  onPurchasePremiumAccess(): void {
    // Logique pour déclencher le paiement
    console.log('Purchase premium access for unit:', this.unit);

    // Ici vous pouvez intégrer votre système de paiement
    // Par exemple : ouvrir un modal de paiement, rediriger vers une page de paiement, etc.

    // Simulation d'un paiement réussi (à remplacer par la vraie logique)
    // this.hasPremiumAccess = true;
  }
}
