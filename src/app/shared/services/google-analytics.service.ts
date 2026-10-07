import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Google Analytics 4 (gtag.js), identifiant G-MKEB3L7EXL.
 *
 * Chargement et collecte soumis au consentement cookies conservé dans
 * localStorage sous la clé `ndewa_cookie_consent` (valeur `accepted`).
 * Le script n'est jamais injecté côté serveur (SSR) : tout est gardé par
 * `isPlatformBrowser`.
 */
export const GA_ID = 'G-MKEB3L7EXL';
export const COOKIE_CONSENT_KEY = 'ndewa_cookie_consent';

@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private initialized = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  /** Consentement stocké : `true` seulement si l'utilisateur a accepté. */
  get consentAccepted(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
    } catch {
      return false;
    }
  }

  /**
   * Applique le consentement au démarrage de l'app : charge GA si accepté,
   * sinon garantit qu'il ne tourne pas.
   */
  initFromConsent(): void {
    if (this.consentAccepted) {
      this.ensureLoaded();
    } else {
      this.remove();
    }
  }

  /** Recenser une page vue (appelé à chaque NavigationEnd). No-op sans consentement. */
  trackPageView(path: string): void {
    if (!isPlatformBrowser(this.platformId) || !this.consentAccepted) return;
    this.ensureLoaded();
    (window as any).gtag?.('config', GA_ID, { page_path: path });
  }

  /** L'utilisateur a accepté les cookies. */
  accept(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    this.ensureLoaded();
  }

  /** L'utilisateur a refusé les cookies. */
  decline(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    this.remove();
  }

  private ensureLoaded(sendInitialPageView = false): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window as any;
    function gtag(...args: any[]) {
      w.dataLayer.push(args);
    }
    w.dataLayer = w.dataLayer || [];
    if (!w.gtag) {
      w.gtag = gtag;
    }
    w.gtag('js', new Date());
    w.gtag('config', GA_ID, { send_page_view: false });
    if (sendInitialPageView && location.pathname) {
      w.gtag('config', GA_ID, { page_path: location.pathname + location.search });
    }

    if (document.getElementById('ga-script')) {
      this.initialized = true;
      return;
    }
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
    this.initialized = true;
  }

  private remove(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const script = document.getElementById('ga-script');
    if (script) script.remove();
    const w = window as any;
    delete w.gtag;
    w.dataLayer = [];
    this.initialized = false;
  }
}