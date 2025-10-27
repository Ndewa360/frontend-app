import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationUtilsService {

  constructor(private translateService: TranslateService) { }

  /**
   * Traduit le nom d'un mois (1-12) en version complète
   */
  getMonthName(monthNumber: number): string {
    const months = [
      'MONTHS.JANUARY', 'MONTHS.FEBRUARY', 'MONTHS.MARCH', 'MONTHS.APRIL',
      'MONTHS.MAY', 'MONTHS.JUNE', 'MONTHS.JULY', 'MONTHS.AUGUST',
      'MONTHS.SEPTEMBER', 'MONTHS.OCTOBER', 'MONTHS.NOVEMBER', 'MONTHS.DECEMBER'
    ];
    return this.translateService.instant(months[monthNumber - 1] || months[0]);
  }

  /**
   * Traduit le nom d'un mois (1-12) en version courte
   */
  getMonthShortName(monthNumber: number): string {
    const months = [
      'MONTHS_SHORT.JAN', 'MONTHS_SHORT.FEB', 'MONTHS_SHORT.MAR', 'MONTHS_SHORT.APR',
      'MONTHS_SHORT.MAY', 'MONTHS_SHORT.JUN', 'MONTHS_SHORT.JUL', 'MONTHS_SHORT.AUG',
      'MONTHS_SHORT.SEP', 'MONTHS_SHORT.OCT', 'MONTHS_SHORT.NOV', 'MONTHS_SHORT.DEC'
    ];
    return this.translateService.instant(months[monthNumber - 1] || months[0]);
  }

  /**
   * Traduit le nom d'un mois à partir d'une date
   */
  getMonthNameFromDate(date: Date): string {
    return this.getMonthName(date.getMonth() + 1);
  }

  /**
   * Traduit le nom court d'un mois à partir d'une date
   */
  getMonthShortNameFromDate(date: Date): string {
    return this.getMonthShortName(date.getMonth() + 1);
  }

  /**
   * Traduit un type de chambre
   */
  getRoomTypeLabel(roomType: any): string {
    if (typeof roomType === 'string') {
      const typeKey = `ROOM_TYPES.${roomType.toUpperCase()}`;
      return this.translateService.instant(typeKey) !== typeKey ? 
        this.translateService.instant(typeKey) : roomType;
    }
    const label = roomType?.label || roomType?.name || 'Standard';
    const typeKey = `ROOM_TYPES.${label.toUpperCase()}`;
    return this.translateService.instant(typeKey) !== typeKey ? 
      this.translateService.instant(typeKey) : label;
  }

  /**
   * Prépare les headers d'export traduits pour un composant donné
   */
  getTranslatedExportHeaders(headerKeys: string[]): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    headerKeys.forEach(key => {
      headers[key] = this.translateService.instant(key);
    });
    return headers;
  }

  /**
   * Génère un nom de fichier traduit
   */
  getTranslatedFilename(titleKey: string, year?: number, extension?: string): string {
    const title = this.translateService.instant(titleKey).toLowerCase().replace(/\s+/g, '-');
    const yearSuffix = year ? `-${year}` : '';
    const ext = extension ? `.${extension}` : '';
    return `${title}${yearSuffix}${ext}`;
  }
}