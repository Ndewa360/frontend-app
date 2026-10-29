import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * Charge à la demande une feuille de style produite par le build avec
 * `"inject": false` (voir angular.json). Évite d'imposer aux pages publiques
 * le CSS des espaces connectés (AG Grid, design system admin).
 */
@Injectable({ providedIn: 'root' })
export class LazyStyleService {
  private readonly loaded = new Set<string>();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  load(bundleName: string): void {
    if (!isPlatformBrowser(this.platformId) || this.loaded.has(bundleName)) return;
    this.loaded.add(bundleName);
    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${bundleName}.css`;
    link.dataset['lazyStyle'] = bundleName;
    this.document.head.appendChild(link);
  }
}
