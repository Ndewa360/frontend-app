import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ContentReadyService {
  private contentReadySubject = new BehaviorSubject<boolean>(false);
  public contentReady$ = this.contentReadySubject.asObservable();

  private checkInterval: any;
  private maxChecks = 50;
  private currentChecks = 0;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => this.reset());
  }

  public startContentCheck(): void {
    this.currentChecks = 0;
    this.contentReadySubject.next(false);
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.check(), 100);
  }

  private check(): void {
    this.currentChecks++;
    const appRoot = document.querySelector('app-root');
    const routerOutlet = document.querySelector('router-outlet');
    const isReady =
      (appRoot && appRoot.children.length > 1) ||
      (routerOutlet && !!routerOutlet.nextElementSibling) ||
      document.querySelectorAll('.layout-container, .main-content').length > 0;

    if (isReady || this.currentChecks >= this.maxChecks) {
      this.setReady(true);
    }
  }

  private setReady(ready: boolean): void {
    if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
    this.contentReadySubject.next(ready);
  }

  private reset(): void {
    this.currentChecks = 0;
    this.contentReadySubject.next(false);
    if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
  }

  public forceContentReady(): void { this.setReady(true); }
  public isContentReady(): boolean { return this.contentReadySubject.value; }

  public waitForContent(): Promise<boolean> {
    return new Promise(resolve => {
      if (this.isContentReady()) { resolve(true); return; }
      const sub = this.contentReady$.subscribe(ready => {
        if (ready) { sub.unsubscribe(); resolve(true); }
      });
      setTimeout(() => { sub.unsubscribe(); resolve(true); }, 5000);
    });
  }
}
