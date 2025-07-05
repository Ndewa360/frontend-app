import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Models et interfaces
import { SearchPropertyModel } from 'src/app/shared/store';

/**
 * Composant modal pour afficher les détails d'une unité locative
 * Suit les principes SOLID :
 * - Single Responsibility: Affichage des détails d'unité uniquement
 * - Open/Closed: Extensible via @Input et @Output
 * - Liskov Substitution: Implémente les interfaces Angular standard
 * - Interface Segregation: Interfaces spécifiques pour chaque responsabilité
 * - Dependency Inversion: Dépend d'abstractions (Router, ActivatedRoute)
 */
@Component({
  selector: 'app-unit-detail-modal',
  templateUrl: './unit-detail-modal.component.html',
  styleUrls: ['./unit-detail-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitDetailModalComponent implements OnInit, OnDestroy {
  
  // === INPUTS ET OUTPUTS ===
  @Input() unit: SearchPropertyModel | null = null;
  @Input() allUnits: SearchPropertyModel[] = [];

  private _isVisible = false;
  @Input()
  get isVisible(): boolean {
    return this._isVisible;
  }
  set isVisible(value: boolean) {
    const previousValue = this._isVisible;
    this._isVisible = value;

    // Gérer le scroll global quand la visibilité change
    if (value && !previousValue) {
      // Modal s'ouvre
      this.blockGlobalScroll();
    } else if (!value && previousValue) {
      // Modal se ferme
      this.unblockGlobalScroll();
    }
  }
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() unitChanged = new EventEmitter<SearchPropertyModel>();
  @Output() contactOwner = new EventEmitter<SearchPropertyModel>();

  // === ÉTAT DU COMPOSANT ===
  currentImageIndex = 0;
  isImageGalleryOpen = false;
  isContactFormOpen = false;
  
  // === NAVIGATION ENTRE UNITÉS ===
  currentUnitIndex = 0;
  canNavigatePrevious = false;
  canNavigateNext = false;

  // === GESTION DU CYCLE DE VIE ===
  private destroy$ = new Subject<void>();

  // === UTILITAIRES POUR LE TEMPLATE ===
  Math = Math;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.updateNavigationState();
    this.setupKeyboardNavigation();

    // Bloquer le scroll global quand le modal s'ouvre
    if (this.isVisible) {
      this.blockGlobalScroll();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Débloquer le scroll global quand le composant est détruit
    this.unblockGlobalScroll();
  }

  // === GESTION DE LA NAVIGATION ===
  
  /**
   * Met à jour l'état de navigation entre unités
   */
  private updateNavigationState(): void {
    if (!this.unit || !this.allUnits.length) {
      this.canNavigatePrevious = false;
      this.canNavigateNext = false;
      return;
    }

    this.currentUnitIndex = this.allUnits.findIndex(u => u._id === this.unit?._id);
    this.canNavigatePrevious = this.currentUnitIndex > 0;
    this.canNavigateNext = this.currentUnitIndex < this.allUnits.length - 1;
  }

  /**
   * Navigation vers l'unité précédente
   */
  navigateToPrevious(): void {
    if (this.canNavigatePrevious) {
      const previousUnit = this.allUnits[this.currentUnitIndex - 1];
      this.changeUnit(previousUnit);
    }
  }

  /**
   * Navigation vers l'unité suivante
   */
  navigateToNext(): void {
    if (this.canNavigateNext) {
      const nextUnit = this.allUnits[this.currentUnitIndex + 1];
      this.changeUnit(nextUnit);
    }
  }

  /**
   * Change l'unité affichée et met à jour l'URL
   */
  private changeUnit(newUnit: SearchPropertyModel): void {
    this.unit = newUnit;
    this.currentImageIndex = 0; // Reset image gallery
    this.updateNavigationState();
    this.updateUrl();
    this.unitChanged.emit(newUnit);
  }

  // === GESTION DES IMAGES ===

  /**
   * Obtient la liste des médias avec fallback
   */
  getUnitImages(): string[] {
    if (this.unit?.medias && this.unit.medias.length > 0) {
      return this.unit.medias;
    }
    return ['/assets/images/placeholder-room.jpg'];
  }

  /**
   * Navigation dans la galerie d'images
   */
  previousImage(): void {
    const images = this.getUnitImages();
    this.currentImageIndex = this.currentImageIndex > 0 
      ? this.currentImageIndex - 1 
      : images.length - 1;
  }

  nextImage(): void {
    const images = this.getUnitImages();
    this.currentImageIndex = this.currentImageIndex < images.length - 1 
      ? this.currentImageIndex + 1 
      : 0;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  /**
   * Ouvre la galerie d'images en plein écran
   */
  openImageGallery(): void {
    this.isImageGalleryOpen = true;
  }

  /**
   * Ferme la galerie d'images
   */
  closeImageGallery(): void {
    this.isImageGalleryOpen = false;
  }

  // === GESTION DU CONTACT ===

  /**
   * Ouvre le formulaire de contact
   */
  openContactForm(): void {
    this.isContactFormOpen = true;
  }

  /**
   * Ferme le formulaire de contact
   */
  closeContactForm(): void {
    this.isContactFormOpen = false;
  }

  /**
   * Émet l'événement de contact propriétaire
   */
  onContactOwner(): void {
    if (this.unit) {
      this.contactOwner.emit(this.unit);
    }
  }

  // === GESTION DE L'URL ===

  /**
   * Met à jour l'URL avec l'ID de l'unité
   */
  private updateUrl(): void {
    if (this.unit) {
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
  }

  /**
   * Ferme le modal et nettoie l'URL
   */
  onCloseModal(): void {
    // Supprimer le paramètre unit de l'URL
    const currentParams = { ...this.route.snapshot.queryParams };
    delete currentParams['unit'];
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: currentParams,
      replaceUrl: true
    });

    this.closeModal.emit();
  }

  // === NAVIGATION CLAVIER ===

  /**
   * Configure la navigation au clavier
   */
  private setupKeyboardNavigation(): void {
    // Implémentation de la navigation clavier
    // Sera ajoutée dans la prochaine itération
  }

  // === UTILITAIRES ===

  /**
   * Formate le prix avec la devise
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
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
    return owner.fullName[0].toUpperCase();
  }

  /**
   * Vérifie si l'unité a des équipements spécifiques
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
   * Bloque le scroll global de l'application de manière robuste
   */
  private blockGlobalScroll(): void {
    // Sauvegarder la position actuelle du scroll
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Bloquer le scroll sur le body et html de manière robuste
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.right = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';

    // Bloquer aussi sur html
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';

    // Sauvegarder les positions pour les restaurer plus tard
    document.body.setAttribute('data-scroll-y', scrollY.toString());
    document.body.setAttribute('data-scroll-x', scrollX.toString());

    // Empêcher les événements de scroll
    window.addEventListener('scroll', this.preventScroll, { passive: false });
    window.addEventListener('wheel', this.preventScroll, { passive: false });
    window.addEventListener('touchmove', this.preventScroll, { passive: false });
  }

  /**
   * Débloque le scroll global de l'application
   */
  private unblockGlobalScroll(): void {
    // Récupérer les positions sauvegardées
    const scrollY = document.body.getAttribute('data-scroll-y');
    const scrollX = document.body.getAttribute('data-scroll-x');

    // Supprimer les événements de prévention du scroll
    window.removeEventListener('scroll', this.preventScroll);
    window.removeEventListener('wheel', this.preventScroll);
    window.removeEventListener('touchmove', this.preventScroll);

    // Restaurer les styles du body
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.height = '';

    // Restaurer les styles du html
    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';

    // Restaurer la position du scroll
    if (scrollY && scrollX) {
      window.scrollTo(parseInt(scrollX, 10), parseInt(scrollY, 10));
      document.body.removeAttribute('data-scroll-y');
      document.body.removeAttribute('data-scroll-x');
    }
  }

  /**
   * Empêche les événements de scroll
   */
  private preventScroll = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
  }
}
