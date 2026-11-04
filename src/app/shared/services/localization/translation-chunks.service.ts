import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

/** Parties des traductions chargées seulement par les pages qui en ont besoin. */
export type TranslationChunk = 'admin' | 'legal';

/**
 * Traductions découpées : le fichier de base (`fr.json`) est chargé au
 * démarrage ; l'administration (`fr-admin.json`, clé ADMIN) et les textes
 * juridiques (`fr-legal.json`, clé LEGAL) ne le sont qu'à l'ouverture des
 * pages concernées. Les trois fichiers (environ 400 Ko) étaient chargés pour
 * chaque visiteur, y compris un locataire sur la page de paiement.
 */
@Injectable({ providedIn: 'root' })
export class TranslationChunksService {
  private readonly loaded = new Map<string, Observable<void>>();
  private readonly wanted = new Set<TranslationChunk>();

  constructor(private http: HttpClient, private translate: TranslateService) {
    // Changement de langue : les parties déjà demandées sont chargées pour la nouvelle langue.
    this.translate.onLangChange.subscribe(({ lang }) => {
      this.wanted.forEach((chunk) => this.load(chunk, lang).subscribe());
    });
  }

  /** Charge (une fois par langue) les parties demandées pour la langue courante. */
  ensure(chunks: TranslationChunk[]): Observable<void> {
    chunks.forEach((c) => this.wanted.add(c));
    const lang = this.translate.currentLang || this.translate.defaultLang || 'fr';
    if (!chunks.length) return of(undefined);
    return forkJoin(chunks.map((chunk) => this.load(chunk, lang))).pipe(map(() => undefined));
  }

  private load(chunk: TranslationChunk, lang: string): Observable<void> {
    const key = `${lang}:${chunk}`;
    let pending = this.loaded.get(key);
    if (!pending) {
      pending = this.http.get<Record<string, unknown>>(`./assets/i18n/${lang}-${chunk}.json`).pipe(
        map((data) => {
          // Fusion dans les traductions de cette langue (sans écraser la base).
          this.translate.setTranslation(lang, data, true);
        }),
        catchError(() => {
          this.loaded.delete(key);
          return of(undefined);
        }),
        shareReplay(1),
      );
      this.loaded.set(key, pending);
    }
    return pending;
  }
}

/**
 * Résolveur de route : `data: { translationChunks: ['admin'] }`. La page
 * s'affiche une fois ses textes chargés (quelques dizaines de Ko).
 */
export const translationChunksResolver: ResolveFn<void> = (route: ActivatedRouteSnapshot) =>
  inject(TranslationChunksService).ensure((route.data?.['translationChunks'] ?? []) as TranslationChunk[]);
