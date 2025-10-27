import { Pipe, PipeTransform } from '@angular/core';
import { TranslationUtilsService } from '../services/translation-utils.service';

@Pipe({
  name: 'monthTranslate',
  pure: false
})
export class MonthTranslatePipe implements PipeTransform {

  constructor(private translationUtils: TranslationUtilsService) {}

  transform(value: number | Date | string, format: 'full' | 'short' = 'full'): string {
    if (!value) return '';

    let monthNumber: number;

    if (value instanceof Date) {
      monthNumber = value.getMonth() + 1;
    } else if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      monthNumber = date.getMonth() + 1;
    } else if (typeof value === 'number') {
      monthNumber = value;
    } else {
      return '';
    }

    return format === 'short' 
      ? this.translationUtils.getMonthShortName(monthNumber)
      : this.translationUtils.getMonthName(monthNumber);
  }
}