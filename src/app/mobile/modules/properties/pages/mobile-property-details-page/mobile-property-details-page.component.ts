import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-mobile-property-details-page',
  templateUrl: './mobile-property-details-page.component.html',
  styleUrls: ['./mobile-property-details-page.component.scss']
})
export class MobilePropertyDetailsPageComponent implements OnInit {
  propertyId: string = '';
  property: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProperty();
  }

  private loadProperty(): void {
    // Simulation de chargement - à remplacer par le vrai service
    setTimeout(() => {
      this.property = {
        _id: this.propertyId,
        name: 'Résidence Premium',
        description: 'Belle propriété située dans un quartier calme avec toutes les commodités à proximité.',
        address: '123 Rue de la Paix',
        geolocationCity: { name: 'Douala' },
        numberOfRooms: 12,
        images: ['assets/images/placeholder-property.jpg']
      };
    }, 1000);
  }

  getMainImage(): string {
    if (this.property?.images && this.property.images.length > 0) {
      return this.property.images[0];
    }
    return 'assets/images/placeholder-property.jpg';
  }

  getLocation(): string {
    const parts = [];
    if (this.property?.address) {
      parts.push(this.property.address);
    }
    if (this.property?.geolocationCity?.name) {
      parts.push(this.property.geolocationCity.name);
    }
    return parts.join(', ') || 'Localisation non spécifiée';
  }

  getAvailableRooms(): number {
    return Math.floor((this.property?.numberOfRooms || 0) * 0.6);
  }

  getOccupiedRooms(): number {
    return Math.floor((this.property?.numberOfRooms || 0) * 0.3);
  }

  getMonthlyRevenue(): number {
    return this.getOccupiedRooms() * 50000;
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  editProperty(): void {
    this.router.navigate(['/mobile/properties/edit', this.propertyId]);
  }

  viewUnits(): void {
    this.router.navigate(['/mobile/properties', this.propertyId, 'units']);
  }

  viewStats(): void {
    console.log('Voir statistiques détaillées');
  }

  manageMedia(): void {
    console.log('Gérer les photos');
  }
}
