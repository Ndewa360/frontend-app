import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchPropertyModel } from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';

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
  hasPremiumAccess = false;
  premiumLoading = false;
  premiumError: string | null = null;
  ownerInfo: OwnerInfoModel | null = null;
  showPremiumModal = false;
  premiumPrice = 500;

  constructor(
    public dialogRef: MatDialogRef<UnitDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitDetailDialogData,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private premiumAccessService: PremiumAccessService
  ) {
    this.unit = data.unit;
    this.allUnits = data.allUnits;
    this.currentUnitIndex = data.currentIndex;
  }

  ngOnInit(): void {
    this.updateNavigationState();
    this.setupKeyboardNavigation();
    this.updateUrlWithUnit();
    this.checkPremiumAccess();
    this.subscribeToPremiumStore();
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
   * Vérifier l'accès premium de l'utilisateur
   */
  private checkPremiumAccess(): void {
    // TODO: Récupérer l'ID utilisateur depuis le service d'authentification
    const userId = 'current-user-id'; // À remplacer par la vraie logique

    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(userId));
  }

  /**
   * S'abonner aux changements du store premium
   */
  private subscribeToPremiumStore(): void {
    // S'abonner aux sélecteurs NGXS
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.premiumLoading = loading);

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.premiumError = error);

    this.store.select(PremiumAccessState.hasActiveAccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => this.hasPremiumAccess = hasAccess);

    this.store.select(PremiumAccessState.ownerInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ownerInfo => this.ownerInfo = ownerInfo);
  }

  /**
   * Gère l'achat de l'accès premium
   */
  onPurchasePremiumAccess(): void {
    this.showPremiumModal = true;
  }

  /**
   * Fermer le modal premium
   */
  closePremiumModal(): void {
    this.showPremiumModal = false;
  }

  /**
   * Voir les informations du propriétaire
   */
  viewOwnerInfo(): void {
    if (!this.hasPremiumAccess) {
      this.onPurchasePremiumAccess();
      return;
    }

    // TODO: Récupérer l'ID utilisateur et propriétaire
    const userId = 'current-user-id'; // À remplacer
    const ownerId = this.unit.property?.owner?.id || 'owner-id'; // À adapter selon votre modèle

    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(userId, ownerId));
  }

  /**
   * Formater le montant premium
   */
  formatPremiumAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }

  /**
   * Obtenir le texte des jours restants
   */
  getRemainingDaysText(): string {
    if (!this.ownerInfo?.access) return '';

    const remainingDays = this.ownerInfo.access.remainingDays;
    if (remainingDays <= 0) {
      return 'Accès expiré';
    } else if (remainingDays === 1) {
      return '1 jour restant';
    } else {
      return `${remainingDays} jours restants`;
    }
  }

  /**
   * Obtenir le lien WhatsApp
   */
  getWhatsAppLink(): string {
    if (!this.ownerInfo?.owner.whatsapp) return '#';

    const phone = this.ownerInfo.owner.whatsapp.replace(/\s+/g, '');
    const message = encodeURIComponent('Bonjour, je suis intéressé par votre propriété sur Ndewa360°.');
    return `https://wa.me/${phone}?text=${message}`;
  }

  /**
   * Appeler le propriétaire
   */
  callOwner(): void {
    if (this.ownerInfo?.owner.phone) {
      window.location.href = `tel:${this.ownerInfo.owner.phone}`;
    }
  }

  /**
   * Envoyer un email au propriétaire
   */
  emailOwner(): void {
    if (this.ownerInfo?.owner.email) {
      const subject = encodeURIComponent('Demande d\'information - Ndewa360°');
      const body = encodeURIComponent('Bonjour,\n\nJe suis intéressé par votre propriété sur Ndewa360°.\n\nCordialement');
      window.location.href = `mailto:${this.ownerInfo.owner.email}?subject=${subject}&body=${body}`;
    }
  }
}
