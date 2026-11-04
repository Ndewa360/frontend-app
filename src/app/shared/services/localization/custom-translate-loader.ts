import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  /**
   * Traductions de base seulement. L'administration (ADMIN) et les textes
   * juridiques (LEGAL) sont chargés par les pages qui en ont besoin
   * (TranslationChunksService) : environ 120 Ko de moins au démarrage.
   */
  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`).pipe(catchError(() => of({})));
  }
}
