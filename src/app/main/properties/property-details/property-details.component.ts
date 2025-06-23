import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  surface: number;
  yearBuilt: number;
  condition: string;
  roomLength: number;
}

interface Room {
  id: string;
  name: string;
  price: number;
  surface: number;
  status: 'occupied' | 'available' | 'maintenance';
  tenant?: {
    name: string;
    id: string;
  };
}

interface PropertyImage {
  url: string;
  alt: string;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit {
  
  property: Property | null = null;
  rooms: Room[] = [];
  propertyImages: PropertyImage[] = [];
  propertyAmenities: string[] = [];
  alerts: Alert[] = [];
  
  // Métriques
  monthlyRevenue: number = 0;
  occupancyRate: number = 0;
  overduePayments: number = 0;

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadPropertyData();
    this.loadPropertyImages();
    this.loadPropertyAmenities();
    this.loadRooms();
    this.loadAlerts();
    this.calculateMetrics();
  }

  private loadPropertyData(): void {
    // Simulation de données - remplacer par un appel API
    this.property = {
      id: '1',
      name: 'Résidence Étoile',
      location: 'Douala, Cameroun',
      type: 'Appartement',
      surface: 120,
      yearBuilt: 2018,
      condition: 'Excellent',
      roomLength: 8
    };
  }

  private loadPropertyImages(): void {
    this.propertyImages = [
      { url: '/assets/images/property1.jpg', alt: 'Vue extérieure' },
      { url: '/assets/images/property2.jpg', alt: 'Salon principal' },
      { url: '/assets/images/property3.jpg', alt: 'Cuisine équipée' },
      { url: '/assets/images/property4.jpg', alt: 'Chambre type' },
      { url: '/assets/images/property5.jpg', alt: 'Salle de bain' },
      { url: '/assets/images/property6.jpg', alt: 'Balcon' }
    ];
  }

  private loadPropertyAmenities(): void {
    this.propertyAmenities = [
      'Cuisine équipée',
      'Salle de bain privée',
      'Balcon',
      'Parking',
      'Sécurité 24h/24',
      'Internet haut débit',
      'Climatisation',
      'Eau chaude',
      'Générateur de secours'
    ];
  }

  private loadRooms(): void {
    this.rooms = [
      {
        id: '1',
        name: 'Chambre A1',
        price: 85000,
        surface: 15,
        status: 'occupied',
        tenant: { name: 'Jean Dupont', id: 't1' }
      },
      {
        id: '2',
        name: 'Chambre A2',
        price: 90000,
        surface: 18,
        status: 'occupied',
        tenant: { name: 'Marie Martin', id: 't2' }
      },
      {
        id: '3',
        name: 'Chambre A3',
        price: 85000,
        surface: 15,
        status: 'available'
      },
      {
        id: '4',
        name: 'Chambre B1',
        price: 95000,
        surface: 20,
        status: 'occupied',
        tenant: { name: 'Paul Durand', id: 't3' }
      },
      {
        id: '5',
        name: 'Chambre B2',
        price: 95000,
        surface: 20,
        status: 'maintenance'
      },
      {
        id: '6',
        name: 'Chambre B3',
        price: 90000,
        surface: 18,
        status: 'occupied',
        tenant: { name: 'Sophie Leroy', id: 't4' }
      },
      {
        id: '7',
        name: 'Chambre C1',
        price: 100000,
        surface: 22,
        status: 'occupied',
        tenant: { name: 'Michel Bernard', id: 't5' }
      },
      {
        id: '8',
        name: 'Chambre C2',
        price: 100000,
        surface: 22,
        status: 'available'
      }
    ];
  }

  private loadAlerts(): void {
    this.alerts = [
      {
        type: 'warning',
        title: 'Maintenance requise',
        message: 'Réparation plomberie chambre B2'
      },
      {
        type: 'info',
        title: 'Visite programmée',
        message: 'Visite chambre A3 demain 14h'
      }
    ];
  }

  private calculateMetrics(): void {
    const occupiedRooms = this.rooms.filter(room => room.status === 'occupied');
    const totalRooms = this.rooms.length;
    
    this.monthlyRevenue = occupiedRooms.reduce((sum, room) => sum + room.price, 0);
    this.occupancyRate = Math.round((occupiedRooms.length / totalRooms) * 100);
    this.overduePayments = 1; // Simulation
  }

  getRoomStatusClass(status: string): string {
    const statusClasses = {
      'occupied': 'bg-green-100 text-green-800',
      'available': 'bg-blue-100 text-blue-800',
      'maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  }

  getRoomStatusLabel(status: string): string {
    const statusLabels = {
      'occupied': 'Occupée',
      'available': 'Disponible',
      'maintenance': 'Maintenance'
    };
    return statusLabels[status as keyof typeof statusLabels] || 'Inconnu';
  }

  onEditProperty(): void {
    // Navigation vers la page d'édition
    console.log('Éditer la propriété');
  }

  onAddTenant(): void {
    // Navigation vers l'ajout de locataire
    console.log('Ajouter un locataire');
  }

  onRecordPayment(): void {
    // Navigation vers l'enregistrement de paiement
    console.log('Enregistrer un paiement');
  }

  onGenerateReport(): void {
    // Génération de rapport
    console.log('Générer un rapport');
  }

  onViewRoom(room: Room): void {
    // Navigation vers les détails de la chambre
    console.log('Voir la chambre:', room);
  }

  onEditRoom(room: Room): void {
    // Navigation vers l'édition de la chambre
    console.log('Éditer la chambre:', room);
  }
}
