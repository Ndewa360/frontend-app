import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return forkJoin([
      this.http.get(`./assets/i18n/${lang}.json`),
      this.http.get(`./assets/i18n/${lang}-legal.json`).pipe(
        catchError(() => of({}))
      )
    ]).pipe(
      map(([base, legal]) => ({ ...base, ...legal }))
    );
  }
}
