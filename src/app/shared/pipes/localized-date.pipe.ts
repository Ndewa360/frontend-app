import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localizedDate'
})
export class LocalizedDatePipe implements PipeTransform {

  transform(value: Date | string, format = 'mediumDate'): string {
    const datePipe = new DatePipe( 'fr');
    return datePipe.transform(value, format);
  }

}
