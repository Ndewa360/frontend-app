import { Component, OnInit } from '@angular/core';

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

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface Unit {
  id: string;
  name: string;
  type: string;
  surface: number;
  price: number;
  status: 'occupied' | 'available' | 'maintenance';
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'expired';
}

interface HistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'maintenance' | 'tenant_move_in' | 'tenant_move_out' | 'contract_renewal';
  description: string;
  amount?: number;
  unitId?: string;
  tenantId?: string;
}

interface FinanceData {
  monthlyRevenue: number;
  yearlyRevenue: number;
  expenses: number;
  netIncome: number;
  revenueHistory: { month: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

@Component({
  selector: 'app-property-details-complete',
  templateUrl: './property-details-complete.component.html',
  styleUrls: ['./property-details-complete.component.scss']
})
export class PropertyDetailsCompleteComponent implements OnInit {
  
  property: Property | null = null;
  activeTab: string = 'overview';
  
  // Données pour les onglets
  units: Unit[] = [];
  tenants: Tenant[] = [];
  history: HistoryItem[] = [];
  finances: FinanceData | null = null;
  
  // Métriques
  monthlyRevenue: number = 0;
  revenueGrowth: number = 0;
  occupancyRate: number = 0;
  occupiedUnits: number = 0;
  totalUnits: number = 0;
  availableUnits: number = 0;
  overduePayments: number = 0;
  
  // Équipements
  propertyAmenities: string[] = [];
  
  // Configuration des onglets
  tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z'
    },
    {
      id: 'units',
      label: 'Unités locatives',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 21h6'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
    },
    {
      id: 'history',
      label: 'Historique',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      id: 'finances',
      label: 'Finances',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadPropertyData();
    this.loadUnits();
    this.loadTenants();
    this.loadHistory();
    this.loadFinances();
    this.loadPropertyAmenities();
    this.calculateMetrics();
    this.updateTabCounts();
  }

  private loadPropertyData(): void {
    // Simulation de données - remplacer par un appel API
    this.property = {
      id: '1',
      name: 'Résidence Étoile',
      location: 'Douala, Cameroun',
      type: 'Immeuble résidentiel',
      surface: 500,
      yearBuilt: 2018,
      condition: 'Excellent',
      roomLength: 12
    };
  }

  private loadUnits(): void {
    // Simulation de données
    this.units = [
      {
        id: '1',
        name: 'Appartement A1',
        type: 'Studio',
        surface: 25,
        price: 85000,
        status: 'occupied',
        tenant: {
          id: 't1',
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          phone: '+237 6XX XX XX XX'
        }
      },
      {
        id: '2',
        name: 'Appartement A2',
        type: '1 chambre',
        surface: 35,
        price: 120000,
        status: 'occupied',
        tenant: {
          id: 't2',
          name: 'Marie Martin',
          email: 'marie.martin@email.com',
          phone: '+237 6XX XX XX XX'
        }
      },
      {
        id: '3',
        name: 'Appartement B1',
        type: 'Studio',
        surface: 25,
        price: 85000,
        status: 'available'
      },
      {
        id: '4',
        name: 'Appartement B2',
        type: '2 chambres',
        surface: 50,
        price: 180000,
        status: 'maintenance'
      }
    ];
  }

  private loadTenants(): void {
    // Simulation de données
    this.tenants = [
      {
        id: 't1',
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+237 6XX XX XX XX',
        unitId: '1',
        unitName: 'Appartement A1',
        rentAmount: 85000,
        leaseStart: new Date(2024, 0, 1),
        leaseEnd: new Date(2024, 11, 31),
        status: 'active'
      },
      {
        id: 't2',
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '+237 6XX XX XX XX',
        unitId: '2',
        unitName: 'Appartement A2',
        rentAmount: 120000,
        leaseStart: new Date(2024, 2, 1),
        leaseEnd: new Date(2025, 1, 28),
        status: 'active'
      }
    ];
  }

  private loadHistory(): void {
    // Simulation de données
    this.history = [
      {
        id: '1',
        date: new Date(2024, 5, 15),
        type: 'payment',
        description: 'Paiement de loyer - Appartement A1',
        amount: 85000,
        unitId: '1',
        tenantId: 't1'
      },
      {
        id: '2',
        date: new Date(2024, 5, 10),
        type: 'maintenance',
        description: 'Réparation plomberie - Appartement B2',
        amount: 25000,
        unitId: '4'
      },
      {
        id: '3',
        date: new Date(2024, 4, 1),
        type: 'tenant_move_in',
        description: 'Emménagement de Marie Martin',
        unitId: '2',
        tenantId: 't2'
      }
    ];
  }

  private loadFinances(): void {
    // Simulation de données
    this.finances = {
      monthlyRevenue: 205000,
      yearlyRevenue: 2460000,
      expenses: 150000,
      netIncome: 55000,
      revenueHistory: [
        { month: 'Jan', amount: 205000 },
        { month: 'Fév', amount: 205000 },
        { month: 'Mar', amount: 325000 },
        { month: 'Avr', amount: 325000 },
        { month: 'Mai', amount: 325000 },
        { month: 'Juin', amount: 205000 }
      ],
      expenseCategories: [
        { category: 'Maintenance', amount: 75000 },
        { category: 'Assurance', amount: 25000 },
        { category: 'Taxes', amount: 30000 },
        { category: 'Gestion', amount: 20000 }
      ]
    };
  }

  private loadPropertyAmenities(): void {
    this.propertyAmenities = [
      'Parking',
      'Sécurité 24h/24',
      'Générateur',
      'Eau courante',
      'Internet',
      'Ascenseur'
    ];
  }

  private calculateMetrics(): void {
    this.totalUnits = this.units.length;
    this.occupiedUnits = this.units.filter(unit => unit.status === 'occupied').length;
    this.availableUnits = this.units.filter(unit => unit.status === 'available').length;
    this.occupancyRate = Math.round((this.occupiedUnits / this.totalUnits) * 100);
    
    this.monthlyRevenue = this.units
      .filter(unit => unit.status === 'occupied')
      .reduce((sum, unit) => sum + unit.price, 0);
    
    this.revenueGrowth = 12; // Simulation
    this.overduePayments = 1; // Simulation
  }

  private updateTabCounts(): void {
    this.tabs.forEach(tab => {
      switch (tab.id) {
        case 'units':
          tab.count = this.totalUnits;
          break;
        case 'tenants':
          tab.count = this.tenants.length;
          break;
        case 'history':
          tab.count = this.history.length;
          break;
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getPropertyStatus(): string {
    if (this.occupancyRate >= 90) return 'Excellent';
    if (this.occupancyRate >= 70) return 'Bon';
    if (this.occupancyRate >= 50) return 'Moyen';
    return 'Faible';
  }

  onEditProperty(): void {
    // Navigation vers la page d'édition
    console.log('Éditer la propriété');
  }

  onAddTenant(): void {
    // Navigation vers l'ajout de locataire
    console.log('Ajouter un locataire');
  }
}
