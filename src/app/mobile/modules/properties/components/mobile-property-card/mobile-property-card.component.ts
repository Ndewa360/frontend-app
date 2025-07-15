import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-mobile-property-card',
  templateUrl: './mobile-property-card.component.html',
  styleUrls: ['./mobile-property-card.component.scss']
})
export class MobilePropertyCardComponent {
  @Input() property: any;
  @Input() viewMode: 'list' | 'grid' = 'list';

  @Output() propertyClick = new EventEmitter<any>();
  @Output() unitsClick = new EventEmitter<any>();
  @Output() actionsClick = new EventEmitter<any>();

  /**
   * Gérer le clic sur la carte
   */
  onCardClick(): void {
    this.propertyClick.emit(this.property);
  }

  /**
   * Gérer le clic sur les unités
   */
  onUnitsClick(event: Event): void {
    event.stopPropagation();
    this.unitsClick.emit(this.property);
  }

  /**
   * Gérer le clic sur les actions
   */
  onActionsClick(event: Event): void {
    event.stopPropagation();
    this.actionsClick.emit(this.property);
  }

  /**
   * Obtenir l'image principale de la propriété
   */
  getMainImage(): string {
    if (this.property.images && this.property.images.length > 0) {
      return this.property.images[0];
    }
    return 'assets/images/placeholder-property.jpg';
  }

  /**
   * Obtenir le nombre d'images
   */
  getImageCount(): number {
    return this.property.images ? this.property.images.length : 0;
  }

  /**
   * Obtenir la localisation formatée
   */
  getLocation(): string {
    const parts = [];
    
    if (this.property.location) {
      parts.push(this.property.location);
    }
    
    if (this.property.city) {
      parts.push(this.property.city);
    }
    
    return parts.join(', ') || 'Localisation non spécifiée';
  }

  /**
   * Obtenir le nombre total d'unités
   */
  getTotalUnits(): number {
    return this.property.rooms ? this.property.rooms.length : 0;
  }

  /**
   * Obtenir le nombre d'unités disponibles
   */
  getAvailableUnits(): number {
    if (!this.property.rooms) return 0;
    return this.property.rooms.filter(room => room.status === 'AVAILABLE').length;
  }

  /**
   * Obtenir le nombre d'unités occupées
   */
  getOccupiedUnits(): number {
    if (!this.property.rooms) return 0;
    return this.property.rooms.filter(room => room.status === 'OCCUPIED').length;
  }

  /**
   * Obtenir le nombre d'unités en maintenance
   */
  getMaintenanceUnits(): number {
    if (!this.property.rooms) return 0;
    return this.property.rooms.filter(room => room.status === 'MAINTENANCE').length;
  }

  /**
   * Obtenir le taux d'occupation
   */
  getOccupancyRate(): number {
    const total = this.getTotalUnits();
    if (total === 0) return 0;
    
    const occupied = this.getOccupiedUnits();
    return Math.round((occupied / total) * 100);
  }

  /**
   * Obtenir la couleur du taux d'occupation
   */
  getOccupancyColor(): string {
    const rate = this.getOccupancyRate();
    
    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Obtenir le revenu mensuel estimé
   */
  getMonthlyRevenue(): number {
    if (!this.property.rooms) return 0;
    
    return this.property.rooms
      .filter(room => room.status === 'OCCUPIED')
      .reduce((total, room) => total + (room.price || 0), 0);
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    if (!price) return '0 FCFA';
    
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Obtenir le statut principal de la propriété
   */
  getPropertyStatus(): { label: string; color: string; icon: string } {
    const total = this.getTotalUnits();
    const available = this.getAvailableUnits();
    const occupied = this.getOccupiedUnits();
    const maintenance = this.getMaintenanceUnits();

    if (total === 0) {
      return { label: 'Aucune unité', color: 'medium', icon: 'home' };
    }

    if (maintenance > 0) {
      return { label: 'En maintenance', color: 'warning', icon: 'construct' };
    }

    if (occupied === total) {
      return { label: 'Complet', color: 'success', icon: 'checkmark-circle' };
    }

    if (available > 0) {
      return { label: 'Disponible', color: 'primary', icon: 'home' };
    }

    return { label: 'Occupé', color: 'medium', icon: 'people' };
  }

  /**
   * Obtenir la date de création formatée
   */
  getCreatedDate(): string {
    if (!this.property.createdAt) return '';
    
    const date = new Date(this.property.createdAt);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Vérifier si la propriété a des alertes
   */
  hasAlerts(): boolean {
    // Logique pour détecter les alertes (maintenance, paiements en retard, etc.)
    return this.getMaintenanceUnits() > 0;
  }

  /**
   * Obtenir le nombre d'alertes
   */
  getAlertsCount(): number {
    let count = 0;
    
    // Compter les unités en maintenance
    count += this.getMaintenanceUnits();
    
    // Ici on pourrait ajouter d'autres types d'alertes
    // comme les paiements en retard, les contrats qui expirent, etc.
    
    return count;
  }
}
