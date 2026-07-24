import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { filter, tap } from 'rxjs';

const COOKIE_KEY = 'ndewa_cookie_consent';

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
    this.cookieBannerVisible = !localStorage.getItem(COOKIE_KEY);
  }

  acceptCookies(): void {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    this.cookieBannerVisible = false;
  }

  declineCookies(): void {
    localStorage.setItem(COOKIE_KEY, 'declined');
    this.cookieBannerVisible = false;
  }
}
