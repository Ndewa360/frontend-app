import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MediaUtil, MediaItem } from 'src/app/shared/utils/media-utils';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { SearchPropertyModel } from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { TranslateService } from '@ngx-translate/core';

export interface UnitDetailDialogData {
  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentIndex: number;
  premiumReturn?: { ownerId: string; visitorId: string } | null;
}

@Component({
  selector: 'app-unit-detail-dialog',
  templateUrl: './unit-detail-dialog.component.html',
  styleUrls: ['./unit-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  unit: SearchPropertyModel;
  allUnits: SearchPropertyModel[];
  currentUnitIndex: number;

  currentImageIndex = 0;
  isImageGalleryVisible = false;
  unitMediaItems: MediaItem[] = [];
  mediaLoading = true;
  panoramaFullscreenUrl: string | null = null;

  canNavigatePrevious = false;
  canNavigateNext = false;

  hasPremiumAccess = false;
  premiumLoading = false;
  premiumError: string | null = null;
  ownerInfo: OwnerInfoModel | null = null;
  showPremiumModal = false;
  premiumPrice = 1000;

  private currentOwnerId = '';
  currentUserId = '';
  currentUserEmail = '';

  private touchStartX = 0;
  private touchEndX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 50;
  private boundHandleKeyDown = this.handleKeyDown.bind(this);
  private mediaCache = new Map<string, MediaItem[]>();

  constructor(
    public dialogRef: MatDialogRef<UnitDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitDetailDialogData,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private cdr: ChangeDetectorRef,
    private anonymousUserService: AnonymousUserService,
    private translate: TranslateService
  ) {
    this.unit = data.unit;
    this.allUnits = data.allUnits;
    this.currentUnitIndex = data.currentIndex;
  }

  ngOnInit(): void {
    this.updateNavigationState();
    document.addEventListener('keydown', this.boundHandleKeyDown);
    this.updateUrlWithUnit();

    // 1. Résoudre l'identité utilisateur
    this.resolveCurrentUser();

    // 2. Calculer l'ownerId de l'unité courante
    this.currentOwnerId = this.resolveOwnerId(this.unit);

    // 3. Initialiser l'état premium (cache store ou vérification backend)
    this.initPremiumState();

    // 4. S'abonner aux changements du store pour cet ownerId
    this.subscribeToPremiumStore();

    // 5. Traiter le retour de paiement si applicable
    if (this.data.premiumReturn?.ownerId) {
      this.handlePremiumReturn(this.data.premiumReturn.ownerId);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.buildMediaItems());
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.mediaCache.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Résolution identité ──────────────────────────────────────────────────

  private resolveCurrentUser(): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    if (profile?._id) {
      this.currentUserId = profile._id;
      this.currentUserEmail = profile.email || '';
    } else {
      this.currentUserId = this.anonymousUserService.getVisitorId();
      this.currentUserEmail = '';
    }
  }

  private get isAnonymous(): boolean {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    return !profile?._id;
  }

  private resolveOwnerId(unit: SearchPropertyModel): string {
    return unit?.property?.owner?._id || (unit?.property?.owner as any)?.toString() || '';
  }

  // ── État premium initial ─────────────────────────────────────────────────

  /**
   * Lit le cache store pour l'ownerId courant.
   * - Si accès confirmé en cache → affiche directement les infos
   * - Si infos manquantes → les charge
   * - Si pas encore vérifié → lance la vérification backend
   */
  private initPremiumState(): void {
    const ownerId = this.currentOwnerId;
    if (!ownerId) return;

    const hasAccess = this.store.selectSnapshot(PremiumAccessState.hasAccessForOwner(ownerId));
    const cachedInfo = this.store.selectSnapshot(PremiumAccessState.ownerInfoFor(ownerId));
    const checkState = this.store.selectSnapshot(PremiumAccessState.checkLoadingFor(ownerId));

    if (hasAccess) {
      this.hasPremiumAccess = true;
      if (cachedInfo) {
        this.ownerInfo = cachedInfo;
      } else {
        // Accès confirmé mais infos pas encore chargées
        this.dispatchGetOwnerInfo(ownerId);
      }
      return;
    }

    // Pas d'accès en cache → vérifier si pas déjà en cours
    if (checkState === 'NO_LOADED') {
      this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
        this.currentUserId, ownerId, this.isAnonymous,
      ));
    }
  }

  // ── Abonnements store ────────────────────────────────────────────────────

  private subscribeToPremiumStore(): void {
    const ownerId = this.currentOwnerId;
    if (!ownerId) return;

    // Écouter le loading global
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

    // Écouter l'accès pour CET ownerId
    this.store.select(PremiumAccessState.hasAccessForOwner(ownerId))
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => {
        this.hasPremiumAccess = hasAccess;
        // Dès que l'accès est confirmé, charger les infos si pas encore en cache
        if (hasAccess) {
          const cached = this.store.selectSnapshot(PremiumAccessState.ownerInfoFor(ownerId));
          if (!cached) this.dispatchGetOwnerInfo(ownerId);
        }
        this.cdr.detectChanges();
      });

    // Écouter les infos propriétaire pour CET ownerId
    this.store.select(PremiumAccessState.ownerInfoFor(ownerId))
      .pipe(
        takeUntil(this.destroy$),
        filter(info => !!info),
      )
      .subscribe(ownerInfo => {
        this.ownerInfo = ownerInfo;
        this.hasPremiumAccess = true;
        this.cdr.detectChanges();
      });
  }

  // ── Retour de paiement ───────────────────────────────────────────────────

  /**
   * Appelé quand SearchPageComponent rouvre le dialog avec premiumReturn.
   * Vérifie l'accès côté backend et charge les infos propriétaire.
   */
  private handlePremiumReturn(returnedOwnerId: string): void {
    // Nettoyer les query params premium de l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { premium: null, ownerId: null, visitorId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    // Vider le cache pour forcer un rechargement frais
    this.store.dispatch(new PremiumAccessAction.ClearOwnerCache(returnedOwnerId));

    // Dispatcher CheckAccessForOwner via le store — le store met à jour activeOwnerIds
    // puis subscribeToPremiumStore() détecte hasAccess=true et appelle GetOwnerInfo
    this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
      this.currentUserId, returnedOwnerId, this.isAnonymous,
    ));
  }

  private dispatchGetOwnerInfo(ownerId: string): void {
    const propertyId = this.unit?.property?._id || (this.unit?.property as any)?._id?.toString() || '';
    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
      this.currentUserId, ownerId, this.isAnonymous, propertyId,
    ));
  }

  // ── Navigation entre unités ──────────────────────────────────────────────

  private updateNavigationState(): void {
    this.canNavigatePrevious = this.currentUnitIndex > 0;
    this.canNavigateNext = this.currentUnitIndex < this.allUnits.length - 1;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape': this.closeDialog(); break;
      case 'ArrowLeft': if (this.canNavigatePrevious) this.navigateToPrevious(); break;
      case 'ArrowRight': if (this.canNavigateNext) this.navigateToNext(); break;
    }
  }

  navigateToPrevious(): void {
    if (!this.canNavigatePrevious) return;
    this.currentUnitIndex--;
    this.onUnitChanged();
  }

  navigateToNext(): void {
    if (!this.canNavigateNext) return;
    this.currentUnitIndex++;
    this.onUnitChanged();
  }

  private onUnitChanged(): void {
    this.unit = this.allUnits[this.currentUnitIndex];
    this.currentImageIndex = 0;
    this.mediaLoading = true;
    this.updateNavigationState();
    this.updateUrlWithUnit();

    const newOwnerId = this.resolveOwnerId(this.unit);
    if (newOwnerId !== this.currentOwnerId) {
      this.currentOwnerId = newOwnerId;
      // Réinitialiser l'état premium pour la nouvelle unité
      this.hasPremiumAccess = false;
      this.ownerInfo = null;
      this.premiumError = null;
      this.initPremiumState();
      // Réabonner le store au nouvel ownerId
      this.destroy$.next(); // Couper les anciens abonnements
      this.destroy$ = new Subject<void>();
      this.subscribeToPremiumStore();
    }

    this.cdr.markForCheck();
    setTimeout(() => this.buildMediaItems());
  }

  closeDialog(): void {
    this.removeUnitFromUrl();
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    this.dialogRef.close(null);
  }

  // ── URL ──────────────────────────────────────────────────────────────────

  private updateUrlWithUnit(): void {
    const currentParams = this.route.snapshot.queryParams;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...currentParams, unit: this.unit._id },
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

  // ── Médias ───────────────────────────────────────────────────────────────

  private collectRawUrls(): string[] {
    const raw: string[] = [];
    const push = (url: any) => { if (url && typeof url === 'string' && url.trim()) raw.push(url.trim()); };
    (this.unit?.medias ?? []).forEach(push);
    (this.unit?.property?.medias ?? []).forEach(push);
    push(this.unit?.property?.image);
    push((this.unit as any)?.image);
    return [...new Set(raw)];
  }

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

  // ── Navigation images ────────────────────────────────────────────────────

  previousImage(): void {
    if (this.unitMediaItems.length <= 1) return;
    this.currentImageIndex = this.currentImageIndex === 0 ? this.unitMediaItems.length - 1 : this.currentImageIndex - 1;
  }

  nextImage(): void {
    if (this.unitMediaItems.length <= 1) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.unitMediaItems.length;
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.unitMediaItems.length) this.currentImageIndex = index;
  }

  getSliderTransform(): string {
    return `translateX(-${this.currentImageIndex * 100}%)`;
  }

  // ── Touch ────────────────────────────────────────────────────────────────

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
    if (deltaX > deltaY && deltaX > 5) event.preventDefault();
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    const dist = this.touchStartX - this.touchEndX;
    if (Math.abs(dist) > this.minSwipeDistance) {
      dist > 0 ? this.nextImage() : this.previousImage();
    }
  }

  onTouchCancel(_event: TouchEvent): void {
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  // ── Galerie ──────────────────────────────────────────────────────────────

  openImageGallery(): void {
    const current = this.unitMediaItems[this.currentImageIndex];
    if (current?.type === 'panorama') {
      this.panoramaFullscreenUrl = current.url;
    } else {
      this.isImageGalleryVisible = true;
    }
  }

  closeImageGallery(): void { this.isImageGalleryVisible = false; }
  openPanoramaFullscreen(url: string): void { this.panoramaFullscreenUrl = url; }
  closePanoramaFullscreen(): void { this.panoramaFullscreenUrl = null; }

  // ── Utilitaires ──────────────────────────────────────────────────────────

  trackByIndex(index: number): number { return index; }
  onImageError(event: any, _index: number): void { event.target.src = '/assets/images/placeholder-room.jpg'; }
  onImageLoad(_event: any, _index: number): void {}

  formatPrice(price: number): string {
    if (!price) return '0';
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  // ── Équipements ──────────────────────────────────────────────────────────

  hasAmenity(amenity: string): boolean {
    if (!this.unit) return false;
    switch (amenity) {
      case 'kitchen': return this.unit.specifity?.hasKitchen || false;
      case 'privateShower': return this.unit.specifity?.isInternalShower || false;
      case 'parking': return this.unit.property?.hasParking || false;
      case 'security': return this.unit.property?.hasClosure || false;
      default: return false;
    }
  }

  // ── Contact propriétaire / agent ─────────────────────────────────────────

  isPropertyManagedByAgent(): boolean {
    const hasAgent = !!(this.unit?.property?.managedByAgent || this.unit?.property?.isManaged);
    if (!hasAgent) return false;
    const displayMode = this.unit?.property?.managedByAgent?.agentProfile?.contactDisplayMode || 'AGENCY';
    return displayMode !== 'OWNER';
  }

  getContactPersonTitle(): string {
    return this.isPropertyManagedByAgent()
      ? this.translate.instant('UNIT_DETAIL.CONTACT.AGENT_TITLE')
      : this.translate.instant('UNIT_DETAIL.CONTACT.OWNER_TITLE');
  }

  getContactPersonName(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.fullName
        || this.unit?.property?.managedByAgent?.name
        || this.unit?.property?.managedByAgent?.agentProfile?.businessName
        || this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_AGENT');
    }
    return this.unit?.property?.owner?.fullName
      || this.unit?.property?.owner?.name
      || this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_OWNER');
  }

  getContactPersonInitials(): string {
    const name = this.getContactPersonName();
    if (name === this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_AGENT')) return 'AC';
    if (name === this.translate.instant('UNIT_DETAIL.CONTACT.CERTIFIED_OWNER')) return 'PC';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }

  getContactPersonBadge(): string {
    return this.isPropertyManagedByAgent() ? 'UNIT_DETAIL.CONTACT.VERIFIED_AGENT' : 'UNIT_DETAIL.CONTACT.VERIFIED';
  }

  getAgencyName(): string {
    return this.unit?.property?.managedByAgent?.agentProfile?.businessName
      || this.unit?.property?.managedByAgent?.businessName
      || this.unit?.property?.managedByAgent?.agencyName
      || this.unit?.property?.managedByAgent?.company
      || this.translate.instant('UNIT_DETAIL.AGENCY.DEFAULT_NAME');
  }

  getAgencyLogo(): string | null {
    return this.unit?.property?.managedByAgent?.agentProfile?.businessLogoUrl
      || this.unit?.property?.managedByAgent?.businessLogoUrl
      || this.unit?.property?.managedByAgent?.agencyLogo
      || this.unit?.property?.managedByAgent?.logo
      || null;
  }

  getAgencyPhone(): string {
    return this.unit?.property?.managedByAgent?.phoneNumber
      || this.unit?.property?.managedByAgent?.agencyPhone
      || '';
  }

  getContactPhone(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.phoneNumber
        || this.unit?.property?.managedByAgent?.phone || '';
    }
    return this.ownerInfo?.owner?.phone || '';
  }

  getContactEmail(): string {
    if (this.isPropertyManagedByAgent()) {
      return this.unit?.property?.managedByAgent?.email || this.ownerInfo?.owner?.email || '';
    }
    return this.ownerInfo?.owner?.email || '';
  }

  getContactWhatsApp(): string { return this.getContactPhone(); }

  getWhatsAppLink(): string {
    return `https://wa.me/${this.getContactPhone().replace(/\D/g, '')}`;
  }

  // ── Actions ──────────────────────────────────────────────────────────────

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
    const text = this.translate.instant('UNIT_DETAIL.SHARE.TEXT', {
      name: this.unit.property?.name || this.unit.code,
      price: this.formatPrice(this.unit.price)
    });
    navigator.clipboard.writeText(`${text} ${window.location.href}`).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = `${text} ${window.location.href}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  onContactOwner(): void {
    if (!this.unit) return;
    if (this.hasPremiumAccess && this.ownerInfo?.owner?.phone) {
      window.open(`tel:${this.ownerInfo.owner.phone}`, '_self');
      return;
    }
    this.showPremiumModal = true;
  }

  onPurchasePremiumAccess(): void { this.showPremiumModal = true; }
  closePremiumModal(): void { this.showPremiumModal = false; }
  onPremiumAccessGranted(): void { this.showPremiumModal = false; }

  getRemainingDaysText(): string {
    return this.translate.instant('UNIT_DETAIL.PREMIUM.REMAINING_DAYS');
  }

  copyToClipboard(text: string, _type: string): void {
    navigator.clipboard.writeText(text);
  }

  openMap(): void {
    const address = this.unit.property?.location;
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  }

  getOwnerInitials(owner: any): string {
    if (!owner?.fullName) return 'PC';
    return owner.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }
}
