import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { filter, tap } from 'rxjs';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { currentAppLanguage } from 'src/app/shared/services/localization/app-locale';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';
import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import {
  COOKIE_CONSENT_KEY,
  GoogleAnalyticsService
} from 'src/app/shared/services/google-analytics.service';

@Component({
  selector: 'app-landing-layout',
  templateUrl: './landing-layout.component.html',
  styleUrls: ['./landing-layout.component.scss'],
  standalone: true,
  imports: [LandingHeaderComponent, NgScrollbar, RouterOutlet, LandingFooterComponent, NgIf, RouterLink, TranslatePipe]
})
export class LandingLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private headerObserver: ResizeObserver | null = null;

  @ViewChild(NgScrollbar,  { static: true }) scrollable: NgScrollbar;
  cookieBannerVisible = false;

  get lang(): string {
    return currentAppLanguage();
  }

  constructor(
    private router: Router,
    private googleAnalytics: GoogleAnalyticsService,
    private host: ElementRef<HTMLElement>,
    private zone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this.headerObserver?.disconnect();
  }

  /** Hauteur réelle de l'en-tête fixe → décalage du contenu (--landing-header-h). */
  private trackHeaderHeight(): void {
    const header = this.host.nativeElement.querySelector('app-landing-header')?.firstElementChild as HTMLElement | null;
    if (!header) return;
    const apply = () => this.host.nativeElement.style.setProperty('--landing-header-h', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      this.headerObserver = new ResizeObserver(apply);
      this.headerObserver.observe(header);
    });
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') this.trackHeaderHeight();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => !!this.scrollable),
      tap((event: NavigationEnd) => this.scrollable.scrollTo({ top: 0, duration: 500 }))
    ).subscribe();
  }

  ngOnInit(): void {
    let consent: string | null = null;
    try { consent = localStorage.getItem(COOKIE_CONSENT_KEY); } catch {}
    this.cookieBannerVisible = !consent;
    if (consent === 'accepted') {
      this.googleAnalytics.accept();
    }
  }

  acceptCookies(): void {
    this.cookieBannerVisible = false;
    this.googleAnalytics.accept();
  }

  declineCookies(): void {
    this.cookieBannerVisible = false;
    this.googleAnalytics.decline();
  }

  resetCookieChoice(): void {
    this.cookieBannerVisible = true;
  }
}