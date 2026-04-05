import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface InvoiceData {
  invoiceNumber: string;
  subscriptionId: string;
  periodId: string;
  userInfo: { name: string; email: string };
  period: { startDate: Date; endDate: Date; billingRef: string };
  amount: number;
  plan: string;
  status: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  occupiedUnits: number;
  totalRevenue: number;
  transaction: { externalRef: string; provider: string; status: string; processedAt: Date } | null;
  createdAt: Date;
  unitsDetails: Array<{
    unitCode: string;
    unitPrice: number;
    occupiedDays: number;
    isEligible: boolean;
    revenue: number;
    propertyName: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class InvoiceDownloadService {

  private readonly api = `${environment.apiUrl}/subscription-payment`;

  constructor(private http: HttpClient) {}

  // ─── Récupérer les données de la facture depuis le backend ────────────────
  getInvoice(periodId: string): Observable<{ data: InvoiceData }> {
    return this.http.get<{ data: InvoiceData }>(`${this.api}/invoice/${periodId}`);
  }

  // ─── Télécharger la facture en PDF via le backend ────────────────────────
  // Utilise l'endpoint GET /subscription-payment/invoice/:periodId/pdf
  // qui retourne un Buffer PDF genere par InvoiceGeneratorService (backend)
  // Fallback sur la generation locale si le backend echoue
  downloadInvoicePdf(periodId: string): void {
    const url = `${this.api}/invoice/${periodId}/pdf`;

    // Creer un lien de telechargement invisible
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture_${periodId}.pdf`;
    link.target = '_blank';

    // Ajouter le token d'auth dans les headers via fetch
    const token = localStorage.getItem('ndewa360_auth_token')
      ? JSON.parse(localStorage.getItem('ndewa360_auth_token') || '{}')?.token
      : null;

    if (token) {
      // Telechargement via fetch avec auth header
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (!res.ok) throw new Error('PDF non disponible');
          return res.blob();
        })
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          link.href = objectUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
        })
        .catch(() => {
          // Fallback : generer le PDF localement
          this.downloadInvoicePdfLocal(periodId);
        });
    } else {
      this.downloadInvoicePdfLocal(periodId);
    }
  }

  // ─── Fallback : génération locale via window.print() ─────────────────────
  private downloadInvoicePdfLocal(periodId: string): void {
    this.getInvoice(periodId).subscribe({
      next: (res) => this.printInvoice(res.data),
      error: () => alert('Impossible de générer la facture. Veuillez réessayer.'),
    });
  }

  // ─── Générer le HTML et déclencher l'impression ───────────────────────────
  private printInvoice(invoice: InvoiceData): void {
    const html = this.buildInvoiceHtml(invoice);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Attendre le chargement complet avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  }

  // ─── Template HTML de la facture ─────────────────────────────────────────
  private buildInvoiceHtml(inv: InvoiceData): string {
    const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n || 0);
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A';
    const fmtDateTime = (d: any) => d ? new Date(d).toLocaleString('fr-FR') : 'N/A';
    const planLabel = inv.plan?.toLowerCase() === 'premium' ? 'Premium' : 'Gratuit';
    const providerLabel: Record<string, string> = {
      STRIPE: 'Carte bancaire', MTN: 'MTN Mobile Money',
      ORANGE: 'Orange Money', EASY_TRANSACT: 'Easy Transact',
    };

    const unitsRows = (inv.unitsDetails || []).map(u => `
      <tr>
        <td>${u.propertyName || ''}</td>
        <td>${u.unitCode || ''}</td>
        <td class="right">${fmt(u.unitPrice)} FCFA</td>
        <td class="center">${u.occupiedDays} j</td>
        <td class="center">${u.isEligible ? '✓' : '✗'}</td>
        <td class="right">${fmt(u.revenue)} FCFA</td>
      </tr>
    `).join('');

    const emptyUnits = `<tr><td colspan="6" class="center muted">Aucune unité facturée ce mois</td></tr>`;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${inv.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 40px; }
    .invoice-wrapper { max-width: 800px; margin: 0 auto; }

    /* Header */
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #2563eb; }
    .inv-logo { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -1px; }
    .inv-logo span { color: #1a1a2e; }
    .inv-meta { text-align: right; }
    .inv-meta h1 { font-size: 22px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
    .inv-meta p { color: #6b7280; font-size: 12px; }

    /* Status badge */
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-paid { background: #d1fae5; color: #065f46; }
    .badge-waiting { background: #fef3c7; color: #92400e; }
    .badge-unpaid { background: #fee2e2; color: #991b1b; }
    .badge-free { background: #e0e7ff; color: #3730a3; }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .info-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #6b7280; margin-bottom: 10px; }
    .info-box p { font-size: 13px; color: #1a1a2e; margin-bottom: 4px; }
    .info-box .value { font-weight: 600; }

    /* Table */
    .section-title { font-size: 14px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead tr { background: #2563eb; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:hover { background: #f8fafc; }
    tbody td { padding: 10px 12px; font-size: 12px; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #9ca3af; font-style: italic; }

    /* Total */
    .total-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .total-box { background: #2563eb; color: #fff; border-radius: 10px; padding: 20px 28px; min-width: 260px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .total-row.main { font-size: 18px; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px; margin-top: 4px; }

    /* Payment info */
    .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
    .payment-info h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #065f46; margin-bottom: 10px; }
    .payment-info p { font-size: 12px; color: #065f46; margin-bottom: 4px; }

    /* Footer */
    .inv-footer { text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #9ca3af; font-size: 11px; }
    .inv-footer strong { color: #2563eb; }

    @media print {
      body { padding: 20px; }
      .invoice-wrapper { max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="invoice-wrapper">

  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="inv-logo">Ndewa<span>360°</span></div>
      <p style="color:#6b7280;font-size:12px;margin-top:4px;">Plateforme de gestion locative</p>
    </div>
    <div class="inv-meta">
      <h1>FACTURE</h1>
      <p><strong>${inv.invoiceNumber}</strong></p>
      <p>Émise le ${fmtDate(inv.createdAt)}</p>
      <p style="margin-top:8px;">
        <span class="badge ${inv.status === 'payed' ? 'badge-paid' : inv.status === 'waiting' ? 'badge-waiting' : inv.status === 'unpaid' ? 'badge-unpaid' : 'badge-free'}">
          ${inv.status === 'payed' ? 'Payée' : inv.status === 'waiting' ? 'En attente' : inv.status === 'unpaid' ? 'Impayée' : 'Gratuit'}
        </span>
      </p>
    </div>
  </div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-box">
      <h3>Informations client</h3>
      <p class="value">${inv.userInfo.name || 'N/A'}</p>
      <p>${inv.userInfo.email || 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3>Détails de la période</h3>
      <p><span class="value">Référence :</span> ${inv.period.billingRef}</p>
      <p><span class="value">Période :</span> ${fmtDate(inv.period.startDate)} → ${fmtDate(inv.period.endDate)}</p>
      <p><span class="value">Forfait :</span> ${planLabel}</p>
      <p><span class="value">Unités facturées :</span> ${inv.occupiedUnits}</p>
    </div>
  </div>

  <!-- Tableau des unités -->
  <div class="section-title">Détail des unités locatives</div>
  <table>
    <thead>
      <tr>
        <th>Propriété</th>
        <th>Unité</th>
        <th class="right">Loyer mensuel</th>
        <th class="center">Jours occupés</th>
        <th class="center">Éligible</th>
        <th class="right">Frais (2%)</th>
      </tr>
    </thead>
    <tbody>
      ${unitsRows || emptyUnits}
    </tbody>
  </table>

  <!-- Total -->
  <div class="total-section">
    <div class="total-box">
      <div class="total-row">
        <span>Unités facturées</span>
        <span>${inv.occupiedUnits}</span>
      </div>
      <div class="total-row">
        <span>Revenus locatifs totaux</span>
        <span>${fmt(inv.totalRevenue)} FCFA</span>
      </div>
      <div class="total-row main">
        <span>TOTAL À PAYER</span>
        <span>${fmt(inv.amount)} FCFA</span>
      </div>
    </div>
  </div>

  <!-- Informations de paiement (si payée) -->
  ${inv.status === 'payed' ? `
  <div class="payment-info">
    <h3>✓ Paiement confirmé</h3>
    <p><strong>Date de paiement :</strong> ${fmtDateTime(inv.paidAt || inv.transaction?.processedAt)}</p>
    ${inv.paymentMethod ? `<p><strong>Méthode :</strong> ${providerLabel[inv.paymentMethod] || inv.paymentMethod}</p>` : ''}
    ${inv.transaction ? `<p><strong>Référence transaction :</strong> ${inv.transaction.externalRef}</p>` : ''}
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="inv-footer">
    <p>Cette facture a été générée automatiquement par <strong>Ndewa360°</strong></p>
    <p style="margin-top:4px;">Pour toute question, contactez notre support.</p>
  </div>

</div>
</body>
</html>`;
  }
}
