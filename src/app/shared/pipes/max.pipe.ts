import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'max'
})
export class MaxPipe implements PipeTransform {
  transform(array: any[], property?: string): number {
    if (!array || array.length === 0) {
      return 0;
    }

    if (property) {
      // Si une propriété est spécifiée, trouver la valeur max de cette propriété
      return Math.max(...array.map(item => item[property] || 0));
    } else {
      // Sinon, trouver la valeur max directement dans le tableau
      return Math.max(...array);
    }
  }
}
