import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PropertyModel } from 'src/app/shared/store';
import { BaseComponent } from 'src/app/shared/utils/base-component';

export interface PropertyMetrics {
  occupancyRate: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  overduePayments: number;
  overdueAmount: number;
  maintenanceRequests: number;
  urgentMaintenance: number;
  occupiedRooms: number;
  totalRooms: number;
  freeRooms: number;
}

export interface PropertyAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  actionRoute?: string;
  data?: any;
}

export interface PropertyAction {
  type: 'view' | 'edit' | 'addTenant' | 'recordPayment' | 'viewFinances' | 'alert' | 'more';
  property: PropertyModel;
  data?: any;
}

@Component({
  selector: 'app-enhanced-property-card',
  templateUrl: './enhanced-property-card.component.html',
  styleUrls: ['./enhanced-property-card.component.scss']
})
export class EnhancedPropertyCardComponent extends BaseComponent implements OnInit {
  @Input() property!: PropertyModel;
  @Input() metrics!: PropertyMetrics;
  @Input() alerts: PropertyAlert[] = [];
  @Input() loading: boolean = false;

  @Output() propertyClicked = new EventEmitter<PropertyModel>();
  @Output() actionClicked = new EventEmitter<PropertyAction>();

  hasAlerts: boolean = false;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.hasAlerts = this.alerts && this.alerts.length > 0;
    
    // Validation des métriques
    if (!this.metrics) {
      this.metrics = this.getDefaultMetrics();
    }
  }

  // Gestion des clics
  onCardClick(): void {
    if (!this.loading) {
      this.propertyClicked.emit(this.property);
    }
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'view',
      property: this.property
    });
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'edit',
      property: this.property
    });
  }

  onMoreActions(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'more',
      property: this.property
    });
  }

  onAddTenant(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'addTenant',
      property: this.property
    });
  }

  onRecordPayment(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'recordPayment',
      property: this.property
    });
  }

  onViewFinances(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'viewFinances',
      property: this.property
    });
  }

  onAlertClick(alert: PropertyAlert, event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'alert',
      property: this.property,
      data: alert
    });
  }

  onViewAllAlerts(event: Event): void {
    event.stopPropagation();
    this.actionClicked.emit({
      type: 'alert',
      property: this.property,
      data: { viewAll: true }
    });
  }

  // Classes CSS dynamiques
  getCardStatusClass(): string {
    const occupancyRate = this.metrics.occupancyRate;
    if (occupancyRate >= 90) return 'status-excellent';
    if (occupancyRate >= 70) return 'status-good';
    if (occupancyRate >= 50) return 'status-warning';
    return 'status-critical';
  }

  getStatusBadgeClass(): string {
    const occupancyRate = this.metrics.occupancyRate;
    if (occupancyRate === 100) return 'full';
    if (occupancyRate === 0) return 'available';
    if (this.metrics.maintenanceRequests > 0) return 'maintenance';
    return 'partial';
  }

  getStatusText(): string {
    const occupancyRate = this.metrics.occupancyRate;
    if (occupancyRate === 100) return 'Complet';
    if (occupancyRate === 0) return 'Disponible';
    if (this.metrics.maintenanceRequests > 0) return 'Maintenance';
    return 'Partiellement occupé';
  }

  getPerformanceClass(): string {
    const occupancyRate = this.metrics.occupancyRate;
    if (occupancyRate >= 90) return 'excellent';
    if (occupancyRate >= 70) return 'good';
    if (occupancyRate >= 50) return 'warning';
    return 'critical';
  }

  getOccupancyClass(): string {
    const occupancyRate = this.metrics.occupancyRate;
    if (occupancyRate >= 80) return 'excellent';
    if (occupancyRate >= 60) return 'good';
    if (occupancyRate >= 40) return 'warning';
    return 'critical';
  }

  getRevenueGrowthClass(): string {
    const growth = this.metrics.revenueGrowth;
    if (growth > 0) return 'positive';
    if (growth < 0) return 'negative';
    return '';
  }

  getOverdueClass(): string {
    const overdue = this.metrics.overduePayments;
    if (overdue === 0) return 'excellent';
    if (overdue <= 2) return 'warning';
    return 'critical';
  }

  getMaintenanceClass(): string {
    const maintenance = this.metrics.maintenanceRequests;
    const urgent = this.metrics.urgentMaintenance;
    
    if (urgent > 0) return 'critical';
    if (maintenance > 3) return 'warning';
    return 'good';
  }

  getAlertClass(alert: PropertyAlert): string {
    return alert.type;
  }

  // Métriques par défaut
  private getDefaultMetrics(): PropertyMetrics {
    return {
      occupancyRate: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      overduePayments: 0,
      overdueAmount: 0,
      maintenanceRequests: 0,
      urgentMaintenance: 0,
      occupiedRooms: 0,
      totalRooms: this.property.roomLength || 0,
      freeRooms: this.property.roomLength || 0
    };
  }

  // Formatage des devises
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Formatage des pourcentages
  formatPercentage(value: number): string {
    return `${value}%`;
  }

  // Gestion des images
  onImageError(event: any): void {
    event.target.src = '/assets/images/property-placeholder.jpg';
  }
}
