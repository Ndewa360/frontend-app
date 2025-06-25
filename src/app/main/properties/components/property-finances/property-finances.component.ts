import { Component, Input, OnInit } from '@angular/core';

interface FinanceData {
  monthlyRevenue: number;
  yearlyRevenue: number;
  expenses: number;
  netIncome: number;
  revenueHistory: { month: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  reference: string;
  type: 'income' | 'expense';
  amount: number;
  unitName?: string;
}

@Component({
  selector: 'app-property-finances',
  templateUrl: './property-finances.component.html',
  styleUrls: ['./property-finances.component.scss']
})
export class PropertyFinancesComponent implements OnInit {
  @Input() propertyId: string = '';
  @Input() property: any = null;
  @Input() units: any[] = [];
  @Input() tenants: any[] = [];
  @Input() history: any[] = [];
  @Input() loading: boolean = false;
  @Input() finances: FinanceData | null = null;

  selectedPeriod: string = 'current_month';
  recentTransactions: Transaction[] = [];

  // Couleurs pour les catégories de dépenses
  private categoryColors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16'  // lime
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadRecentTransactions();
  }

  private loadRecentTransactions(): void {
    // Simulation de données - remplacer par un appel API
    this.recentTransactions = [
      {
        id: '1',
        date: new Date(2024, 5, 15),
        description: 'Loyer mensuel',
        reference: 'LOY-2024-001',
        type: 'income',
        amount: 85000,
        unitName: 'Appartement A1'
      },
      {
        id: '2',
        date: new Date(2024, 5, 10),
        description: 'Réparation plomberie',
        reference: 'REP-2024-005',
        type: 'expense',
        amount: 25000,
        unitName: 'Appartement B2'
      },
      {
        id: '3',
        date: new Date(2024, 5, 8),
        description: 'Loyer mensuel',
        reference: 'LOY-2024-002',
        type: 'income',
        amount: 120000,
        unitName: 'Appartement A2'
      },
      {
        id: '4',
        date: new Date(2024, 5, 5),
        description: 'Assurance propriété',
        reference: 'ASS-2024-001',
        type: 'expense',
        amount: 15000
      },
      {
        id: '5',
        date: new Date(2024, 5, 1),
        description: 'Frais de gestion',
        reference: 'GES-2024-001',
        type: 'expense',
        amount: 10000
      }
    ];
  }

  updatePeriod(): void {
    console.log('Période mise à jour:', this.selectedPeriod);
    // Ici, vous pourriez recharger les données financières pour la nouvelle période
  }

  getPeriodLabel(): string {
    const labels = {
      'current_month': 'Mois actuel',
      'last_month': 'Mois dernier',
      'last_3_months': '3 derniers mois',
      'last_6_months': '6 derniers mois',
      'current_year': 'Année actuelle',
      'last_year': 'Année dernière'
    };
    return labels[this.selectedPeriod as keyof typeof labels] || 'Période sélectionnée';
  }

  getNetIncomeGrowth(): number {
    // Simulation de la croissance - à remplacer par un calcul réel
    return 15;
  }

  getROI(): number {
    if (!this.finances) return 0;
    
    // Calcul simplifié du ROI annuel
    const annualNetIncome = this.finances.netIncome * 12;
    const propertyValue = 50000000; // Valeur estimée de la propriété - à récupérer depuis les données
    
    return Math.round((annualNetIncome / propertyValue) * 100);
  }

  getCategoryColor(category: string): string {
    if (!this.finances) return this.categoryColors[0];
    
    const index = this.finances.expenseCategories.findIndex(cat => cat.category === category);
    return this.categoryColors[index % this.categoryColors.length];
  }

  getCategoryPercentage(amount: number): number {
    if (!this.finances) return 0;
    
    const totalExpenses = this.finances.expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
    return totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
  }

  getRecentTransactions(): Transaction[] {
    return this.recentTransactions.slice(0, 5); // Afficher les 5 dernières transactions
  }

  trackByTransactionId(index: number, transaction: Transaction): string {
    return transaction.id;
  }

  // Actions
  generateReport(): void {
    console.log('Générer rapport financier');
    // Implémentation de la génération de rapport
  }

  exportFinances(): void {
    console.log('Exporter données financières');
    // Implémentation de l'export
  }
}
