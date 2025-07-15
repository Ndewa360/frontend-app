import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-mobile-unit-card',
  templateUrl: './mobile-unit-card.component.html',
  styleUrls: ['./mobile-unit-card.component.scss']
})
export class MobileUnitCardComponent {
  @Input() unit: any;
  @Input() isFavorite = false;
  @Input() viewMode: 'list' | 'grid' = 'list';

  @Output() unitClick = new EventEmitter<any>();
  @Output() favoriteToggle = new EventEmitter<any>();

  /**
   * Gérer le clic sur la carte
   */
  onCardClick(): void {
    this.unitClick.emit(this.unit);
  }

  /**
   * Gérer le clic sur le favori
   */
  onFavoriteClick(event: Event): void {
    event.stopPropagation(); // Empêcher la propagation vers la carte
    this.favoriteToggle.emit(this.unit);
  }

  /**
   * Obtenir l'image principale de l'unité
   */
  getMainImage(): string {
    if (this.unit.images && this.unit.images.length > 0) {
      return this.unit.images[0];
    }
    return 'assets/images/placeholder-property.jpg';
  }

  /**
   * Obtenir le nombre d'images
   */
  getImageCount(): number {
    return this.unit.images ? this.unit.images.length : 0;
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    if (!price) return 'Prix sur demande';
    
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Obtenir le type de chambre formaté
   */
  getRoomType(): string {
    if (!this.unit.type) return 'Logement';
    
    const typeMap: { [key: string]: string } = {
      'STUDIO': 'Studio',
      'ROOM': 'Chambre',
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison'
    };
    
    return typeMap[this.unit.type] || this.unit.type;
  }

  /**
   * Obtenir la localisation formatée
   */
  getLocation(): string {
    const parts = [];
    
    if (this.unit.property?.location) {
      parts.push(this.unit.property.location);
    }
    
    if (this.unit.property?.city) {
      parts.push(this.unit.property.city);
    }
    
    return parts.join(', ') || 'Localisation non spécifiée';
  }

  /**
   * Obtenir les équipements principaux
   */
  getMainAmenities(): string[] {
    const amenities = [];
    
    if (this.unit.hasWifi) amenities.push('WiFi');
    if (this.unit.hasAirConditioner) amenities.push('Climatisation');
    if (this.unit.hasKitchen) amenities.push('Cuisine');
    if (this.unit.hasParking) amenities.push('Parking');
    
    return amenities.slice(0, 3); // Limiter à 3 équipements
  }

  /**
   * Vérifier si l'unité est disponible
   */
  isAvailable(): boolean {
    return this.unit.status === 'AVAILABLE' || this.unit.status === 'available';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    if (this.isAvailable()) {
      return 'Disponible';
    }
    
    const statusMap: { [key: string]: string } = {
      'OCCUPIED': 'Occupé',
      'MAINTENANCE': 'En maintenance',
      'RESERVED': 'Réservé'
    };
    
    return statusMap[this.unit.status] || 'Non disponible';
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatusColor(): string {
    if (this.isAvailable()) {
      return 'success';
    }
    
    const colorMap: { [key: string]: string } = {
      'OCCUPIED': 'danger',
      'MAINTENANCE': 'warning',
      'RESERVED': 'medium'
    };
    
    return colorMap[this.unit.status] || 'medium';
  }

  /**
   * Obtenir la note moyenne (si disponible)
   */
  getRating(): number {
    // Simuler une note pour l'exemple
    return Math.random() * 2 + 3; // Entre 3 et 5
  }

  /**
   * Vérifier si l'unité a des promotions
   */
  hasPromotion(): boolean {
    // Logique pour détecter les promotions
    return Math.random() > 0.8; // 20% de chance d'avoir une promotion
  }

  /**
   * Obtenir le texte de la promotion
   */
  getPromotionText(): string {
    return 'Premier mois -20%';
  }
}
