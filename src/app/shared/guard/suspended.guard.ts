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
    // Compte suspendu pour impayé : lecture seule. Toutes les pages restent
    // consultables (biens, unités, documents) ; les modifications sont
    // refusées par le serveur et un bandeau invite à régulariser. L'ancienne
    // redirection systématique vers la facturation bloquait toute consultation.
    return true;
  }
}
