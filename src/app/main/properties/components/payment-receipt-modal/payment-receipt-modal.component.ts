import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { LocationPaymentType } from 'src/app/shared/store';
import { LocationPaymentService } from 'src/app/shared/store/payment-location/location-payment.service';

export interface PaymentReceiptData {
  payment: {
    _id?: string;
    locationPaymentPrice: number;
    paymentLocationType: LocationPaymentType | string;
    datePayment: Date | string;
    billingRef?: string;
    paymentMethod?: string;
    reason?: string;
    notes?: string;
  };
  tenant?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  room?: {
    code?: string;
    price?: number;
    type?: string;
  } | null;
  owner?: {
    name?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  propertyName?: string;
  /** Contrat de location pour calculer la période exacte */
  location?: {
    startedAt?: Date | string;
    createdAt?: Date | string;
    isKnowExactDateEntry?: boolean;
    endedAt?: Date | string;
  } | null;
  /** Tous les paiements du locataire dans cette chambre (pour calculer les mois déjà couverts) */
  allPayments?: Array<{ _id?: string; locationPaymentPrice: number; datePayment: Date | string }> | null;
}

@Component({
  selector: 'app-payment-receipt-modal',
  templateUrl: './payment-receipt-modal.component.html',
  styleUrls: ['./payment-receipt-modal.component.scss']
})
export class PaymentReceiptModalComponent implements OnInit {

  isDownloading = false;
  today = new Date();
  currentYear = new Date().getFullYear();

  constructor(
    private dialogRef: MatDialogRef<PaymentReceiptModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentReceiptData,
    private translate: TranslateService,
    private toastr: ToastrService,
    private locationPaymentService: LocationPaymentService,
  ) {}

  ngOnInit(): void {}

  onClose(): void {
    this.dialogRef.close();
  }

  getPaymentTypeLabel(): string {
    switch (this.data.payment.paymentLocationType) {
      case 'LOCATION': return 'Loyer mensuel';
      case 'CAUTION': return 'Caution / Dépôt de garantie';
      default: return 'Paiement';
    }
  }

