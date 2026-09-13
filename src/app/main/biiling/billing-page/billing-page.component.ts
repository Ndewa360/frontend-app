import { trackByFn } from '../../../shared/utils/track-by.util';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SouscriptionModel, SouscriptionState, SouscriptionAction, SouscriptionPeriodAction } from 'src/app/shared/store';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from 'src/app/shared/store/subscription-limit';
import { SubscriptionPaymentState, SubscriptionPaymentAction, PaymentHistory, UnpaidInvoice } from 'src/app/shared/store/subscription-payment';
import { IbmIconComponent } from '../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { SubscriptionStatusWidgetComponent } from '../../../shared/components/subscription-status-widget/subscription-status-widget.component';
import { YoupezAlertComponent } from '../../../../@youpez/components/alert/alert.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { AppLogoComponent } from '../../../../@youpez/components/app-logo/app-logo.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { AppLoaderComponent } from '../../../../@youpez/components/app-loader/app-loader.component';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

interface MenuSection {
  name: string;
  children: MenuChild[];
}

interface MenuChild {
  name: string;
  path?: string;
  selected?: boolean;
}

@Component({
  selector: 'billing-page',
  templateUrl: './billing-page.component.html',
  styleUrls: ['./billing-page.component.css'],
  standalone: true,
  imports: [
    NgIf,
    FlexModule,
    AppLoaderComponent,
    NgScrollbar,
    AppLogoComponent,
    ExtendedModule,
    NgFor,
    RouterLink,
    RouterLinkActive,
    YoupezAlertComponent,
    SubscriptionStatusWidgetComponent,
    IbmIconComponent,
    RouterOutlet,
    AsyncPipe,
    TranslatePipe
  ]
})
export class BillingPageComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;

  @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>;
  @Select(SouscriptionState.isEndLoadingData) hasLoading$:Observable<boolean>;

  // Nouveaux selectors pour le système de souscription
  @Select(SubscriptionLimitState.selectSubscriptionStatus) subscriptionStatus$: Observable<SubscriptionStatus | null>;
  @Select(SubscriptionPaymentState.selectPaymentHistory) paymentHistory$: Observable<PaymentHistory | null>;
  @Select(SubscriptionPaymentState.selectUnpaidInvoices) unpaidInvoices$: Observable<UnpaidInvoice[]>;
  @Select(SubscriptionPaymentState.selectTotalUnpaidAmount) totalUnpaidAmount$: Observable<number>;
  public sections: MenuSection[] = [];

  public opened: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private store: Store, private translate: TranslateService) {
  }

  ngOnInit(): void {
    // Initialiser le menu dès que les traductions sont prêtes
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.initializeMenu());

    // Premier chargement — attendre que les traductions soient prêtes
    this.translate.get('BILLING.MENU.BILLING_PAYMENT').subscribe(() => {
      this.initializeMenu();
    });

    // Charger toutes les donnees necessaires aux 3 sous-pages
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
    this.store.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SouscriptionAction.FetchSubscriptionHistory());
    this.store.dispatch(new SouscriptionPeriodAction.FetchCurrentPeriodWithDetails());
  }

  private initializeMenu(): void {
    this.sections = [
      {
        name: this.translate.instant('BILLING.MENU.BILLING_PAYMENT'),
        children: [
          {
            name: this.translate.instant('BILLING.MENU.DASHBOARD'),
            path: 'dashboard',
            selected: true
          },
          {
            name: this.translate.instant('BILLING.MENU.INVOICES'),
            path: 'facture'
          },
          {
            name: this.translate.instant('BILLING.MENU.SUBSCRIPTIONS'),
            path: 'plan-list'
          }
        ]
      }
      // {
      //   name: this.translate.instant('BILLING.MENU.HISTORY_PAYMENTS'),
      //   children: [
      //     {
      //       name: this.translate.instant('BILLING.MENU.TRANSACTION_HISTORY'),
      //       path: undefined // Pas encore implémenté
      //     },
      //     {
      //       name: this.translate.instant('BILLING.MENU.PAYMENT_METHODS'),
      //       path: undefined // Pas encore implémenté
      //     }
      //   ]
      // },
    ];
  }

  onToggle() {
    this.opened = !this.opened;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
