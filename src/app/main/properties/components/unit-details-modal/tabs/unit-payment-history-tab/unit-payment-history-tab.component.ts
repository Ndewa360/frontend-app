import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomModel, LocataireModel } from 'src/app/shared/store';

interface PaymentRecord {
  id: string;
  date: Date;
  period: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  reference?: string;
}

@Component({
  selector: 'app-unit-payment-history-tab',
  templateUrl: './unit-payment-history-tab.component.html',
  styleUrls: ['./unit-payment-history-tab.component.scss']
})
export class UnitPaymentHistoryTabComponent implements OnInit, OnDestroy {
  @Input() room: RoomModel | null = null;
  @Input() tenant: LocataireModel | null = null;

  payments: PaymentRecord[] = [];
  filteredPayments: PaymentRecord[] = [];
  
  selectedYear: string = '';
  selectedMonth: string = '';
  selectedStatus: string = '';
  
  availableYears: number[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadPaymentHistory();
    this.generateAvailableYears();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPaymentHistory(): void {
    // TODO: Charger l'historique des paiements depuis le store
    // Pour l'instant, on simule des données
    this.payments = this.generateMockPayments();
    this.filteredPayments = [...this.payments];
  }

  private generateMockPayments(): PaymentRecord[] {
    // ⚠️ MÉTHODE DÉPRÉCIÉE - Ne plus utiliser de données simulées
    console.warn('⚠️ generateMockPayments() est déprécié. Utilisez les vraies données de paiement.');

    if (!this.tenant || !this.room) {
      return [];
    }

    // Retourner un tableau vide et afficher un message approprié
    // Les vraies données doivent venir du store ou d'un service
    return [];
  }

  private generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }

  filterPayments(): void {
    this.filteredPayments = this.payments.filter(payment => {
      const paymentYear = payment.date.getFullYear().toString();
      const paymentMonth = (payment.date.getMonth() + 1).toString();

      const yearMatch = !this.selectedYear || paymentYear === this.selectedYear;
      const monthMatch = !this.selectedMonth || paymentMonth === this.selectedMonth;
      const statusMatch = !this.selectedStatus || payment.status === this.selectedStatus;

      return yearMatch && monthMatch && statusMatch;
    });
  }

  getTotalReceived(): number {
    return this.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getUpToDatePayments(): number {
    return this.payments.filter(p => p.status === 'paid').length;
  }

  getOverduePayments(): number {
    return this.payments.filter(p => p.status === 'overdue').length;
  }

  getLastPaymentDate(): string {
    const lastPayment = this.payments.find(p => p.status === 'paid');
    return lastPayment ? this.formatDate(lastPayment.date) : 'Aucun';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      default: return 'Inconnu';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatPeriod(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    });
  }

  trackByPaymentId(index: number, payment: PaymentRecord): string {
    return payment.id;
  }
}
