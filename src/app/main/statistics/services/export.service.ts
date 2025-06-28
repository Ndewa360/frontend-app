import { Injectable } from '@angular/core';
import { StatisticRoomYearModel, StatisticLocataireYearModel, StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store';

export interface ExportOptions {
  title: string;
  filename: string;
  includeCharts: boolean;
  includeData: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Export room statistics data
   */
  async exportRoomStatistics(data: StatisticRoomYearModel[], options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        this.exportRoomStatisticsToCSV(data, options);
        break;
      case 'excel':
        await this.exportRoomStatisticsToExcel(data, options);
        break;
      case 'pdf':
        await this.exportRoomStatisticsToPDF(data, options);
        break;
    }
  }

  /**
   * Export tenant statistics data
   */
  async exportTenantStatistics(data: StatisticLocataireYearModel[], options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        this.exportTenantStatisticsToCSV(data, options);
        break;
      case 'excel':
        await this.exportTenantStatisticsToExcel(data, options);
        break;
      case 'pdf':
        await this.exportTenantStatisticsToPDF(data, options);
        break;
    }
  }

  /**
   * Export payment recapitulation data
   */
  async exportPaymentRecapitulation(data: StatisticPaymentOfAllPropertyByYear, options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'csv':
        this.exportPaymentRecapitulationToCSV(data, options);
        break;
      case 'excel':
        await this.exportPaymentRecapitulationToExcel(data, options);
        break;
      case 'pdf':
        await this.exportPaymentRecapitulationToPDF(data, options);
        break;
    }
  }

  // CSV Export Methods
  private exportRoomStatisticsToCSV(data: StatisticRoomYearModel[], options: ExportOptions): void {
    const headers = ['Chambre', 'Code', 'Type', 'Prix', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Total'];
    const rows = data.map(item => [
      item.room?.code || 'N/A',
      item.room?.code || 'N/A',
      item.room?.type || 'N/A',
      item.room?.price || 0,
      ...item.paymentValue,
      item.paymentValue.reduce((sum, val) => sum + val, 0)
    ]);

    this.downloadCSV([headers, ...rows], options.filename);
  }

  private exportTenantStatisticsToCSV(data: StatisticLocataireYearModel[], options: ExportOptions): void {
    const headers = ['Locataire', 'Email', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Total'];
    const rows = data.map(item => [
      item.locataire?.fullName || 'N/A',
      item.locataire?.email || 'N/A',
      ...item.paymentValue,
      item.paymentValue.reduce((sum, val) => sum + val, 0)
    ]);

    this.downloadCSV([headers, ...rows], options.filename);
  }

  private exportPaymentRecapitulationToCSV(data: StatisticPaymentOfAllPropertyByYear, options: ExportOptions): void {
    const headers = ['Propriété', 'Mois', 'Montant Reçu', 'Montant Attendu', 'Reliquat'];
    const rows: any[] = [];

    data.paymentProperty.forEach(property => {
      property.amountMonth.forEach((month, index) => {
        rows.push([
          property.property?.name || 'N/A',
          this.getMonthName(index),
          month.totalAmountReceived,
          month.totalAmountToBeReceveid,
          month.totalAmountRelicat
        ]);
      });
    });

    this.downloadCSV([headers, ...rows], options.filename);
  }

  // Excel Export Methods (simplified - would need a library like xlsx)
  private async exportRoomStatisticsToExcel(data: StatisticRoomYearModel[], options: ExportOptions): Promise<void> {
    console.log('Excel export not implemented yet. Use CSV for now.');
    this.exportRoomStatisticsToCSV(data, { ...options, format: 'csv' });
  }

  private async exportTenantStatisticsToExcel(data: StatisticLocataireYearModel[], options: ExportOptions): Promise<void> {
    console.log('Excel export not implemented yet. Use CSV for now.');
    this.exportTenantStatisticsToCSV(data, { ...options, format: 'csv' });
  }

  private async exportPaymentRecapitulationToExcel(data: StatisticPaymentOfAllPropertyByYear, options: ExportOptions): Promise<void> {
    console.log('Excel export not implemented yet. Use CSV for now.');
    this.exportPaymentRecapitulationToCSV(data, { ...options, format: 'csv' });
  }

  // PDF Export Methods (simplified - would need a library like jsPDF)
  private async exportRoomStatisticsToPDF(data: StatisticRoomYearModel[], options: ExportOptions): Promise<void> {
    console.log('PDF export not implemented yet. Use CSV for now.');
    this.exportRoomStatisticsToCSV(data, { ...options, format: 'csv' });
  }

  private async exportTenantStatisticsToPDF(data: StatisticLocataireYearModel[], options: ExportOptions): Promise<void> {
    console.log('PDF export not implemented yet. Use CSV for now.');
    this.exportTenantStatisticsToCSV(data, { ...options, format: 'csv' });
  }

  private async exportPaymentRecapitulationToPDF(data: StatisticPaymentOfAllPropertyByYear, options: ExportOptions): Promise<void> {
    console.log('PDF export not implemented yet. Use CSV for now.');
    this.exportPaymentRecapitulationToCSV(data, { ...options, format: 'csv' });
  }

  // Utility Methods
  private downloadCSV(data: any[][], filename: string): void {
    const csvContent = data.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private getMonthName(index: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[index] || 'N/A';
  }

  /**
   * Generate export filename with timestamp
   */
  generateFilename(prefix: string, format: string): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    return `${prefix}_${timestamp}`;
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: ExportOptions): boolean {
    return !!(options.title && options.filename && options.format);
  }
}
