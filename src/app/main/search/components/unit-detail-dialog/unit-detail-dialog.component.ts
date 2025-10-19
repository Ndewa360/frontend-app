import { Component, Inject, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchPropertyModel } from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';
import { TranslateService } from '@ngx-translate/core';

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
    private premiumAccessService: PremiumAccessService,
    private translate: TranslateService
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

  // === OWNER/AGENT ===
  getOwnerInitials(owner: any): string {
    if (!owner?.fullName) return 'PC';
    return owner.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }

  isPropertyManagedByAgent(): boolean {
    return !!(this.unit?.property?.managedByAgent || this.unit?.property?.isManaged);
  }

  getContactPersonTitle(): string {
    return this.isPropertyManagedByAgent() ? 
      this.translate.instant('UNIT_DETAIL.CONTACT.AGENT_TITLE') : 
      this.translate.instant('UNIT_DETAIL.CONTACT.OWNER_TITLE');
  }

  getContactPersonName(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.fullName || 
             this.unit?.property?.managedByAgent?.name || 
             this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_AGENT');
    }
    return this.unit?.property?.owner?.fullName || this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_OWNER');
  }

  getContactPersonInitials(): string {
    const name = this.getContactPersonName();
    const certifiedAgent = this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_AGENT');
    const certifiedOwner = this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_OWNER');
    if (name === certifiedAgent) return 'AC';
    if (name === certifiedOwner) return 'PC';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }

  getContactPersonBadge(): string {
    return this.isPropertyManagedByAgent() ? 
      'UNIT_DETAIL.CONTACT.VERIFIED_AGENT' : 
      'UNIT_DETAIL.CONTACT.VERIFIED';
  }

  getAgencyName(): string {
    return this.unit?.property?.managedByAgent?.agencyName || 
           this.unit?.property?.managedByAgent?.company || 
           this.translate.instant('UNIT_DETAIL.AGENCY.DEFAULT_NAME');
  }

  getAgencyLogo(): string | null {
    return this.unit?.property?.managedByAgent?.agencyLogo || 
           this.unit?.property?.managedByAgent?.logo || 
           null;
  }

  getAgencyPhone(): string {
    return this.unit?.property?.managedByAgent?.agencyPhone || 
           this.unit?.property?.managedByAgent?.phoneNumber || 
           '+237 690 123 456';
  }

  // === ACTIONS ===
  shareProperty(): void {
    const shareData = {
      title: this.unit.property?.name || this.unit.code || this.translate.instant('UNIT_DETAIL.SHARE.DEFAULT_TITLE'),
      text: this.translate.instant('UNIT_DETAIL.SHARE.TEXT', {
        name: this.unit.property?.name || this.unit.code,
        price: this.formatPrice(this.unit.price)
      }),
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
    const text = this.translate.instant('UNIT_DETAIL.SHARE.TEXT', {
      name: this.unit.property?.name || this.unit.code,
      price: this.formatPrice(this.unit.price)
    });
    
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      console.log('✅ Share link copied');
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
    console.log('Contact owner:', this.unit.property?.owner);
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
    return this.translate.instant('UNIT_DETAIL.PREMIUM.REMAINING_DAYS');
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text);
  }

  getContactPhone(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.phoneNumber || 
             this.unit?.property?.managedByAgent?.phone || 
             '+237 690 123 456';
    }
    return this.ownerInfo?.owner?.phone || '+237 690 123 456';
  }

  getContactEmail(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.email || 
             this.ownerInfo?.owner?.email || 'contact@ndewa360.com';
    }
    return this.ownerInfo?.owner?.email || 'contact@ndewa360.com';
  }

  getContactWhatsApp(): string {
    const phone = this.getContactPhone();
    return phone;
  }

  getWhatsAppLink(): string {
    const phone = this.getContactPhone().replace(/\D/g, '');
    return `https://wa.me/${phone}`;
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
    const agent = this.unit?.property?.managedByAgent;
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    // Si la propriété est gérée par un agent, utiliser les infos de l'agent
    if (this.isPropertyManagedByAgent() && agent) {
      this.ownerInfo = {
        owner: {
          id: agent._id || ('agent-' + Date.now()),
          name: agent.fullName || agent.name || this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_REAL_ESTATE_AGENT'),
          email: agent.email || 'agent@ndewa360.com',
          phone: agent.phoneNumber || agent.phone || '+237 6XX XXX XXX',
          whatsapp: agent.phoneNumber || agent.phone || '+237 6XX XXX XXX',
          address: this.unit?.property?.location || this.translate.instant('UNIT_DETAIL.LOCATION.ADDRESS_NOT_SPECIFIED')
        },
        access: {
          id: 'access-' + Date.now(),
          expiryDate: expiryDate.toISOString(),
          remainingDays: 3,
          accessCount: 1,
          accessedOwnersCount: 1
        }
      };
    } else if (owner) {
      this.ownerInfo = {
        owner: {
          id: owner._id || ('owner-' + Date.now()),
          name: owner.fullName || this.translate.instant('UNIT_DETAIL.CONTACT.VERIFIED_OWNER'),
          email: owner.email || 'proprietaire@ndewa360.com',
          phone: owner.phoneNumber || '+237 6XX XXX XXX',
          whatsapp: owner.phoneNumber || '+237 6XX XXX XXX',
          address: this.unit?.property?.location || this.translate.instant('UNIT_DETAIL.LOCATION.ADDRESS_NOT_SPECIFIED')
        },
        access: {
          id: 'access-' + Date.now(),
          expiryDate: expiryDate.toISOString(),
          remainingDays: 3,
          accessCount: 1,
          accessedOwnersCount: 1
        }
      };
    } else {
      // Fallback
      this.ownerInfo = {
        owner: {
          id: 'fallback-contact-' + Date.now(),
          name: this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_NDEWA_CONTACT'),
          email: 'contact@ndewa360.com',
          phone: '+237 690 123 456',
          whatsapp: '+237 690 123 456',
          address: this.unit?.property?.location || this.translate.instant('UNIT_DETAIL.LOCATION.DEFAULT_LOCATION')
        },
        access: {
          id: 'fallback-access-' + Date.now(),
          expiryDate: expiryDate.toISOString(),
          remainingDays: 3,
          accessCount: 1,
          accessedOwnersCount: 1
        }
      };
    }
  }
}