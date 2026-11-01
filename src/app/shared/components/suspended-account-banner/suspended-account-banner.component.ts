import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { map } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { SouscriptionState } from '../../store/souscription/souscription.state';
import { SouscriptionAction } from '../../store/souscription/souscription.actions';
import { currentAppLanguage } from '../../services/localization/app-locale';

/**
 * Bandeau permanent d'un compte suspendu pour impayé : le compte est en
 * lecture seule (consultation et téléchargements possibles, aucune
 * modification) jusqu'au règlement des factures.
 */
@Component({
  selector: 'app-suspended-account-banner',
  standalone: true,
  imports: [NgIf, AsyncPipe, RouterLink, TranslatePipe],
  template: `
    <div *ngIf="suspended$ | async" class="sab" role="status">
      <i class="fas fa-lock sab__icon" aria-hidden="true"></i>
      <span class="sab__text">{{ 'SUSPENDED_BANNER.MESSAGE' | translate }}</span>
      <a class="sab__action" [routerLink]="['/', lang, 'app', 'facturation', 'plan', 'dashboard']">
        {{ 'SUSPENDED_BANNER.ACTION' | translate }}
      </a>
    </div>
  `,
  styles: [`
    .sab { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 16px;
      background: #fef3c7; color: #78350f; border-bottom: 1px solid #fcd34d; font-size: .875rem; }
    .sab__icon { flex-shrink: 0; }
    .sab__text { flex: 1 1 260px; }
    .sab__action { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 6px;
      background: #b45309; color: #fff; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .sab__action:hover { background: #92400e; }
  `],
})
export class SuspendedAccountBannerComponent implements OnInit {
  readonly suspended$ = this.store
    .select(SouscriptionState.selectCurrentSubscription)
    .pipe(map((subscription: any) => subscription?.accountStatus === 'suspended'));

  get lang(): string {
    return currentAppLanguage();
  }

  constructor(private store: Store) {}

  ngOnInit(): void {
    // Statut d'abonnement chargé dès l'entrée dans l'application (il ne
    // l'était qu'à l'ouverture de la facturation).
    if (!this.store.selectSnapshot(SouscriptionState.selectCurrentSubscription)) {
      this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    }
  }
}
