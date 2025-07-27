import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: any[];
  propertyName?: string; // Nom de la propriété pour un nom de fichier plus lisible
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private toastr: ToastrService) {}

  /**
   * Exporter en CSV
   */
  exportToCSV(options: ExportOptions): void {
    try {
      if (!options.data || options.data.length === 0) {
        this.toastr.warning('Aucune donnée à exporter', 'Export CSV');
        return;
      }

      const csvContent = this.generateCSV(options);
      const fileName = this.generateFileName(options.filename, options.propertyName, 'csv');
      this.downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
      
      this.toastr.success(`${options.data.length} éléments exportés en CSV`, 'Export réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      this.toastr.error('Erreur lors de l\'export CSV', 'Erreur');
    }
  }

  /**
   * Exporter en Excel (vrai format Excel)
   */
  exportToExcel(options: ExportOptions): void {
    try {
      if (!options.data || options.data.length === 0) {
        this.toastr.warning('Aucune donnée à exporter', 'Export Excel');
        return;
      }

      this.generateExcelFile(options);

      this.toastr.success(`${options.data.length} éléments exportés en Excel`, 'Export réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      this.toastr.error('Erreur lors de l\'export Excel', 'Erreur');
    }
  }

  /**
   * Générer un fichier Excel réel
   */
  private generateExcelFile(options: ExportOptions): void {
    // Préparer les données pour Excel
    const worksheetData: any[][] = [];

    // Ajouter les en-têtes
    const headers = options.columns.map(col => col.label);
    worksheetData.push(headers);

    // Ajouter les données
    options.data.forEach(item => {
      const row = options.columns.map(col => {
        let value = this.getNestedValue(item, col.key);

        // Appliquer le formateur si défini
        if (col.formatter && value !== null && value !== undefined) {
          value = col.formatter(value);
        }

        return value || '';
      });

      worksheetData.push(row);
    });

    // Créer le workbook et la worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Définir la largeur des colonnes
    const columnWidths = options.columns.map(col => ({ wch: 15 }));
    worksheet['!cols'] = columnWidths;

    // Ajouter la worksheet au workbook
    const sheetName = options.sheetName || 'Données';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Télécharger le fichier Excel
    const fileName = this.generateFileName(options.filename, options.propertyName, 'xlsx');
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Générer le contenu CSV
   */
  private generateCSV(options: ExportOptions, forExcel: boolean = false): string {
    const headers = options.columns.map(col => col.label);
    const rows: string[] = [];

    // Ajouter les en-têtes
    rows.push(headers.map(header => this.escapeCSVValue(header)).join(','));

    // Ajouter les données
    options.data.forEach(item => {
      const row = options.columns.map(col => {
        let value = this.getNestedValue(item, col.key);
        
        // Appliquer le formateur si défini
        if (col.formatter && value !== null && value !== undefined) {
          value = col.formatter(value);
        }
        
        return this.escapeCSVValue(value);
      });
      
      rows.push(row.join(','));
    });

    let csvContent = rows.join('\n');
    
    // Ajouter le BOM UTF-8 pour Excel
    if (forExcel) {
      csvContent = '\uFEFF' + csvContent;
    }
    
    return csvContent;
  }

  /**
   * Échapper les valeurs CSV
   */
  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '""';
    }
    
    const stringValue = String(value);
    
    // Si la valeur contient des virgules, guillemets ou retours à la ligne
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return `"${stringValue}"`;
  }

  /**
   * Obtenir une valeur imbriquée d'un objet
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Nettoyer le nom de fichier pour qu'il soit valide
   */
  private sanitizeFileName(name: string): string {
    if (!name) return 'Export';

    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Remplacer les caractères interdits par des underscores
      .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
      .replace(/_{2,}/g, '_') // Remplacer les underscores multiples par un seul
      .replace(/^_|_$/g, '') // Supprimer les underscores en début et fin
      .substring(0, 50); // Limiter la longueur
  }

  /**
   * Générer un nom de fichier intelligent
   */
  generateFileName(baseFileName: string, propertyName?: string, extension: string = ''): string {
    const currentDate = new Date().toISOString().split('T')[0];

    let fileName = baseFileName;

    if (propertyName) {
      const cleanPropertyName = this.sanitizeFileName(propertyName);
      fileName = `${baseFileName}_${cleanPropertyName}`;
    }

    fileName = `${fileName}_${currentDate}`;

    if (extension) {
      fileName = `${fileName}.${extension}`;
    }

    return fileName;
  }

  /**
   * Télécharger un fichier
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      this.toastr.error('Téléchargement non supporté par ce navigateur', 'Erreur');
    }
  }

  /**
   * Formateurs communs
   */
  static formatters = {
    date: (value: any) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toLocaleDateString('fr-FR');
    },
    
    dateTime: (value: any) => {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toLocaleString('fr-FR');
    },
    
    currency: (value: any) => {
      if (!value || isNaN(value)) return '0 FCFA';
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0
      }).format(value).replace('XAF', 'FCFA');
    },
    
    boolean: (value: any) => {
      return value ? 'Oui' : 'Non';
    },
    
    status: (value: any) => {
      const statusMap: { [key: string]: string } = {
        'available': 'Disponible',
        'occupied': 'Occupée',
        'maintenance': 'En maintenance',
        'active': 'Actif',
        'inactive': 'Inactif',
        'paid': 'Payé',
        'unpaid': 'Non payé',
        'pending': 'En attente'
      };
      return statusMap[value] || value || 'N/A';
    }
  };
}
