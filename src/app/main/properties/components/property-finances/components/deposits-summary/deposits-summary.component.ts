import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import {
  EnrichedStatisticResponse
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { TranslateService } from '@ngx-translate/core';
import { TranslationUtilsService } from 'src/app/shared/services/translation-utils.service';
import { ExportData } from '../../property-finances.component';

export interface DepositSummary {
  roomId: string;
  roomCode: string;
  roomType: string;
  roomPrice: number;
  expectedDeposit: number;
  receivedDeposit: number;
  depositRate: number;
  cautionStatus: string;
  cautionDeficit: number;
  cautionExcess: number;
  paymentsCount: number;
  cautionPayments: {
    paymentId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
  }[];
  lastCautionPayment: {
    paymentId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
  } | null;
  status: 'complete' | 'partial' | 'missing' | 'no_tenant' | 'overpaid';
  tenantName?: string;
  tenantId?: string;
  locationStartDate?: Date;
  locationEndDate?: Date | null;
}

@Component({
  selector: 'app-deposits-summary',
  templateUrl: './deposits-summary.component.html',
  styleUrls: ['./deposits-summary.component.scss']
})
export class DepositsSummaryComponent implements OnInit, OnChanges {
  @Input() enrichedData: EnrichedStatisticResponse[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  depositSummaries: DepositSummary[] = [];
  filteredSummaries: DepositSummary[] = [];

  // Filtres
  statusFilter: 'all' | 'complete' | 'partial' | 'missing' | 'no_tenant' = 'all';
  searchTerm: string = '';

  // Statistiques globales
  globalStats = {
    totalRooms: 0,
    totalOccupiedRooms: 0,
    roomsRequiringCaution: 0,
    roomsWithCautionPaid: 0,
    roomsWithCautionUnpaid: 0,
    totalCautionsReceived: 0,
    totalCautionsExpected: 0,
    cautionCoverageRate: 0,
    paidCautions: 0,
    partialCautions: 0,
    unpaidCautions: 0,
    overpaidCautions: 0,
    completeDeposits: 0,
    partialDeposits: 0,
    missingDeposits: 0,
    totalExpectedDeposits: 0,
    totalReceivedDeposits: 0,
    averageDepositRate: 0
  };
  
  Math = Math;
  
  cautionAlerts: string[] = [];

  constructor(
    private store: Store,
    private translateService: TranslateService,
    private translationUtils: TranslationUtilsService
  ) { }

  ngOnInit(): void {
    this.processDepositData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enrichedData'] || changes['selectedYear']) {
      this.processDepositData();
    }
  }

  private processDepositData(): void {
    this.depositSummaries = [];

    if (!this.enrichedData || this.enrichedData.length === 0) {
      this.calculateGlobalStats();
      this.applyFilters();
      return;
    }

    const cautionsData = this.enrichedData[0].data.cautionsAnalysis;
    
    // Utiliser les données pré-calculées du backend
    this.depositSummaries = cautionsData.roomsCautions.map(roomCaution => {
      const depositRate = roomCaution.expectedCautionAmount > 0 
        ? (roomCaution.totalCautionPaid / roomCaution.expectedCautionAmount) * 100 
        : 0;
        
      return {
        roomId: roomCaution.room._id,
        roomCode: roomCaution.room.code || 'N/A',
        roomType: this.translationUtils.getRoomTypeLabel(roomCaution.room.type),
        roomPrice: roomCaution.room.price || 0,
        expectedDeposit: roomCaution.expectedCautionAmount,
        receivedDeposit: roomCaution.totalCautionPaid,
        depositRate,
        cautionStatus: roomCaution.cautionStatus,
        cautionDeficit: roomCaution.cautionDeficit,
        cautionExcess: roomCaution.cautionExcess,
        paymentsCount: roomCaution.paymentsCount,
        cautionPayments: roomCaution.cautionPayments,
        lastCautionPayment: roomCaution.lastCautionPayment,
        status: this.mapCautionStatusToDepositStatus(roomCaution.cautionStatus, depositRate),
        tenantName: roomCaution.tenant?.fullName && roomCaution.tenant.fullName !== 'Locataire inconnu' 
          ? roomCaution.tenant.fullName 
          : 'Aucun locataire',
        tenantId: roomCaution.tenant?._id,
        locationStartDate: roomCaution.location?.startedAt ? new Date(roomCaution.location.startedAt) : undefined,
        locationEndDate: roomCaution.location?.endedAt ? new Date(roomCaution.location.endedAt) : null
      };
    });
    
    // Utiliser les statistiques globales du backend
    this.globalStats = {
      totalRooms: cautionsData.roomsCautions.length,
      totalOccupiedRooms: cautionsData.summary.totalOccupiedRooms,
      roomsRequiringCaution: cautionsData.summary.roomsRequiringCaution,
      roomsWithCautionPaid: cautionsData.summary.roomsWithCautionPaid,
      roomsWithCautionUnpaid: cautionsData.summary.roomsWithCautionUnpaid,
      totalCautionsReceived: cautionsData.summary.totalCautionsReceived,
      totalCautionsExpected: cautionsData.summary.totalCautionsExpected,
      cautionCoverageRate: cautionsData.summary.cautionCoverageRate,
      paidCautions: cautionsData.summary.paidCautions,
      partialCautions: cautionsData.summary.partialCautions,
      unpaidCautions: cautionsData.summary.unpaidCautions,
      overpaidCautions: cautionsData.summary.overpaidCautions,
      completeDeposits: this.depositSummaries.filter(d => d.status === 'complete').length,
      partialDeposits: this.depositSummaries.filter(d => d.status === 'partial').length,
      missingDeposits: this.depositSummaries.filter(d => d.status === 'missing').length,
      totalExpectedDeposits: cautionsData.summary.totalCautionsExpected,
      totalReceivedDeposits: cautionsData.summary.totalCautionsReceived,
      averageDepositRate: cautionsData.summary.cautionCoverageRate
    };
    
    this.cautionAlerts = cautionsData.alerts || [];
    this.applyFilters();
  }

  private mapCautionStatusToDepositStatus(cautionStatus: string, depositRate: number): DepositSummary['status'] {
    switch (cautionStatus.toLowerCase()) {
      case 'paid':
        return depositRate > 100 ? 'overpaid' : 'complete';
      case 'partial':
        return 'partial';
      case 'unpaid':
        return 'missing';
      case 'no_tenant':
      case 'vacant':
        return 'no_tenant';
      case 'overpaid':
        return 'overpaid';
      default:
        // Fallback basé sur le taux
        if (depositRate > 100) return 'overpaid';
        if (depositRate >= 100) return 'complete';
        if (depositRate > 0) return 'partial';
        return 'missing';
    }
  }

  private calculateGlobalStats(): void {
    console.log('📊 Statistiques globales des cautions chargées depuis le backend');
  }
  
  getMonthName(monthNumber: number): string {
    return this.translationUtils.getMonthName(monthNumber);
  }
  
  getMonthShortName(monthNumber: number): string {
    return this.translationUtils.getMonthShortName(monthNumber);
  }
  
  applyFilters(): void {
    this.filteredSummaries = this.depositSummaries.filter(deposit => {
      if (this.statusFilter !== 'all' && deposit.status !== this.statusFilter) {
        return false;
      }

      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return deposit.roomCode.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }
  
  onExportDeposits(): void {
    const exportData = this.filteredSummaries.map(deposit => ({
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.UNIT')]: deposit.roomCode,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.TYPE')]: deposit.roomType,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.RENT')]: deposit.roomPrice,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.EXPECTED_DEPOSIT')]: deposit.expectedDeposit,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.RECEIVED_DEPOSIT')]: deposit.receivedDeposit,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.RATE')]: `${deposit.depositRate.toFixed(1)}%`,
      [this.translateService.instant('DEPOSITS_SUMMARY.TABLE.HEADERS.STATUS')]: this.translateService.instant(this.getStatusLabel(deposit.status)),
      [this.translateService.instant('COMMON.REFERENCE')]: deposit.cautionStatus,
      [this.translateService.instant('TENANT_PAYMENT_TRACKING.TABLE.LAST_PAYMENT')]: deposit.cautionPayments.length,
      [this.translateService.instant('FINANCIAL_DASHBOARD.YEAR')]: this.selectedYear
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: this.translationUtils.getTranslatedFilename('DEPOSITS_SUMMARY.TITLE', this.selectedYear)
    });
  }
  
  getStatusLabel(status: DepositSummary['status']): string {
    const labels = {
      'complete': 'DEPOSITS_SUMMARY.STATUS_LABELS.COMPLETE',
      'partial': 'DEPOSITS_SUMMARY.STATUS_LABELS.PARTIAL',
      'missing': 'DEPOSITS_SUMMARY.STATUS_LABELS.MISSING',
      'no_tenant': 'DEPOSITS_SUMMARY.STATUS_LABELS.NO_TENANT',
      'overpaid': 'DEPOSITS_SUMMARY.STATUS_LABELS.OVERPAID'
    };
    return labels[status] || 'DEPOSITS_SUMMARY.STATUS_LABELS.MISSING';
  }

  getStatusColor(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'no_tenant': return 'bg-gray-100 text-gray-800';
      case 'overpaid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  trackByRoomId(_: number, deposit: DepositSummary): string {
    return deposit.roomId;
  }
  
  onExportDepositSummary(): void {
    this.onExportDeposits();
  }
  
  formatPrice(amount: number): string {
    return this.formatCurrency(amount);
  }
  
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  getStatusIcon(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'partial': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'missing': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'no_tenant': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      case 'overpaid': return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
      default: return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }
}