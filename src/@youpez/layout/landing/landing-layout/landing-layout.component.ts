import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { filter, tap } from 'rxjs';

const COOKIE_KEY = 'ndewa_cookie_consent';
const GA_ID = 'G-MKEB3L7EXL';

@Component({
  selector: 'app-landing-layout',
  templateUrl: './landing-layout.component.html',
  styleUrls: ['./landing-layout.component.scss']
})
export class LandingLayoutComponent implements OnInit, AfterViewInit{
  
  @ViewChild(NgScrollbar,  { static: true }) scrollable: NgScrollbar;
  cookieBannerVisible = false;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => !!this.scrollable),
      tap((event: NavigationEnd) => this.scrollable.scrollTo({ top: 0, duration: 500 }))
    ).subscribe();
  }

  ngOnInit(): void {
    const consent = localStorage.getItem(COOKIE_KEY);
    this.cookieBannerVisible = !consent;
    if (consent === 'accepted') {
      this.loadGoogleAnalytics();
    }
  }

  acceptCookies(): void {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    this.cookieBannerVisible = false;
    this.loadGoogleAnalytics();
  }

  declineCookies(): void {
    localStorage.setItem(COOKIE_KEY, 'declined');
    this.cookieBannerVisible = false;
    this.removeGoogleAnalytics();
  }

  resetCookieChoice(): void {
    this.cookieBannerVisible = true;
  }

  private loadGoogleAnalytics(): void {
    if (document.getElementById('ga-script')) return;

    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    function gtag(...args: any[]) { w.dataLayer.push(args); }
    w.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: false });

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  private removeGoogleAnalytics(): void {
    const script = document.getElementById('ga-script');
    if (script) script.remove();
    const w = window as any;
    delete w.gtag;
    w.dataLayer = [];
  }
}
