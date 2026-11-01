import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { SouscriptionState } from '../../store/souscription/souscription.state';
import { SouscriptionAction } from '../../store/souscription/souscription.actions';
import { currentAppLanguage } from '../../services/localization/app-locale';
import { SubscriptionPaymentService } from '../../services/subscription-payment.service';

/**
 * Bandeau permanent d'un compte suspendu pour impayé : le compte est en
 * lecture seule (consultation et téléchargements possibles, aucune
 * modification) jusqu'au règlement des factures impayées, dont le nombre et
 * le total sont affichés. Un compte bloqué par l'administration n'arrive
 * jamais ici : il est déconnecté.
 */
@Component({
  selector: 'app-suspended-account-banner',
  standalone: true,
  imports: [NgIf, AsyncPipe, DecimalPipe, RouterLink, TranslatePipe],
  template: `
    <div *ngIf="suspended$ | async" class="sab" role="status">
      <i class="fas fa-lock sab__icon" aria-hidden="true"></i>
      <span class="sab__text">
        {{ 'SUSPENDED_BANNER.MESSAGE' | translate }}
        <strong *ngIf="unpaid$ | async as unpaid" class="sab__due">
          {{ 'SUSPENDED_BANNER.UNPAID' | translate: { count: unpaid.count, amount: (unpaid.totalAmount | number:'1.0-0':'fr') } }}
        </strong>
      </span>
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
    .sab__due { display: block; margin-top: 2px; }
    .sab__action { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 6px;
      background: #b45309; color: #fff; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .sab__action:hover { background: #92400e; }
  `],
})
export class SuspendedAccountBannerComponent implements OnInit {
  readonly suspended$ = this.store
    .select(SouscriptionState.selectCurrentSubscription)
    .pipe(map((subscription: any) => subscription?.accountStatus === 'suspended'));

  /** Factures impayées (nombre et total), chargées quand le compte est suspendu. */
  readonly unpaid$: Observable<{ count: number; totalAmount: number } | null> = this.suspended$.pipe(
    distinctUntilChanged(),
    switchMap((suspended) => !suspended ? of(null) : this.payments.getUnpaidInvoices().pipe(
      map((res) => (res?.data?.count ? { count: res.data.count, totalAmount: res.data.totalAmount } : null)),
      catchError(() => of(null)),
    )),
  );

  get lang(): string {
    return currentAppLanguage();
  }

  constructor(private store: Store, private payments: SubscriptionPaymentService) {}

  ngOnInit(): void {
    // Statut d'abonnement chargé dès l'entrée dans l'application (il ne
    // l'était qu'à l'ouverture de la facturation).
    if (!this.store.selectSnapshot(SouscriptionState.selectCurrentSubscription)) {
      this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    }
  }
}
