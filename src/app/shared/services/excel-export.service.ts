import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  sheetName?: string;
  includeMetadata?: boolean;
  metadata?: { [key: string]: any };
  autoWidth?: boolean;
  headerStyle?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Exporter des données vers Excel
   */
  exportToExcel(data: any[], filename: string, options: ExcelExportOptions = {}): void {
    try {
      // Configuration par défaut
      const config = {
        sheetName: 'Données',
        includeMetadata: false,
        autoWidth: true,
        ...options
      };

      // Créer un nouveau workbook
      const workbook = XLSX.utils.book_new();

      // Ajouter les métadonnées si demandées
      if (config.includeMetadata && config.metadata) {
        this.addMetadataSheet(workbook, config.metadata);
      }

      // Créer la feuille principale avec les données
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Appliquer le style automatique des colonnes
      if (config.autoWidth) {
        this.autoSizeColumns(worksheet, data);
      }

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

      // Générer et télécharger le fichier
      const fileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log('✅ Export Excel réussi:', fileName);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      throw error;
    }
  }

  /**
   * Exporter plusieurs feuilles vers Excel
   */
  exportMultipleSheets(sheets: { name: string; data: any[] }[], filename: string): void {
    try {
      const workbook = XLSX.utils.book_new();

      sheets.forEach(sheet => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        this.autoSizeColumns(worksheet, sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });

      const fileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log('✅ Export Excel multi-feuilles réussi:', fileName);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel multi-feuilles:', error);
      throw error;
    }
  }

  /**
   * Ajouter une feuille de métadonnées
   */
  private addMetadataSheet(workbook: XLSX.WorkBook, metadata: { [key: string]: any }): void {
    const metadataArray = Object.entries(metadata).map(([key, value]) => ({
      'Propriété': key,
      'Valeur': value
    }));

    const metadataSheet = XLSX.utils.json_to_sheet(metadataArray);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Métadonnées');
  }

  /**
   * Ajuster automatiquement la largeur des colonnes
   */
  private autoSizeColumns(worksheet: XLSX.WorkSheet, data: any[]): void {
    if (!data || data.length === 0) return;

    const columnWidths: { [key: string]: number } = {};

    // Calculer la largeur maximale pour chaque colonne
    Object.keys(data[0]).forEach(key => {
      // Largeur du header
      columnWidths[key] = key.length;

      // Vérifier la largeur des données
      data.forEach(row => {
        const cellValue = String(row[key] || '');
        if (cellValue.length > columnWidths[key]) {
          columnWidths[key] = cellValue.length;
        }
      });

      // Ajouter une marge et limiter la largeur maximale
      columnWidths[key] = Math.min(columnWidths[key] + 2, 50);
    });

    // Appliquer les largeurs
    const cols = Object.values(columnWidths).map(width => ({ width }));
    worksheet['!cols'] = cols;
  }

  /**
   * Formater les données financières pour l'export
   */
  formatFinancialData(data: any[]): any[] {
    return data.map(row => {
      const formattedRow = { ...row };
      
      // Formater les montants en FCFA
      Object.keys(formattedRow).forEach(key => {
        const value = formattedRow[key];
        
        // Si c'est un montant (contient des mots-clés financiers)
        if (this.isFinancialField(key) && typeof value === 'number') {
          formattedRow[key] = this.formatCurrency(value);
        }
        
        // Si c'est un pourcentage
        if (this.isPercentageField(key) && typeof value === 'number') {
          formattedRow[key] = `${value.toFixed(2)}%`;
        }
        
        // Si c'est une date
        if (this.isDateField(key) && value) {
          formattedRow[key] = this.formatDate(value);
        }
      });
      
      return formattedRow;
    });
  }

  private isFinancialField(fieldName: string): boolean {
    const financialKeywords = [
      'montant', 'prix', 'coût', 'revenus', 'dépenses', 'loyer', 
      'caution', 'charges', 'total', 'solde', 'paiement'
    ];
    
    return financialKeywords.some(keyword => 
      fieldName.toLowerCase().includes(keyword)
    );
  }

  private isPercentageField(fieldName: string): boolean {
    const percentageKeywords = ['taux', 'pourcentage', 'rate', '%'];
    
    return percentageKeywords.some(keyword => 
      fieldName.toLowerCase().includes(keyword)
    );
  }

  private isDateField(fieldName: string): boolean {
    const dateKeywords = ['date', 'créé', 'modifié', 'début', 'fin'];
    
    return dateKeywords.some(keyword => 
      fieldName.toLowerCase().includes(keyword)
    );
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(value);
  }

  private formatDate(value: any): string {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return String(value);
    }
  }

  /**
   * Créer un rapport financier complet
   */
  exportFinancialReport(
    propertyId: string,
    year: number,
    sections: { [key: string]: any[] }
  ): void {
    try {
      const sheets = Object.entries(sections).map(([sectionName, data]) => ({
        name: this.getSectionDisplayName(sectionName),
        data: this.formatFinancialData(data)
      }));

      // Ajouter une feuille de résumé
      const summaryData = this.createSummarySheet(sections);
      sheets.unshift({
        name: 'Résumé',
        data: summaryData
      });

      const filename = `rapport-financier-${propertyId}-${year}`;
      this.exportMultipleSheets(sheets, filename);
    } catch (error) {
      console.error('❌ Erreur lors de la création du rapport financier:', error);
      throw error;
    }
  }

  private getSectionDisplayName(sectionName: string): string {
    const displayNames: { [key: string]: string } = {
      dashboard: 'Tableau de bord',
      overview: 'Vue d\'ensemble',
      tenants: 'Analyse locataires',
      deposits: 'Cautions',
      monthly: 'Revenus mensuels',
      payments: 'Paiements',
      statistics: 'Statistiques'
    };
    
    return displayNames[sectionName] || sectionName;
  }

  private createSummarySheet(sections: { [key: string]: any[] }): any[] {
    const summary = [];
    
    Object.entries(sections).forEach(([sectionName, data]) => {
      summary.push({
        'Section': this.getSectionDisplayName(sectionName),
        'Nombre d\'enregistrements': data.length,
        'Dernière mise à jour': new Date().toLocaleDateString('fr-FR')
      });
    });
    
    return summary;
  }
}
