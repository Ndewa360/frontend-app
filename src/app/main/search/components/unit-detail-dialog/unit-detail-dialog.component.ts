import { Component, Inject, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
  
  // Cache des images pour éviter les rechargements
  private imageCache: string[] = [];
  unitImages: string[] = [];

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

  // Variables pour le swipe tactile
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipeDistance = 50;

  // TEMPORAIRE: Variable pour simuler l'accès premium
  public temporaryFreeAccess = true;

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
    // Calculer les images une seule fois
    this.unitImages = this.calculateUnitImages();

    this.updateNavigationState();
    this.setupKeyboardNavigation();
    this.updateUrlWithUnit();
    this.checkPremiumAccess();
    this.subscribeToPremiumStore();
    this.preloadImages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === NAVIGATION ===
  private updateNavigationState(): void {
    this.canNavigatePrevious = this.currentUnitIndex > 0;
    this.canNavigateNext = this.currentUnitIndex < this.allUnits.length - 1;
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

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

  navigateToPrevious(): void {
    if (this.canNavigatePrevious) {
      this.currentUnitIndex--;
      this.unit = this.allUnits[this.currentUnitIndex];
      this.unitImages = this.calculateUnitImages();
      this.currentImageIndex = 0;
      this.updateNavigationState();
      this.updateUrlWithUnit();
    }
  }

  navigateToNext(): void {
    if (this.canNavigateNext) {
      this.currentUnitIndex++;
      this.unit = this.allUnits[this.currentUnitIndex];
      this.unitImages = this.calculateUnitImages();
      this.currentImageIndex = 0;
      this.updateNavigationState();
      this.updateUrlWithUnit();
    }
  }

  closeDialog(): void {
    this.removeUnitFromUrl();
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.dialogRef.close(null);
  }

  // === URL MANAGEMENT ===
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

  private removeUnitFromUrl(): void {
    const currentParams = { ...this.route.snapshot.queryParams };
    delete currentParams['unit'];
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: currentParams,
      replaceUrl: true
    });
  }

  // === IMAGES ===
  private calculateUnitImages(): string[] {
    if (!this.unit) {
      return ['/assets/images/placeholder-room.jpg'];
    }

    const images: string[] = [];

    // Images de l'unité elle-même (priorité)
    if (this.unit.medias && Array.isArray(this.unit.medias) && this.unit.medias.length > 0) {
      const validMedias = this.unit.medias.filter(url => url && typeof url === 'string' && url.trim());
      images.push(...validMedias);
    }

    // Images de la propriété
    if (this.unit.property?.medias && Array.isArray(this.unit.property.medias) && this.unit.property.medias.length > 0) {
      const validPropertyMedias = this.unit.property.medias.filter(url => url && typeof url === 'string' && url.trim());
      images.push(...validPropertyMedias);
    }

    // Image principale de la propriété
    if (this.unit.property?.image && typeof this.unit.property.image === 'string' && this.unit.property.image.trim()) {
      images.push(this.unit.property.image);
    }

    // Image principale de l'unité
    if (this.unit.image && typeof this.unit.image === 'string' && this.unit.image.trim()) {
      images.push(this.unit.image);
    }

    // Supprimer les doublons et valider
    const uniqueImages = [...new Set(images.filter(img => img && img.trim()))];
    
    // Image par défaut si aucune image
    if (uniqueImages.length === 0) {
      uniqueImages.push('/assets/images/placeholder-room.jpg');
    }
    
    return uniqueImages;
  }

  private preloadImages(): void {
    this.unitImages.forEach((url) => {
      if (url && url.trim()) {
        const img = new Image();
        img.src = url;
      }
    });
  }

  // === IMAGE NAVIGATION ===
  previousImage(): void {
    if (this.unitImages.length <= 1) return;
    this.currentImageIndex = this.currentImageIndex === 0 ? this.unitImages.length - 1 : this.currentImageIndex - 1;
  }

  nextImage(): void {
    if (this.unitImages.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.unitImages.length;
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.unitImages.length) {
      this.currentImageIndex = index;
    }
  }

  getSliderTransform(): string {
    return `translateX(-${this.currentImageIndex * 100}%)`;
  }

  // === TOUCH EVENTS ===
  private touchStartY = 0;
  
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > 5 || absDeltaY > 5) {
      if (absDeltaY > absDeltaX && absDeltaY > 5) {
        // Mouvement vertical - scroll naturel qui suit le doigt
        const dialogContent = document.querySelector('.dialog-content');
        if (dialogContent) {
          dialogContent.scrollBy(0, -deltaY);
        }
        this.touchStartY = touch.clientY;
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeDistance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(swipeDistance) > this.minSwipeDistance) {
      if (swipeDistance > 0) {
        this.nextImage();
      } else {
        this.previousImage();
      }
    }
  }

  onTouchCancel(event: TouchEvent): void {
    console.log('🖐️ Touch cancel dans dialog');
    // Réinitialiser les variables de toucher
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  // === GALLERY ===
  openImageGallery(): void {
    this.isImageGalleryVisible = true;
  }

  closeImageGallery(): void {
    this.isImageGalleryVisible = false;
  }

  // === UTILITIES ===
  trackByIndex(index: number): number {
    return index;
  }

  onImageError(event: any, index: number): void {
    console.warn(`Erreur chargement image ${index}:`, event);
    event.target.src = '/assets/images/placeholder-room.jpg';
  }

  onImageLoad(event: any, index: number): void {
    // Image chargée avec succès
  }

  formatPrice(price: number): string {
    if (!price) return '0';
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  // === AMENITIES ===
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

  // === OWNER ===
  getOwnerInitials(owner: any): string {
    if (!owner?.fullName) return 'PC';
    return owner.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }

  // === ACTIONS ===
  shareProperty(): void {
    const shareData = {
      title: this.unit.property?.name || this.unit.code || 'Propriété sur Ndewa360°',
      text: `Découvrez cette propriété: ${this.unit.property?.name || this.unit.code} - ${this.formatPrice(this.unit.price)}/mois`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => this.fallbackShare());
    } else {
      this.fallbackShare();
    }
  }

  private fallbackShare(): void {
    const url = window.location.href;
    const text = `Découvrez cette propriété: ${this.unit.property?.name || this.unit.code} - ${this.formatPrice(this.unit.price)}/mois`;
    
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      console.log('✅ Lien de partage copié');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = `${text} ${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }

  onContactOwner(): void {
    console.log('Contacter le propriétaire:', this.unit.property?.owner);
  }

  // === PREMIUM ACCESS ===
  checkPremiumAccess(): void {
    this.hasPremiumAccess = this.temporaryFreeAccess;
    if (this.hasPremiumAccess) {
      this.loadOwnerInfo();
    }
  }

  subscribeToPremiumStore(): void {
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.premiumLoading = loading);

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.premiumError = error);
  }

  onPurchasePremiumAccess(): void {
    this.showPremiumModal = true;
  }

  closePremiumModal(): void {
    this.showPremiumModal = false;
  }

  getRemainingDaysText(): string {
    return '3 jours restants';
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text);
  }

  getWhatsAppLink(): string {
    return 'https://wa.me/237600000000';
  }

  openMap(): void {
    const address = this.unit.property?.location;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  }

  private loadOwnerInfo(): void {
    const owner = this.unit?.property?.owner;
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    if (!owner) {
      this.ownerInfo = {
        owner: {
          id: 'fallback-owner-' + Date.now(),
          name: 'Propriétaire Certifié NDEWA',
          email: 'contact@ndewa360.com',
          phone: '+237 690 123 456',
          whatsapp: '+237 690 123 456',
          address: this.unit?.property?.location || 'Douala, Cameroun'
        },
        access: {
          id: 'fallback-access-' + Date.now(),
          expiryDate: expiryDate.toISOString(),
          remainingDays: 3,
          accessCount: 1,
          accessedOwnersCount: 1
        }
      };
    } else {
      this.ownerInfo = {
        owner: {
          id: owner._id || ('owner-' + Date.now()),
          name: owner.fullName || 'Propriétaire Vérifié',
          email: owner.email || 'proprietaire@ndewa360.com',
          phone: owner.phoneNumber || '+237 6XX XXX XXX',
          whatsapp: owner.phoneNumber || '+237 6XX XXX XXX',
          address: this.unit?.property?.location || 'Adresse non spécifiée'
        },
        access: {
          id: 'access-' + Date.now(),
          expiryDate: expiryDate.toISOString(),
          remainingDays: 3,
          accessCount: 1,
          accessedOwnersCount: 1
        }
      };
    }
  }
}