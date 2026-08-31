import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MediaUtil, MediaItem } from 'src/app/shared/utils/media-utils';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchPropertyModel } from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { TranslateService } from '@ngx-translate/core';

export interface UnitDetailDialogData {
  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentIndex: number;
}

@Component({
  selector: 'app-unit-detail-dialog',
  templateUrl: './unit-detail-dialog.component.html',
  styleUrls: ['./unit-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Données du dialog
  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentUnitIndex: number;
  
  // État de la galerie d'images
  currentImageIndex = 0;
  isImageGalleryVisible = false;

  // Médias classifiés (image / panorama / video)
  unitMediaItems: MediaItem[] = [];
  mediaLoading = true; // true pendant la classification async

  // Panorama 360° plein écran
  panoramaFullscreenUrl: string | null = null;

  // Navigation
  canNavigatePrevious = false;
  canNavigateNext = false;

  // Accès premium (par ownerId)
  hasPremiumAccess = false;
  premiumLoading = false;
  premiumError: string | null = null;
  ownerInfo: OwnerInfoModel | null = null;
  showPremiumModal = false;
  premiumPrice = 1000;

  // ownerId de l'unité courante (recalculé à chaque navigation)
  private currentOwnerId = '';

  // Données utilisateur courant (connecté ou anonyme)
  currentUserId: string = '';
  currentUserEmail: string = '';

  // Variables pour le swipe tactile
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipeDistance = 50;

  // Référence stable pour addEventListener/removeEventListener
  private boundHandleKeyDown = this.handleKeyDown.bind(this);

  constructor(
    public dialogRef: MatDialogRef<UnitDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitDetailDialogData,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private cdr: ChangeDetectorRef,
    private premiumAccessService: PremiumAccessService,
    private anonymousUserService: AnonymousUserService,
    private translate: TranslateService
  ) {
    this.unit = data.unit;
    this.allUnits = data.allUnits;
    this.currentUnitIndex = data.currentIndex;
  }

  ngOnInit(): void {
    this.updateNavigationState();
    this.setupKeyboardNavigation();
    this.updateUrlWithUnit();
    this.currentOwnerId = this.unit?.property?.owner?._id || '';
    this.loadCurrentUser();
    this.subscribeToPremiumStore();
    this.checkPremiumReturnFromPayment();
  }

  ngAfterViewInit(): void {
    // setTimeout(0) pour sortir du cycle de détection Angular courant
    // et éviter NG0100 ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.buildMediaItems());
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.mediaCache.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === NAVIGATION ===
  private updateNavigationState(): void {
    this.canNavigatePrevious = this.currentUnitIndex > 0;
    this.canNavigateNext = this.currentUnitIndex < this.allUnits.length - 1;
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.boundHandleKeyDown);
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
      this.currentImageIndex = 0;
      this.mediaLoading = true;
      this.updateNavigationState();
      this.updateUrlWithUnit();
      this.refreshPremiumStateForUnit();
      this.cdr.markForCheck();
      setTimeout(() => this.buildMediaItems());
    }
  }

  navigateToNext(): void {
    if (this.canNavigateNext) {
      this.currentUnitIndex++;
      this.unit = this.allUnits[this.currentUnitIndex];
      this.currentImageIndex = 0;
      this.mediaLoading = true;
      this.updateNavigationState();
      this.updateUrlWithUnit();
      this.refreshPremiumStateForUnit();
      this.cdr.markForCheck();
      setTimeout(() => this.buildMediaItems());
    }
  }

  /**
   * Recalcule l'état premium pour la nouvelle unité affichée.
   * Chaque propriétaire a son propre accès — on relit le store pour le nouvel ownerId.
   */
  private refreshPremiumStateForUnit(): void {
    const newOwnerId = this.unit?.property?.owner?._id || '';
    if (newOwnerId === this.currentOwnerId) return;
    this.currentOwnerId = newOwnerId;

    // Lire l'état en cache pour ce nouvel ownerId
    const hasAccess = this.store.selectSnapshot(
      PremiumAccessState.hasAccessForOwner(newOwnerId),
    );
    const cachedInfo = this.store.selectSnapshot(
      PremiumAccessState.ownerInfoFor(newOwnerId),
    );

    this.hasPremiumAccess = hasAccess;
    this.ownerInfo = cachedInfo;

    if (!hasAccess && newOwnerId) {
      // Vérifier côté backend si pas encore vérifié
      const checkState = this.store.selectSnapshot(
        PremiumAccessState.checkLoadingFor(newOwnerId),
      );
      if (checkState === 'NO_LOADED') {
        const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
        const isAnonymous = !profile?._id;
        this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
          this.currentUserId, newOwnerId, isAnonymous,
        ));
      }
    } else if (hasAccess && !cachedInfo && newOwnerId) {
      const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
      const isAnonymous = !profile?._id;
      const propertyId = this.unit?.property?._id || (this.unit?.property as any)?._id?.toString();
      this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
        this.currentUserId, newOwnerId, isAnonymous, propertyId,
      ));
    }
  }

  closeDialog(): void {
    this.removeUnitFromUrl();
    document.removeEventListener('keydown', this.boundHandleKeyDown);
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

  // === MÉDIAS ===

  private collectRawUrls(): string[] {
    const raw: string[] = [];
    const push = (url: any) => { if (url && typeof url === 'string' && url.trim()) raw.push(url.trim()); };
    (this.unit?.medias ?? []).forEach(push);
    (this.unit?.property?.medias ?? []).forEach(push);
    push(this.unit?.property?.image);
    push((this.unit as any)?.image);
    return [...new Set(raw)];
  }

  // Cache des médias par ID d'unité pour éviter de reclassifier à chaque navigation
  private mediaCache = new Map<string, MediaItem[]>();

  /**
   * Construit la liste des médias — sync uniquement (pas de chargement réseau).
   * La détection 360° par ratio 2:1 est supprimée : trop coûteuse (N requêtes réseau).
   * Les panoramas sont détectés par mots-clés dans l'URL (360, pano, panorama...).
   */
  private buildMediaItems(): void {
    if (!this.unit) {
      this.unitMediaItems = [{ url: '/assets/images/placeholder-room.jpg', type: 'image' }];
      this.mediaLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const cacheKey = this.unit._id;
    if (cacheKey && this.mediaCache.has(cacheKey)) {
      this.unitMediaItems = this.mediaCache.get(cacheKey)!;
      this.mediaLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const unique = this.collectRawUrls();
    const items = unique.length > 0
      ? MediaUtil.getMediaItems(unique)
      : [{ url: '/assets/images/placeholder-room.jpg', type: 'image' as const }];

    if (cacheKey) this.mediaCache.set(cacheKey, items);
    this.unitMediaItems = items;
    this.mediaLoading = false;
    this.cdr.detectChanges();
  }

  // === IMAGE NAVIGATION ===
  previousImage(): void {
    if (this.unitMediaItems.length <= 1) return;
    this.currentImageIndex = this.currentImageIndex === 0 ? this.unitMediaItems.length - 1 : this.currentImageIndex - 1;
  }

  nextImage(): void {
    if (this.unitMediaItems.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.unitMediaItems.length;
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.unitMediaItems.length) {
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

    // Si mouvement principalement horizontal, bloquer le scroll natif pour le swipe
    if (absDeltaX > absDeltaY && absDeltaX > 5) {
      event.preventDefault();
    }
    // Le scroll vertical est géré nativement par le navigateur
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
    // Réinitialiser les variables de toucher
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  // === GALLERY ===
  openImageGallery(): void {
    const current = this.unitMediaItems[this.currentImageIndex];
    if (current?.type === 'panorama') {
      // Ouvrir directement le viewer 360° plein écran
      this.panoramaFullscreenUrl = current.url;
    } else {
      this.isImageGalleryVisible = true;
    }
  }

  closeImageGallery(): void {
    this.isImageGalleryVisible = false;
  }

  openPanoramaFullscreen(url: string): void {
    this.panoramaFullscreenUrl = url;
  }

  closePanoramaFullscreen(): void {
    this.panoramaFullscreenUrl = null;
  }

  // === UTILITIES ===
  trackByIndex(index: number): number {
    return index;
  }

  onImageError(event: any, index: number): void {
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
    // Décide si les informations de l'AGENCE doivent être affichées au lieu de
    // celles du propriétaire. On n'affiche l'agence que si :
    //  - un agent gère vraiment la propriété (managedByAgent renseigné), ET
    //  - l'agence n'a pas configuré contactDisplayMode = 'OWNER'
    //    (contactDisplayMode 'AGENCY' par défaut).
    const hasAgent = !!(this.unit?.property?.managedByAgent || this.unit?.property?.isManaged);
    if (!hasAgent) return false;
    const displayMode =
      this.unit?.property?.managedByAgent?.agentProfile?.contactDisplayMode ||
      'AGENCY';
    return displayMode !== 'OWNER';
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
             this.unit?.property?.managedByAgent?.agentProfile?.businessName ||
             this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_AGENT');
    }
    return this.unit?.property?.owner?.fullName ||
           this.unit?.property?.owner?.name ||
           this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_OWNER');
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
    return this.unit?.property?.managedByAgent?.agentProfile?.businessName ||
           this.unit?.property?.managedByAgent?.businessName ||
           this.unit?.property?.managedByAgent?.agencyName ||
           this.unit?.property?.managedByAgent?.company ||
           this.translate.instant('UNIT_DETAIL.AGENCY.DEFAULT_NAME');
  }

  getAgencyLogo(): string | null {
    return this.unit?.property?.managedByAgent?.agentProfile?.businessLogoUrl ||
           this.unit?.property?.managedByAgent?.businessLogoUrl ||
           this.unit?.property?.managedByAgent?.agencyLogo ||
           this.unit?.property?.managedByAgent?.logo ||
           null;
  }

  getAgencyPhone(): string {
    return this.unit?.property?.managedByAgent?.phoneNumber ||
           this.unit?.property?.managedByAgent?.agencyPhone ||
           '';
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
    if (!this.unit) return;
    // Si accès premium, utiliser les infos propriétaire
    if (this.hasPremiumAccess && this.ownerInfo?.owner?.phone) {
      window.open(`tel:${this.ownerInfo.owner.phone}`, '_self');
      return;
    }
    // Sinon ouvrir le modal premium
    this.showPremiumModal = true;
  }

  // === PREMIUM ACCESS ===

  private loadCurrentUser(): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    if (profile?._id) {
      this.currentUserId = profile._id;
      this.currentUserEmail = profile.email || '';
    } else {
      this.currentUserId = this.anonymousUserService.getVisitorId();
      this.currentUserEmail = '';
    }

    const ownerId = this.currentOwnerId;
    if (!ownerId) return;

    const isAnonymous = !profile?._id;

    // Lire le cache store pour cet ownerId
    const hasAccess = this.store.selectSnapshot(
      PremiumAccessState.hasAccessForOwner(ownerId),
    );
    const checkState = this.store.selectSnapshot(
      PremiumAccessState.checkLoadingFor(ownerId),
    );
    const cachedInfo = this.store.selectSnapshot(
      PremiumAccessState.ownerInfoFor(ownerId),
    );

    if (hasAccess) {
      this.hasPremiumAccess = true;
      if (cachedInfo) {
        this.ownerInfo = cachedInfo;
      } else {
        const propertyId = this.unit?.property?._id || (this.unit?.property as any)?._id?.toString();
        this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
          this.currentUserId, ownerId, isAnonymous, propertyId,
        ));
      }
      return;
    }

    // Pas encore vérifié pour cet ownerId → lancer la vérification
    if (checkState === 'NO_LOADED') {
      this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
        this.currentUserId, ownerId, isAnonymous,
      ));
    }
  }

  subscribeToPremiumStore(): void {
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.premiumLoading = loading;
        this.cdr.detectChanges();
      });

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.premiumError = error;
        this.cdr.detectChanges();
      });

    // Écouter l'accès pour l'ownerId de l'unité courante
    if (this.currentOwnerId) {
      this.store.select(PremiumAccessState.hasAccessForOwner(this.currentOwnerId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(hasAccess => {
          this.hasPremiumAccess = hasAccess;
          if (hasAccess && this.currentUserId && this.currentOwnerId) {
            const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
            const isAnonymous = !profile?._id;
            const propertyId = this.unit?.property?._id || this.unit?.property?.toString();
            this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
              this.currentUserId, this.currentOwnerId, isAnonymous, propertyId,
            ));
          }
          this.cdr.detectChanges();
        });

      this.store.select(PremiumAccessState.ownerInfoFor(this.currentOwnerId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(ownerInfo => {
          if (ownerInfo) {
            this.ownerInfo = ownerInfo;
            this.cdr.detectChanges();
          }
        });
    }
  }

  onPurchasePremiumAccess(): void {
    this.showPremiumModal = true;
  }

  closePremiumModal(): void {
    this.showPremiumModal = false;
  }

  onPremiumAccessGranted(): void {
    this.showPremiumModal = false;
  }

  /**
   * Retour depuis la page de paiement.
   * On vérifie l'accès pour l'ownerId passé en query param (plus précis que le check global).
   */
  private checkPremiumReturnFromPayment(): void {
    const params = this.route.snapshot.queryParams;
    if (params['premium'] !== 'success') return;

    const returnedOwnerId = params['ownerId'] || this.currentOwnerId;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { premium: null, ownerId: null, visitorId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (!returnedOwnerId) return;

    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const isAnonymous = !profile?._id;

    // Vider le cache pour forcer un rechargement frais depuis le backend
    this.store.dispatch(new PremiumAccessAction.ClearOwnerCache(returnedOwnerId));

    // Vérifier l'accès pour cet ownerId précis
    this.premiumAccessService.checkAccessForOwner(this.currentUserId, returnedOwnerId).subscribe({
      next: (res) => {
        if (res.data.hasAccess) {
          this.hasPremiumAccess = true;
          const propertyId = this.unit?.property?._id || (this.unit?.property as any)?._id?.toString();
          this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
            this.currentUserId, returnedOwnerId, isAnonymous, propertyId,
          ));
        }
      },
      error: () => {},
    });
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
             '';
    }
    return this.ownerInfo?.owner?.phone || '';
  }

  getContactEmail(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.email ||
             this.ownerInfo?.owner?.email || '';
    }
    return this.ownerInfo?.owner?.email || '';
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

}