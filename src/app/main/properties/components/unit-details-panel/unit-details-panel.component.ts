import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import {
  RoomModel,
  LocataireModel,
  LocataireState,
  RoomType
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UnitDetailsService, UnitDetailsData } from '../../services/unit-details.service';
import { PaymentAction } from './components/unit-payments-tab/unit-payments-tab.component';

export interface UnitPanelAction {
  type: 'edit' | 'assign_tenant' | 'terminate_lease' | 'add_payment' | 'view_contract' | 'view_image' |
        'view_payment' | 'edit_payment' | 'delete_payment' | 'generate_payment_link' | 'edit_gallery' | 'view_media' | 'delete_media';
  room: RoomModel;
  data?: any;
}

@Component({
  selector: 'app-unit-details-panel',
  templateUrl: './unit-details-panel.component.html',
  styleUrls: ['./unit-details-panel.component.scss'],
  animations: [
    trigger('slideIn', [
      state('false', style({
        transform: 'translateX(100%)',
        visibility: 'hidden'
      })),
      state('true', style({
        transform: 'translateX(0)',
        visibility: 'visible'
      })),
      transition('false => true', [
        style({ visibility: 'visible' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'),
        style({ visibility: 'hidden' })
      ])
    ]),
    trigger('contentFade', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms 100ms ease-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class UnitDetailsPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() room: RoomModel | null = null;
  @Input() propertyId: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<UnitPanelAction>();

  unitData: UnitDetailsData | null = null;
  activeTabIndex: number = 0;
  showAddPaymentModal: boolean = false;
  isContentVisible: boolean = true;
  private previousRoomId: string | null = null;

  tabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      id: 'tenant',
      label: 'Locataire',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    },
    {
      id: 'gallery',
      label: 'Galerie',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private unitDetailsService: UnitDetailsService
  ) {}

  ngOnInit(): void {
    this.loadUnitData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Détecter le changement d'unité pour animer la transition
    if (changes['room'] && !changes['room'].firstChange) {
      const currentRoomId = this.room?._id;
      const previousRoomId = changes['room'].previousValue?._id;

      if (currentRoomId !== previousRoomId && currentRoomId && previousRoomId) {
        // Nouvelle unité sélectionnée - animer la transition
        this.animateContentChange();
      }
    }

    // Gestion du scroll du body
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          this.isContentVisible = true;
        }, 100);
      } else {
        // Restaurer le scroll du body
        document.body.style.overflow = 'auto';
        this.isContentVisible = false;
      }
    }

    // Charger les données si la room ou propertyId change
    if ((changes['room'] || changes['propertyId']) && this.room && this.propertyId) {
      this.loadUnitData();
    }
  }

  ngOnDestroy(): void {
    // Restaurer le scroll du body au cas où le composant serait détruit avec le panneau ouvert
    document.body.style.overflow = 'auto';
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(_event: KeyboardEvent): void {
    if (this.isOpen) {
      this.closePanel();
    }
  }

  private loadUnitData(): void {
    if (!this.room || !this.propertyId) return;

    this.unitDetailsService.loadUnitDetails(this.room, this.propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(unitData => {
        this.unitData = unitData;
      });
  }

  private animateContentChange(): void {
    // Masquer le contenu avec animation
    this.isContentVisible = false;

    // Attendre la fin de l'animation de sortie puis recharger et réafficher
    setTimeout(() => {
      this.loadUnitData();
      this.activeTabIndex = 0; // Revenir au premier onglet
      this.isContentVisible = true;
    }, 200);
  }

  closePanel(): void {
    this.close.emit();
  }

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }

  getRoomName(): string {
    return this.room?.code || `Unité ${this.room?._id?.substring(0, 8)}`;
  }

  getRoomTypeLabel(): string {
    if (!this.room?.type) return 'Type inconnu';
    return UtilsString.getStringOfRoomType(this.room.type);
  }

  getRoomStatus(): 'occupied' | 'available' | 'maintenance' {
    if (!this.room) return 'maintenance';
    if (this.room.isFree === true) return 'available';
    if (this.room.isFree === false && this.room.locataire) return 'occupied';
    return 'maintenance';
  }

  getRoomStatusLabel(): string {
    const status = this.getRoomStatus();
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupée';
      case 'maintenance': return 'En maintenance';
      default: return 'Statut inconnu';
    }
  }

  getTenantName(): string {
    return this.unitData?.tenant?.fullName || this.unitData?.tenant?.name || 'Locataire inconnu';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Actions
  onEditRoom(): void {
    if (this.room) {
      this.action.emit({
        type: 'edit',
        room: this.room
      });
    }
  }

  onAssignTenant(): void {
    if (this.room) {
      this.action.emit({
        type: 'assign_tenant',
        room: this.room
      });
    }
  }

  onEditTenant(): void {
    if (this.room && this.unitData?.tenant) {
      this.action.emit({
        type: 'edit',
        room: this.room,
        data: { tenant: this.unitData.tenant }
      });
    }
  }

  // Méthode supprimée - dupliquée plus bas

  onAddPayment(): void {
    if (this.room) {
      this.action.emit({
        type: 'add_payment',
        room: this.room
      });
    }
  }

  onViewContract(event?: any): void {
    if (this.room) {
      this.action.emit({
        type: 'view_contract',
        room: this.room,
        data: event
      });
    }
  }

  onCancelContract(event?: any): void {
    if (this.room) {
      this.action.emit({
        type: 'terminate_lease',
        room: this.room,
        data: event
      });
    }
  }

  onViewPayment(event: any): void {
    if (this.room) {
      this.action.emit({
        type: 'view_payment',
        room: this.room,
        data: event
      });
    }
  }

  onEditPayment(event: any): void {
    if (this.room) {
      this.action.emit({
        type: 'edit_payment',
        room: this.room,
        data: event
      });
    }
  }

  onEditGallery(): void {
    console.log('🎨 UnitDetailsPanel: onEditGallery appelé', this.room);
    if (this.room) {
      console.log('🎨 UnitDetailsPanel: Émission de l\'action edit_gallery');
      this.action.emit({
        type: 'edit_gallery',
        room: this.room
      });
    }
  }

  onViewMedia(event: any): void {
    if (this.room) {
      this.action.emit({
        type: 'view_media',
        room: this.room,
        data: event
      });
    }
  }

  onDeleteMedia(event: any): void {
    if (this.room) {
      this.action.emit({
        type: 'delete_media',
        room: this.room,
        data: event
      });
    }
  }

  onDeletePayment(payment: any): void {
    console.log('🗑️ UnitDetailsPanel: onDeletePayment appelé', payment);
    if (this.room) {
      console.log('🗑️ UnitDetailsPanel: Émission de l\'action delete_payment');
      this.action.emit({
        type: 'delete_payment',
        room: this.room,
        data: payment
      });
    }
  }

  onGeneratePaymentLink(): void {
    console.log('🔗 UnitDetailsPanel: onGeneratePaymentLink appelé', this.room);
    if (this.room) {
      console.log('🔗 UnitDetailsPanel: Émission de l\'action generate_payment_link');
      this.action.emit({
        type: 'generate_payment_link',
        room: this.room,
        data: {
          tenant: this.unitData?.tenant,
          location: this.unitData?.location
        }
      });
    }
  }

  trackByPaymentId(index: number, payment: any): string {
    return payment._id || payment.billingRef || index.toString();
  }

  // Méthode supprimée - dupliquée plus bas

  // Nouvelle méthode pour gérer les actions de paiement
  onPaymentAction(paymentAction: PaymentAction): void {
    switch (paymentAction.type) {
      case 'add':
        this.showAddPaymentModal = true;
        break;
      case 'view':
        console.log('Voir les détails du paiement:', paymentAction.data);
        // TODO: Implémenter la visualisation des détails du paiement
        break;
      case 'edit':
        console.log('Modifier le paiement:', paymentAction.data);
        // TODO: Implémenter la modification du paiement
        break;
      case 'delete':
        this.onDeletePayment(paymentAction.data);
        break;
      case 'export':
        console.log('Export CSV effectué');
        break;
    }
  }



  onPaymentAdded(payment: any): void {
    console.log('Paiement ajouté:', payment);
    // Recharger les données de l'unité
    if (this.room && this.propertyId) {
      this.loadUnitData();
    }
  }

  closeAddPaymentModal(): void {
    this.showAddPaymentModal = false;
  }

  // Nouvelles méthodes pour les 4 sections

  // === SECTION PAIEMENTS ===
  private getPayments(): any[] {
    // Vérifier d'abord dans payments, puis dans paymentHistory.transactions
    let payments = this.unitData?.payments || [];

    if (payments.length === 0 && this.unitData?.paymentHistory?.transactions) {
      payments = this.unitData.paymentHistory.transactions;
    }

    return payments;
  }

  getPaymentCount(): number {
    return this.getPayments().length;
  }

  getTotalPayments(): number {
    const payments = this.getPayments();
    return payments.reduce((total, payment) => total + (payment.locationPaymentPrice || 0), 0);
  }

  getAveragePayment(): number {
    const count = this.getPaymentCount();
    return count > 0 ? this.getTotalPayments() / count : 0;
  }

  getPaymentsByTenant(): any[] {
    const payments = this.getPayments();

    if (payments.length === 0) {
      return [];
    }

    // Grouper les paiements par locataire
    const grouped = payments.reduce((groups: any, payment: any) => {
      const tenantId = payment.locataire || 'unknown';
      if (!groups[tenantId]) {
        groups[tenantId] = {
          tenantId,
          tenantName: this.getTenantNameById(tenantId),
          payments: [],
          total: 0,
          dateRange: { start: null, end: null }
        };
      }
      groups[tenantId].payments.push(payment);
      groups[tenantId].total += payment.locationPaymentPrice || 0;

      // Calculer la plage de dates
      const paymentDate = new Date(payment.datePayment);
      if (!groups[tenantId].dateRange.start || paymentDate < groups[tenantId].dateRange.start) {
        groups[tenantId].dateRange.start = paymentDate;
      }
      if (!groups[tenantId].dateRange.end || paymentDate > groups[tenantId].dateRange.end) {
        groups[tenantId].dateRange.end = paymentDate;
      }

      return groups;
    }, {});

    // Convertir en tableau et trier par date
    return Object.values(grouped).sort((a: any, b: any) =>
      new Date(b.dateRange.end).getTime() - new Date(a.dateRange.end).getTime()
    );
  }

  getTenantNameById(tenantId: string): string {
    if (tenantId === 'unknown') return 'Locataire inconnu';
    // Chercher le locataire dans les données
    const tenant = this.unitData?.tenant;
    if (tenant && tenant._id === tenantId) {
      return tenant.fullName || tenant.name || 'Locataire';
    }
    return 'Locataire introuvable';
  }

  formatPaymentDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatPaymentTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateRange(range: { start: Date, end: Date }): string {
    if (!range.start || !range.end) return '';
    const start = this.formatPaymentDate(range.start);
    const end = this.formatPaymentDate(range.end);
    return start === end ? start : `${start} - ${end}`;
  }

  getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'LOCATION': return 'Loyer';
      case 'CAUTION': return 'Caution';
      default: return type || 'Autre';
    }
  }

  trackByTenantId(_: number, item: any): string {
    return item.tenantId;
  }

  // === SECTION GALERIE ===
  getMediaItems(): string[] {
    return this.room?.medias || [];
  }

  getTotalMediaCount(): number {
    return this.getMediaItems().length;
  }

  getMediaCount(type?: string): number {
    if (!type) return this.getTotalMediaCount();

    const items = this.getMediaItems();
    return items.filter(media => this.getMediaType(media) === type).length;
  }

  getMediaType(mediaUrl: string): 'image' | 'video' | '360' {
    if (!mediaUrl) return 'image';

    const url = mediaUrl.toLowerCase();
    if (url.includes('360') || url.includes('panorama') || url.includes('pano')) {
      return '360';
    }
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('video')) {
      return 'video';
    }
    return 'image';
  }

  getMediaTypeLabel(mediaUrl: string): string {
    const type = this.getMediaType(mediaUrl);
    switch (type) {
      case 'image': return 'Photo';
      case 'video': return 'Vidéo';
      case '360': return '360°';
      default: return 'Média';
    }
  }

  trackByMediaUrl(_: number, media: string): string {
    return media;
  }

  getMediaQualityScore(): number {
    const totalMedia = this.getTotalMediaCount();
    if (totalMedia === 0) return 0;

    // Score basé sur la diversité des types de médias
    const hasImages = this.getMediaCount('image') > 0;
    const hasVideos = this.getMediaCount('video') > 0;
    const has360 = this.getMediaCount('360') > 0;

    let score = 0;
    if (hasImages) score += 40;
    if (hasVideos) score += 30;
    if (has360) score += 30;

    // Bonus pour la quantité
    if (totalMedia >= 5) score += 10;
    else if (totalMedia >= 3) score += 5;

    return Math.min(score, 100);
  }

  getMediaVariety(): string {
    const types = [];
    if (this.getMediaCount('image') > 0) types.push('Photos');
    if (this.getMediaCount('video') > 0) types.push('Vidéos');
    if (this.getMediaCount('360') > 0) types.push('360°');

    if (types.length === 0) return 'Aucune';
    if (types.length === 1) return 'Basique';
    if (types.length === 2) return 'Bonne';
    return 'Excellente';
  }

  getRoomMainImage(): string | null {
    const medias = this.getMediaItems();
    if (medias.length > 0) {
      // Retourner la première image trouvée
      const firstImage = medias.find(media => this.getMediaType(media) === 'image');
      return firstImage || medias[0];
    }
    return null;
  }

  getLastPaymentDate(): string | Date | null {
    const payments = this.getPayments();
    if (payments.length === 0) return null;

    // Trier les paiements par date décroissante et prendre le premier
    const sortedPayments = [...payments].sort((a, b) => {
      const dateA = new Date(a.datePayment || a.createdAt);
      const dateB = new Date(b.datePayment || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedPayments[0]?.datePayment || sortedPayments[0]?.createdAt || null;
  }

  viewPaymentDetails(payment: any): void {
    // Émettre l'action pour voir les détails du paiement
    this.action.emit({
      type: 'edit', // Utiliser un type existant
      room: this.room,
      data: { payment, action: 'view_payment' }
    });
  }

  editPayment(payment: any): void {
    // Émettre l'action pour modifier le paiement
    this.action.emit({
      type: 'edit', // Utiliser un type existant
      room: this.room,
      data: { payment, action: 'edit_payment' }
    });
  }



  is360Media(media: any): boolean {
    if (typeof media === 'string') {
      return false; // Les strings ne peuvent pas être des 360°
    }
    return media.type === '360' || media.is360 === true;
  }

  getMediaUrl(media: any): string {
    if (typeof media === 'string') {
      return media;
    }
    return media.url || media.src || '';
  }

  getMediaName(media: any): string {
    if (typeof media === 'string') {
      return media.split('/').pop() || '';
    }
    return media.name || media.title || '';
  }

  trackByMediaId(index: number, media: any): string {
    if (typeof media === 'string') {
      return media;
    }
    return media.id || media._id || index.toString();
  }



  openImageViewer(url: string): void {
    // Ouvrir le visualiseur d'image
    this.action.emit({
      type: 'view_image',
      room: this.room,
      data: { url }
    });
  }

  openVideoViewer(url: string): void {
    // Ouvrir le lecteur vidéo
    this.action.emit({
      type: 'view_image', // Utiliser un type existant
      room: this.room,
      data: { url, mediaType: 'video' }
    });
  }

  open360Viewer(url: string): void {
    // Ouvrir le visualiseur 360°
    this.action.emit({
      type: 'view_image', // Utiliser un type existant
      room: this.room,
      data: { url, mediaType: '360' }
    });
  }



  deleteMedia(media: any): void {
    // Émettre l'action pour supprimer le média
    this.action.emit({
      type: 'edit', // Utiliser un type existant
      room: this.room,
      data: { media, action: 'delete_media' }
    });
  }

  // === ACTIONS SUPPLÉMENTAIRES ===
  onTerminateLease(): void {
    this.action.emit({
      type: 'terminate_lease',
      room: this.room
    });
  }
}
