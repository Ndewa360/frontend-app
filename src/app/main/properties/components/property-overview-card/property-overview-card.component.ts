import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PropertyModel } from 'src/app/shared/store';
import { BaseComponent } from 'src/app/shared/utils/base-component';
import { PropertyImageService } from 'src/app/shared/services/property-image.service';

export interface PropertyAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  actionRoute?: string;
}

@Component({
  selector: 'app-property-overview-card',
  templateUrl: './property-overview-card.component.html',
  styleUrls: ['./property-overview-card.component.scss']
})
export class PropertyOverviewCardComponent extends BaseComponent implements OnInit {
  @Input() property!: PropertyModel;
  @Input() occupancyRate: number = 0;
  @Input() monthlyRevenue: number = 0;
  @Input() revenueGrowth: number = 0;
  @Input() overduePayments: number = 0;
  @Input() freeRooms: number = 0;
  @Input() totalRooms: number = 0;
  @Input() occupiedRooms: number = 0;
  @Input() alerts: PropertyAlert[] = [];
  @Input() isLoading: boolean = false;

  @Output() addTenantClicked = new EventEmitter<PropertyModel>();
  @Output() recordPaymentClicked = new EventEmitter<PropertyModel>();
  @Output() viewFinancesClicked = new EventEmitter<PropertyModel>();
  @Output() alertClicked = new EventEmitter<PropertyAlert>();
  @Output() propertyViewed = new EventEmitter<PropertyModel>();
  @Output() propertyEdited = new EventEmitter<PropertyModel>();
  @Output() favoriteToggled = new EventEmitter<PropertyModel>();
  @Output() quickActionClicked = new EventEmitter<PropertyModel>();

  hasAlerts: boolean = false;

  constructor(
    public propertyImageService: PropertyImageService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.hasAlerts = this.alerts && this.alerts.length > 0;
    
    // Calculer les métriques dérivées si nécessaire
    if (this.totalRooms > 0 && this.occupancyRate === 0) {
      this.occupancyRate = Math.round((this.occupiedRooms / this.totalRooms) * 100);
    }
    
    if (this.totalRooms > 0 && this.freeRooms === 0) {
      this.freeRooms = this.totalRooms - this.occupiedRooms;
    }
  }

  addTenant(): void {
    this.addTenantClicked.emit(this.property);
  }

  recordPayment(): void {
    this.recordPaymentClicked.emit(this.property);
  }

  viewFinances(): void {
    this.viewFinancesClicked.emit(this.property);
  }

  onAlertClick(alert: PropertyAlert): void {
    this.alertClicked.emit(alert);
  }

  getOccupancyStatusClass(): string {
    if (this.occupancyRate >= 90) return 'status-excellent';
    if (this.occupancyRate >= 70) return 'status-good';
    if (this.occupancyRate >= 50) return 'status-warning';
    return 'status-critical';
  }

  getRevenueGrowthClass(): string {
    if (this.revenueGrowth > 0) return 'text-green-600';
    if (this.revenueGrowth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getOverduePaymentsClass(): string {
    if (this.overduePayments === 0) return 'text-green-600';
    if (this.overduePayments <= 2) return 'text-yellow-600';
    return 'text-red-600';
  }

  getAlertClass(alert: PropertyAlert): string {
    switch (alert.type) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getRevenueGrowthPrefix(): string {
    return this.revenueGrowth > 0 ? '+' : '';
  }

  // Nouvelles méthodes pour le design moderne
  viewProperty(): void {
    // Empêcher les clics multiples si la propriété est en cours de chargement
    if (this.isLoading) {
      console.log(`⏳ Propriété ${this.property._id} déjà en cours de chargement, clic ignoré`);
      return;
    }

    this.propertyViewed.emit(this.property);
  }

  editProperty(): void {
    this.propertyEdited.emit(this.property);
  }

  toggleFavorite(): void {
    this.favoriteToggled.emit(this.property);
  }

  quickAction(): void {
    this.quickActionClicked.emit(this.property);
  }

  getStatusLabel(): string {
    if (this.occupancyRate >= 90) return this.translate.instant('PROPERTIES.CARD.STATUS.EXCELLENT');
    if (this.occupancyRate >= 70) return this.translate.instant('PROPERTIES.CARD.STATUS.GOOD');
    if (this.occupancyRate >= 50) return this.translate.instant('PROPERTIES.CARD.STATUS.AVERAGE');
    return this.translate.instant('PROPERTIES.CARD.STATUS.POOR');
  }

  getPropertyImage(): string {
    return this.propertyImageService.getPropertyImage(this.property.image, this.property._id);
  }

  getPropertyColor(): string {
    return this.propertyImageService.getPropertyColor(this.property._id);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.propertyImageService.getDefaultImage(this.property._id);
  }
}
