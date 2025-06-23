import { Component, OnInit } from '@angular/core';

interface PropertySummary {
  name: string;
  location: string;
  occupancyRate: number;
  roomCount: number;
}

interface Alert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  date: Date;
}

@Component({
  selector: 'app-modern-dashboard',
  templateUrl: './modern-dashboard.component.html',
  styleUrls: ['./modern-dashboard.component.scss']
})
export class ModernDashboardComponent implements OnInit {
  
  // Métriques principales
  totalProperties: number = 12;
  activeProperties: number = 10;
  occupancyRate: number = 85;
  occupiedRooms: number = 34;
  totalRooms: number = 40;
  overduePayments: number = 3;
  
  // Données pour les graphiques
  topProperties: PropertySummary[] = [
    { name: 'Résidence Étoile', location: 'Douala', occupancyRate: 95, roomCount: 8 },
    { name: 'Villa Moderne', location: 'Yaoundé', occupancyRate: 88, roomCount: 6 },
    { name: 'Appartements Central', location: 'Douala', occupancyRate: 75, roomCount: 12 },
    { name: 'Maison Familiale', location: 'Bafoussam', occupancyRate: 100, roomCount: 4 }
  ];
  
  recentProperties: PropertySummary[] = [
    { name: 'Nouvelle Villa', location: 'Douala', occupancyRate: 0, roomCount: 5 },
    { name: 'Appartement Luxe', location: 'Yaoundé', occupancyRate: 60, roomCount: 3 },
    { name: 'Studio Moderne', location: 'Douala', occupancyRate: 80, roomCount: 2 },
    { name: 'Maison Duplex', location: 'Limbé', occupancyRate: 50, roomCount: 6 }
  ];
  
  alerts: Alert[] = [
    {
      type: 'critical',
      title: 'Paiement en retard',
      message: 'Locataire de la Villa Moderne en retard de 15 jours',
      date: new Date(2024, 5, 15)
    },
    {
      type: 'warning',
      title: 'Maintenance requise',
      message: 'Réparation plomberie nécessaire - Résidence Étoile',
      date: new Date(2024, 5, 18)
    },
    {
      type: 'info',
      title: 'Nouveau locataire',
      message: 'Demande de visite pour Appartements Central',
      date: new Date(2024, 5, 20)
    },
    {
      type: 'warning',
      title: 'Contrat expirant',
      message: 'Renouvellement contrat dans 30 jours',
      date: new Date(2024, 5, 22)
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Initialisation des données
    this.loadDashboardData();
  }
  
  private loadDashboardData(): void {
    // Ici vous pouvez charger les données depuis vos services
    // this.propertyService.getDashboardMetrics().subscribe(...)
  }
  
  // Méthodes utilitaires
  getOccupancyColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  getAlertIcon(type: string): string {
    switch (type) {
      case 'critical':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return '';
    }
  }
  
  // Actions
  onCreateProperty(): void {
    // Navigation vers création de propriété
  }
  
  onGenerateReport(): void {
    // Génération de rapport
  }
  
  onViewAllProperties(): void {
    // Navigation vers liste des propriétés
  }
  
  onViewAllAlerts(): void {
    // Navigation vers page des alertes
  }
  
  onAlertClick(alert: Alert): void {
    // Action spécifique selon le type d'alerte
    console.log('Alert clicked:', alert);
  }
}
