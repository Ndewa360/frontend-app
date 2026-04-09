import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UnitDetailsData, UnitDetailsService } from '../../../../services/unit-details.service';

export interface PaymentAction {
  type: 'add' | 'view' | 'edit' | 'delete' | 'export' | 'receipt';
  data?: any;
}

@Component({
  selector: 'app-unit-payments-tab',
  templateUrl: './unit-payments-tab.component.html',
  styleUrls: ['./unit-payments-tab.component.scss']
})
export class UnitPaymentsTabComponent {
  @Input() unitData: UnitDetailsData | null = null;
  @Input() loading: boolean = false;
  @Output() paymentAction = new EventEmitter<PaymentAction>();

  constructor(private unitDetailsService: UnitDetailsService) {}

  getFormattedPayments(): any[] {
    if (!this.unitData) return [];
    return this.unitDetailsService.getFormattedPayments(this.unitData);
  }

  getPaymentCount(): number {
    if (!this.unitData) return 0;
    return this.unitDetailsService.getPaymentCount(this.unitData);
  }

  getTotalPayments(): number {
    if (!this.unitData) return 0;
    return this.unitDetailsService.getTotalPayments(this.unitData);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatPaymentTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getPaymentTypeLabel(type: string): string {
    switch (type) {
      case 'LOCATION': return 'Loyer';
      case 'CAUTION': return 'Caution';
      case 'CHARGES': return 'Charges';
      case 'REPARATION': return 'Réparation';
      default: return type || 'Autre';
    }
  }

  getPaymentStatus(date: Date | string): string {
    const paymentDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'Récent';
    if (diffDays <= 30) return 'Ce mois';
    if (diffDays <= 90) return 'Ce trimestre';
    return 'Ancien';
  }

  getLastUpdateTime(): string {
    return new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAveragePayment(): number {
    const payments = this.getFormattedPayments();
    if (payments.length === 0) return 0;

    const total = this.getTotalPayments();
    return total / payments.length;
  }

  trackByPaymentId(index: number, payment: any): string {
    return payment.transaction?._id || payment._id || index.toString();
  }

  // Actions
  onAddPayment(): void {
    this.paymentAction.emit({ type: 'add' });
  }

  viewReceipt(payment: any): void {
    this.paymentAction.emit({ type: 'receipt', data: payment });
  }

  viewPaymentDetails(payment: any): void {
    this.paymentAction.emit({ type: 'view', data: payment });
  }

  editPayment(payment: any): void {
    this.paymentAction.emit({ type: 'edit', data: payment });
  }

  deletePayment(payment: any): void {
    this.paymentAction.emit({ type: 'delete', data: payment });
  }

  exportPaymentsToCSV(): void {
    const payments = this.getFormattedPayments();
    if (payments.length === 0) return;

    const csvHeaders = ['#', 'Unité', 'Date de paiement', 'Montant', 'Type', 'Référence', 'Motif'];
    const csvData = payments.map((payment, index) => [
      index + 1,
      payment.chambre,
      payment.date_paiement,
      payment.price,
      payment.transaction.paymentLocationType || 'LOCATION',
      payment.transaction.billingRef || '',
      payment.transaction.reason || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Historique_paiements_${this.unitData?.room?.code}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.paymentAction.emit({ type: 'export' });
  }
}
