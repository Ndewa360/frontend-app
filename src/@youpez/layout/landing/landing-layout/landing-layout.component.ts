import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { filter, tap } from 'rxjs';
import { NgIf } from '@angular/common';
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
  imports: [LandingHeaderComponent, NgScrollbar, RouterOutlet, LandingFooterComponent, NgIf, RouterLink]
})
export class LandingLayoutComponent implements OnInit, AfterViewInit{

  @ViewChild(NgScrollbar,  { static: true }) scrollable: NgScrollbar;
  cookieBannerVisible = false;

  constructor(
    private router: Router,
    private googleAnalytics: GoogleAnalyticsService
  ) {}

  ngAfterViewInit(): void {
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