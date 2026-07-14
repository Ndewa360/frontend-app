import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { SouscriptionState } from '../store/souscription/souscription.state';
import { LanguagePreservationService } from '../services/language-preservation.service';

const BILLING_PATHS = ['/facturation', '/portefeuille/depot'];

@Injectable({ providedIn: 'root' })
export class SuspendedGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router,
    private languagePreservation: LanguagePreservationService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const subscription = this.store.selectSnapshot(SouscriptionState.selectCurrentSubscription);
    if (!subscription || subscription.accountStatus !== 'suspended') return true;

    // Déjà sur une route autorisée — laisser passer
    const isAllowed = BILLING_PATHS.some(p => state.url.includes(p));
    if (isAllowed) return true;

    const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
    return this.router.parseUrl(`/${lang}/app/facturation/plan/dashboard`);
  }
}
