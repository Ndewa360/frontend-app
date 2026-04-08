import { Injectable } from '@angular/core';
import {
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentStateType,
  TenantAnalysisItem
} from '../store';

export interface TenantPaymentCalculation {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyRent: number;
  entryDate: Date;
  monthsOccupied: number;
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  paymentRate: number;
  // ✅ Statuts alignés avec le backend
  status: 'up_to_date' | 'advance' | 'behind' | 'ahead' | 'partial' | 'late' | 'no_contract' | 'ended_contract';
  statusLabel: string;
  monthsBehind: number;
  amountBehind: number;
  advanceAmount: number;
  monthlyDetails: MonthlyPaymentDetail[];
  lastPaymentMonth: number | null;
  contractStatus: 'active' | 'ended' | 'none';
}

export interface MonthlyPaymentDetail {
  month: number;
  monthName: string;
  year: number;
  expected: number;
  received: number;
  status: StatisticPaymentStateType;
  isDue: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TenantPaymentCalculatorService {

  /**
   * Transforme un TenantAnalysisItem (données backend enrichies) en TenantPaymentCalculation
   * utilisable par les composants. Aucun recalcul — on fait confiance au backend.
   */
  fromBackendTenantAnalysis(tenant: TenantAnalysisItem): TenantPaymentCalculation {
    const fa = tenant.financialAnalysis;
    const paymentRate = fa.expectedPaymentToDate > 0
      ? Math.min((fa.totalPaid / fa.expectedPaymentToDate) * 100, 100)
      : 0;

    return {
      tenantId: tenant.locataire?._id || '',
      tenantName: tenant.locataire?.fullName || 'Locataire inconnu',
      roomCode: tenant.room?.code || 'N/A',
      monthlyRent: fa.monthlyRent,
      entryDate: new Date(fa.entryDate),
      monthsOccupied: fa.monthsElapsed,
      totalExpected: fa.expectedPaymentToDate,
      totalReceived: fa.totalPaid,
      totalPending: Math.max(0, fa.expectedPaymentToDate - fa.totalPaid),
      paymentRate: Math.round(paymentRate * 100) / 100,
      status: this.mapBackendStatus(fa.status),
      statusLabel: this.getStatusLabel(fa.status),
      monthsBehind: fa.monthsBehind,
      amountBehind: fa.amountBehind,
      advanceAmount: fa.advanceAmount,
      monthlyDetails: this.buildMonthlyDetailsFromPayments(fa.monthlyPayments, fa.entryDate, fa.monthlyRent),
      lastPaymentMonth: fa.lastPaymentMonth,
      contractStatus: fa.status === 'behind' || fa.status === 'up_to_date' || fa.status === 'advance' ? 'active' : 'active'
    };
  }

  /**
   * Transforme les données de paiement par locataire (endpoint all-inyear)
   * en TenantPaymentCalculation en utilisant les métriques déjà calculées par le backend.
   */
  fromStatisticAllPayment(
    paymentStat: StatisticAllPaymentLocataireYearModel,
    selectedYear: number
  ): TenantPaymentCalculation | null {
    if (!paymentStat.locataire || !paymentStat.room) return null;

    const monthlyRent = paymentStat.room.price || 0;
    if (monthlyRent <= 0) return null;

    // ✅ Utiliser les métriques pré-calculées par le backend si disponibles
    const totalReceived = paymentStat.totalPaid
      ?? paymentStat.paymentState.reduce((sum, p) => sum + (p.price || 0), 0);

    const totalExpected = paymentStat.expectedAmount ?? 0;
    const paymentRate = totalExpected > 0
      ? Math.min((totalReceived / totalExpected) * 100, 100)
      : 0;

    const monthlyDetails = paymentStat.paymentState.map(p => ({
      month: p.month,
      monthName: this.getMonthName(p.month - 1),
      year: selectedYear,
      // ✅ Correction : utiliser `price` (montant réellement payé)
      received: p.price || 0,
      expected: p.unitLocationPaymentPrice || monthlyRent,
      status: p.state,
      isDue: p.state !== StatisticPaymentStateType.NO_CONTRACT && p.state !== StatisticPaymentStateType.ENDED_CONTRACT
    }));

    const status = paymentStat.paymentStatus
      ? this.mapBackendStatus(paymentStat.paymentStatus)
      : this.deriveStatusFromRate(paymentRate);

    return {
      tenantId: paymentStat.locataire._id || '',
      tenantName: paymentStat.locataire.fullName || 'Locataire inconnu',
      roomCode: paymentStat.room.code || 'N/A',
      monthlyRent,
      entryDate: new Date(selectedYear, 0, 1),
      monthsOccupied: paymentStat.monthsDue ?? 12,
      totalExpected,
      totalReceived,
      totalPending: Math.max(0, totalExpected - totalReceived),
      paymentRate: Math.round(paymentRate * 100) / 100,
      status,
      statusLabel: this.getStatusLabel(status),
      monthsBehind: 0,
      amountBehind: Math.max(0, totalExpected - totalReceived),
      advanceAmount: Math.max(0, totalReceived - totalExpected),
      monthlyDetails,
      lastPaymentMonth: paymentStat.paymentState.reduce((last, p) => p.price > 0 ? p.month : last, null as number | null),
      contractStatus: 'active'
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private mapBackendStatus(status: string): TenantPaymentCalculation['status'] {
    // Aligne les statuts backend avec l'interface frontend
    const map: Record<string, TenantPaymentCalculation['status']> = {
      up_to_date: 'up_to_date',
      advance: 'advance',
      ahead: 'advance',       // alias
      behind: 'behind',
      late: 'behind',         // alias
      partial: 'partial',
      no_payment: 'behind',
      no_contract: 'no_contract',
      ended_contract: 'ended_contract'
    };
    return map[status] || 'no_contract';
  }

  private deriveStatusFromRate(rate: number): TenantPaymentCalculation['status'] {
    if (rate > 100) return 'advance';
    if (rate >= 95) return 'up_to_date';
    if (rate >= 50) return 'partial';
    if (rate > 0) return 'behind';
    return 'behind';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      up_to_date: 'À jour',
      advance: 'En avance',
      ahead: 'En avance',
      behind: 'En retard',
      late: 'En retard',
      partial: 'Paiement partiel',
      no_contract: 'Pas de contrat',
      ended_contract: 'Contrat terminé',
      no_payment: 'Aucun paiement'
    };
    return labels[status] || 'Inconnu';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      up_to_date: 'text-green-600 bg-green-100',
      advance: 'text-blue-600 bg-blue-100',
      ahead: 'text-blue-600 bg-blue-100',
      behind: 'text-red-600 bg-red-100',
      late: 'text-red-600 bg-red-100',
      partial: 'text-yellow-600 bg-yellow-100',
      no_contract: 'text-gray-600 bg-gray-100',
      ended_contract: 'text-purple-600 bg-purple-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  private buildMonthlyDetailsFromPayments(
    monthlyPayments: number[],
    entryDate: Date,
    monthlyRent: number
  ): MonthlyPaymentDetail[] {
    const entry = new Date(entryDate);
    const now = new Date();
    return monthlyPayments.map((amount, index) => {
      const monthDate = new Date(entry.getFullYear(), index, 1);
      const isDue = monthDate >= new Date(entry.getFullYear(), entry.getMonth(), 1)
        && monthDate <= new Date(now.getFullYear(), now.getMonth(), 1);

      let status: StatisticPaymentStateType = StatisticPaymentStateType.NO_CONTRACT;
      if (isDue) {
        if (amount >= monthlyRent) status = StatisticPaymentStateType.PAYED;
        else if (amount > 0) status = StatisticPaymentStateType.PARTIAL_PAYMENT;
        else status = StatisticPaymentStateType.UNPAYED;
      }

      return {
        month: index + 1,
        monthName: this.getMonthName(index),
        year: entry.getFullYear(),
        expected: isDue ? monthlyRent : 0,
        received: amount,
        status,
        isDue
      };
    });
  }

  private getMonthName(index: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[index] || 'Inconnu';
  }
}
