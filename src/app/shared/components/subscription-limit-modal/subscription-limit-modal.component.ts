import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from '../../store/subscription-limit';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgIf, NgClass, DatePipe } from '@angular/common';
import { IbmIconComponent } from '../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { PricingTiersComponent } from '../pricing-tiers/pricing-tiers.component';
import { SubscriptionLimitService } from '../../services/subscription-limit.service';
import { PricingSummary, PricingTier, formatFcfa, proTierForRent } from '../../pricing/pricing-grid';

export interface SubscriptionLimitModalData {
  type: 'limit_reached' | 'room_limit_reached' | 'account_suspended' | 'upgrade_prompt';
  currentLimit?: number;
  propertyCount?: number;
  suspensionDate?: Date;
  limitType?: 'property' | 'room';
}

@Component({
  selector: 'app-subscription-limit-modal',
  templateUrl: './subscription-limit-modal.component.html',
  styleUrls: ['./subscription-limit-modal.component.scss'],
  standalone: true,
  imports: [IbmIconComponent, NgIf, NgClass, ExtendedModule, DatePipe, TranslatePipe, PricingTiersComponent]
})
export class SubscriptionLimitModalComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  subscriptionStatus: SubscriptionStatus | null = null;
  loading = false;
  upgrading = false;
  pricing: PricingSummary | null = null;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionLimitModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionLimitModalData,
    private store: Store,
    private actions: Actions,
    private translate: TranslateService,
    private router: Router,
    private subscriptionLimitService: SubscriptionLimitService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionStatus();
    this.subscriptionLimitService.getPricing()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => { this.pricing = res?.data ?? null; }, error: () => { this.pricing = null; } });

    this.store.select(SubscriptionLimitState.selectSubscriptionStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => { this.subscriptionStatus = status; });

    this.store.select(SubscriptionLimitState.selectLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => { this.loading = loading; });

    // Fermer le modal apres succes de la reactivation
    this.actions.pipe(
      ofActionSuccessful(SubscriptionLimitAction.ReactivateAccount),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.upgrading = false;
      this.dialogRef.close({ reactivated: true });
    });

    // Gerer les erreurs
    this.actions.pipe(
      ofActionErrored(SubscriptionLimitAction.ReactivateAccount),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.upgrading = false; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubscriptionStatus(): void {
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  /**
   * Le passage au Pro est automatique (2e bien ou 5e logement occupé) :
   * l'utilisateur confirme simplement qu'il a compris avant de continuer.
   */
  confirmProSwitch(): void {
    this.dialogRef.close({ upgraded: true });
  }

  /** Vrai quand l'action en cours fait passer le compte du Gratuit au Pro. */
  get isProSwitch(): boolean {
    return this.data.type === 'limit_reached' || this.data.type === 'room_limit_reached';
  }

  /** Palier Pro estimé après l'action (loyers actuels des logements occupés). */
  get projectedTier(): { tier: PricingTier; price: number | null } {
    return proTierForRent(this.pricing?.totalRent ?? 0);
  }

  get projectedMessage(): string {
    const rent = this.pricing?.totalRent ?? 0;
    const projected = this.projectedTier;
    if (!projected.price) {
      return this.translate.instant('SUBSCRIPTION_MODAL.PRO_SWITCH.PROJECTED_GOLD', { rent: formatFcfa(rent) });
    }
    if (rent === 0) {
      return this.translate.instant('SUBSCRIPTION_MODAL.PRO_SWITCH.PROJECTED_NONE');
    }
    return this.translate.instant('SUBSCRIPTION_MODAL.PRO_SWITCH.PROJECTED', { rent: formatFcfa(rent), price: formatFcfa(projected.price) });
  }

  reactivateAccount(): void {
    this.upgrading = true;
    this.store.dispatch(new SubscriptionLimitAction.ReactivateAccount());
  }

  calculateMonthlyAmount(): void {
    this.store.dispatch(new SubscriptionLimitAction.CalculateMonthlyAmount());
  }

  close(): void {
    this.dialogRef.close();
  }

  get modalTitle(): string {
    switch (this.data.type) {
    case 'limit_reached':
    case 'room_limit_reached':
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.PRO_SWITCH');
    case 'account_suspended':
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.ACCOUNT_SUSPENDED');
    case 'upgrade_prompt':
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.UPGRADE_TO_PREMIUM');
    default:
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.SUBSCRIPTION_MANAGEMENT');
    }
  }

  get modalMessage(): string {
    switch (this.data.type) {
    case 'limit_reached':
    case 'room_limit_reached':
      return this.data.limitType === 'room'
        ? this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ROOM_LIMIT_MESSAGE')
        : this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.PROPERTY_LIMIT_MESSAGE');
    case 'account_suspended':
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ACCOUNT_SUSPENDED_MESSAGE');
    case 'upgrade_prompt':
      return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.UPGRADE_PROMPT_MESSAGE');
    default:
      return '';
    }
  }

  get showUpgradeButton(): boolean {
    return this.isProSwitch;
  }

  /** Grille tarifaire affichée pour toute question de forfait (hors suspension). */
  get showPricingGrid(): boolean {
    return this.data.type !== 'account_suspended';
  }

  get showReactivateButton(): boolean {
    return this.data.type === 'account_suspended';
  }

  get showCalculateButton(): boolean {
    return this.subscriptionStatus?.plan === 'premium';
  }

  getAccountStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
    case 'active':    return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.ACTIVE');
    case 'suspended': return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.SUSPENDED');
    case 'disabled':  return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.DISABLED');
    default:          return status;
    }
  }

  get progressPercentage(): number {
    if (!this.subscriptionStatus || this.subscriptionStatus.plan === 'premium') return 100;
    return Math.min(
      (this.subscriptionStatus.propertyCount / this.subscriptionStatus.propertyLimit) * 100,
      100
    );
  }

  get progressColor(): string {
    const p = this.progressPercentage;
    if (p >= 90) return '#dc3545';
    if (p >= 70) return '#ffc107';
    return '#28a745';
  }
}