  getPaymentMethodLabel(): string {
    switch (this.data.payment.paymentMethod) {
      case 'CASH':          return 'Espèces';
      case 'BANK_TRANSFER': return 'Virement bancaire';
      case 'MOBILE_MONEY':  return 'Mobile Money';
      case 'CHECK':         return 'Chèque';
      case 'CARD':          return 'Carte bancaire';
      case 'OTHER':         return 'Autre';
      default: return this.data.payment.paymentMethod || 'Non spécifié';
    }
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getReceiptNumber(): string {
    return this.data.payment.billingRef || `REC-${Date.now().toString().slice(-8)}`;
  }

  /**
   * Calcule la période couverte par CE paiement.
   * Logique identique au backend (projectPaymentsOnYear) :
   * - entryDate = location.startedAt (jamais datePayment)
   * - floor pour les mois couverts (un mois n'est couvert que s'il est entièrement payé)
   * - anniversaryDate pour éviter le débordement JS sur les mois courts (28/29/30 jours)
   */
  getPeriodLabel(): string {
    const monthlyRent = this.data.room?.price || 0;
    const payments    = this.data.allPayments || [];

    // Date d'entrée depuis le contrat — jamais depuis datePayment
    const loc = this.data.location;
    if (!loc?.startedAt || !monthlyRent) {
      return new Date(this.data.payment.datePayment)
        .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    const entryDate = new Date(loc.startedAt);

    // Ajustement état financier initial (cohérent avec projectPaymentsOnYear)
    const initialState = (loc as any).initialFinancialState;
    const initialSolde = (loc as any).initialSolde || 0;
    const adjust = (amount: number) => {
      if (initialState === 'AVEC_ARRIERE') return Math.max(0, amount - initialSolde);
      if (initialState === 'EN_AVANCE')    return amount + initialSolde;
      return amount;
    };

    // Total payé AVANT ce paiement
    const refTime = new Date(this.data.payment.datePayment).getTime();
    const refId   = this.data.payment._id;
    const totalAvant = payments
      .filter(p => {
        const t = new Date(p.datePayment).getTime();
        return t < refTime || (t === refTime && p._id !== refId);
      })
      .reduce((s, p) => s + (p.locationPaymentPrice || 0), 0);

    // floor : mois entiers couverts avant et après ce paiement
    const moisAvant  = Math.floor(adjust(totalAvant) / monthlyRent);
    const moisApres  = Math.floor(adjust(totalAvant + this.data.payment.locationPaymentPrice) / monthlyRent);

    if (moisApres <= moisAvant) {
      // Paiement partiel qui ne complète pas encore un mois entier
      return 'Paiement partiel (mois non encore couvert)';
    }

    // anniversaryDate : gère les mois courts (28/29/30 jours) sans débordement JS
    const anniversaryDate = (offset: number): Date => {
      const targetMonth = entryDate.getMonth() + offset;
      const targetYear  = entryDate.getFullYear();
      const lastDay     = new Date(targetYear, targetMonth + 1, 0).getDate();
      const day         = Math.min(entryDate.getDate(), lastDay);
      return new Date(targetYear, targetMonth, day, 0, 0, 0, 0);
    };

    const debutCouverture  = anniversaryDate(moisAvant);
    const endOfLastCovered = anniversaryDate(moisApres);
    const finCouverture    = new Date(endOfLastCovered.getTime() - 1);

    const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    return `${fmt(debutCouverture)} au ${fmt(finCouverture)}`;
  }

  /**
   * Statut financier du locataire après CE paiement, avec nombre de mois.
   * Même logique que le backend (projectPaymentsOnYear via floor).
   */
  getTenantStatusLabel(): string {
    const monthlyRent = this.data.room?.price || 0;
    const loc         = this.data.location as any;
    if (!loc?.startedAt || !monthlyRent) return '';

    const entryDate    = new Date(loc.startedAt);
    const payments     = this.data.allPayments || [];
    const totalPaye    = payments.reduce((s, p) => s + (p.locationPaymentPrice || 0), 0);
    const initialState = loc.initialFinancialState;
    const initialSolde = loc.initialSolde || 0;

    // Ajustement
    let adjusted = totalPaye;
    if (initialState === 'AVEC_ARRIERE') adjusted = Math.max(0, adjusted - initialSolde);
    else if (initialState === 'EN_AVANCE') adjusted += initialSolde;

    const fullMonthsCovered = Math.floor(adjusted / monthlyRent);

    // Mois dus depuis l'entrée jusqu'à aujourd'hui (règle d'anniversaire)
    const anniversaryDate = (offset: number): Date => {
      const targetMonth = entryDate.getMonth() + offset;
      const lastDay     = new Date(entryDate.getFullYear(), targetMonth + 1, 0).getDate();
      return new Date(entryDate.getFullYear(), targetMonth, Math.min(entryDate.getDate(), lastDay), 0, 0, 0, 0);
    };
    const now = new Date();
    let monthsDue = 0;
    for (let offset = 0; ; offset++) {
      const d = anniversaryDate(offset);
      if (d > now) break;
      monthsDue++;
      if (offset > 600) break; // sécurité
    }

    const diff = fullMonthsCovered - monthsDue;

    if (adjusted <= 0) {
      return monthsDue > 0 ? `Aucun paiement — ${monthsDue} mois dus` : 'Aucun paiement';
    }
    if (diff > 0) {
      return `En avance — ${diff} mois`;
    }
    if (diff === 0) {
      return 'À jour';
    }
    const lateMonths = Math.abs(diff);
    const rate = monthsDue > 0 ? (fullMonthsCovered / monthsDue) * 100 : 0;
    return rate >= 50
      ? `En retard — ${lateMonths} mois`
      : `Critique — ${lateMonths} mois de retard`;
  }

  downloadPdf(): void {
    // Si le paiement a un _id, utiliser le backend (PDF professionnel avec logo)
    if (this.data.payment._id) {
      this.isDownloading = true;
      this.locationPaymentService.downloadReceipt(this.data.payment._id).subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recu_${this.data.payment.billingRef || this.data.payment._id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.isDownloading = false;
          this.toastr.success('Reçu téléchargé avec succès', 'Ndewa360°');
        },
        error: () => {
          this.isDownloading = false;
          this.toastr.error('Erreur lors du téléchargement du reçu', 'Erreur');
        }
      });
      return;
    }

    // Fallback : impression navigateur si pas d'_id
    this.isDownloading = true;
    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        this.toastr.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les popups.', 'Erreur');
        this.isDownloading = false;
        return;
      }
      printWindow.document.write(this.generateReceiptHtml());
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => { printWindow.focus(); printWindow.print(); this.isDownloading = false; }, 500);
      };
      setTimeout(() => {
        if (this.isDownloading) { printWindow.focus(); printWindow.print(); this.isDownloading = false; }
      }, 1500);
    } catch (error) {
      this.toastr.error('Erreur lors de la génération du PDF', 'Erreur');
      this.isDownloading = false;
    }
  }

  private generateReceiptHtml(): string {
    const receiptNumber = this.getReceiptNumber();
    const paymentDate = this.formatDate(this.data.payment.datePayment);
    const billingDate = this.formatDate(new Date());
    const amount = this.formatPrice(this.data.payment.locationPaymentPrice);
    const tenantName = this.data.tenant?.fullName || 'N/A';
    const tenantEmail = this.data.tenant?.email || '';
    const tenantPhone = this.data.tenant?.phoneNumber || '';
    const ownerName = this.data.owner?.name || 'Propriétaire';
    const ownerEmail = this.data.owner?.email || '';
    const ownerPhone = this.data.owner?.phoneNumber || '';
    const roomCode = this.data.room?.code || 'N/A';
    const periodLabel = this.getPeriodLabel();
    const paymentType = this.getPaymentTypeLabel();
    const tenantStatus = this.getTenantStatusLabel();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu ${receiptNumber} - Ndewa360</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
    body { background-color: #f5f5f5; padding: 20px; }
    .receipt-page {
      width: 21cm; min-height: 29.7cm; margin: 0 auto;
      background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative; overflow: hidden; padding: 50px;
    }
    .receipt-page::before {
      content: "Ndewa360"; position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 180px; color: rgba(200, 167, 96, 0.08);
      font-weight: bold; z-index: 0; pointer-events: none;
      font-family: 'Arial Black', sans-serif; letter-spacing: -5px;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
    .logo { width: 100px; height: auto; }
    .receipt-info { text-align: right; }
    .receipt-title { font-size: 24px; font-weight: bold; color: #333; text-transform: uppercase; }
    .receipt-number { color: #333; font-weight: bold; margin-top: 4px; }
    .billing-section { display: flex; justify-content: flex-start; gap: 60px; margin-bottom: 40px; }
    .billing-block { display: flex; flex-direction: column; }
    .billing-title { font-size: 13px; text-transform: uppercase; font-weight: bold; color: #000; margin-bottom: 10px; }
    .billing-info { color: #000; font-size: 13px; margin-bottom: 4px; }
    .details-grid { display: flex; justify-content: flex-end; margin-bottom: 30px; }
    .details-table { border-collapse: collapse; }
    .details-table td { padding: 4px 12px; font-size: 13px; color: #000; }
    .details-table .label { font-weight: normal; text-align: left; }
    .details-table .value { font-weight: bold; text-align: right; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .receipt-table th { background-color: white; text-align: left; padding: 8px 10px; font-weight: bold; font-size: 13px; color: #000; }
    .receipt-table td { padding: 10px; font-size: 13px; color: #000; border-bottom: 1px solid #000; border-top: 1px solid #000; }
    .price-column { text-align: right; }
    .totals { margin-top: 20px; margin-left: auto; width: 260px; }
    .totals-table { width: 100%; border-collapse: collapse; }
    .totals-table td { padding: 5px 0; font-size: 13px; color: #000; }
    .totals-table .label { text-align: left; }
    .totals-table .value { text-align: right; }
    .totals-table .total-row td { font-weight: bold; padding: 8px 0; border-top: 1px solid #000; }
    .footer { margin-top: 60px; font-size: 11px; color: #000; }
    .footer .conditions { text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
    @media print {
      body { background: white; padding: 0; }
      .receipt-page { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-page">
    <div class="header">
      <div>
        <img src="https://www.ndewa-360.com/assets/img/logo/logo-basic-nobg.png" alt="Ndewa360" class="logo">
      </div>
      <div class="receipt-info">
        <h2 class="receipt-title">REÇU</h2>
        <p class="receipt-number">#${receiptNumber}</p>
      </div>
    </div>

    <div class="billing-section">
      <div class="billing-block">
        <h3 class="billing-title">FACTURATION DE</h3>
        <p class="billing-info">${ownerName}</p>
        ${ownerEmail ? `<p class="billing-info">${ownerEmail}</p>` : ''}
        ${ownerPhone ? `<p class="billing-info">${ownerPhone}</p>` : ''}
        ${this.data.propertyName ? `<p class="billing-info">${this.data.propertyName}</p>` : ''}
      </div>
      <div class="billing-block">
        <h3 class="billing-title">FACTURÉ À</h3>
        <p class="billing-info">${tenantName}</p>
        ${tenantEmail ? `<p class="billing-info">${tenantEmail}</p>` : ''}
        ${tenantPhone ? `<p class="billing-info">${tenantPhone}</p>` : ''}
        <p class="billing-info">Unité ${roomCode}</p>
      </div>
    </div>

    <div class="details-grid">
      <table class="details-table">
        <tr>
          <td class="label">N° Reçu</td>
          <td class="value">${receiptNumber}</td>
        </tr>
        <tr>
          <td class="label">Date de paiement</td>
          <td class="value">${paymentDate}</td>
        </tr>
        <tr>
          <td class="label">Date de facturation</td>
          <td class="value">${billingDate}</td>
        </tr>
        <tr>
          <td class="label">Mode de paiement</td>
          <td class="value">${this.getPaymentMethodLabel()}</td>
        </tr>
        ${tenantStatus ? `<tr>
          <td class="label">Statut locataire</td>
          <td class="value">${tenantStatus}</td>
        </tr>` : ''}
      </table>
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Unité</th>
          <th>Période</th>
          <th class="price-column">Montant (FCFA)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${paymentType}</td>
          <td>${roomCode}</td>
          <td>${periodLabel}</td>
          <td class="price-column">${amount}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td class="label">Sous-total</td>
          <td class="value">${amount}</td>
        </tr>
        <tr>
          <td class="label">TVA</td>
          <td class="value">0 FCFA</td>
        </tr>
        <tr class="total-row">
          <td class="label">Total TTC</td>
          <td class="value">${amount}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p class="conditions">CONDITIONS GÉNÉRALES</p>
      <p>Par Ndewa360° © ${new Date().getFullYear()}</p>
      <p><a href="https://ndewa-360.com">www.ndewa-360.com</a></p>
    </div>
  </div>
</body>
</html>`;
  }
}
