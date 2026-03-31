import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction } from 'src/app/shared/store/premium-access';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';

@Component({
  selector: 'app-premium-access-button',
  templateUrl: './premium-access-button.component.html',
  styleUrls: ['./premium-access-button.component.scss']
})
export class PremiumAccessButtonComponent implements OnInit, OnDestroy {
  @Input() ownerId = '';

  loading = false;
  error: string | null = null;
  hasActiveAccess = false;
  currentAccess: any = null;
  showModal = false;
  premiumPrice = 500;

  private effectiveUserId = '';
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private premiumAccessService: PremiumAccessService,
    private anonymousUserService: AnonymousUserService
  ) {}

  ngOnInit(): void {
    this.resolveAndCheck();

    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    this.store.select(PremiumAccessState.hasActiveAccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => this.hasActiveAccess = hasAccess);

    this.store.select(PremiumAccessState.currentAccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(access => this.currentAccess = access);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resolveAndCheck(): void {
    // 1. Vérifier d'abord en local (pas d'appel réseau)
    if (this.anonymousUserService.hasLocalActiveAccess()) {
      this.hasActiveAccess = true;
      return;
    }

    // 2. Résoudre l'identité
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    this.effectiveUserId = profile?._id || this.anonymousUserService.getVisitorId();

    // 3. Vérifier côté backend
    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(this.effectiveUserId));
  }

  checkAccess(): void {
    this.resolveAndCheck();
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    setTimeout(() => this.resolveAndCheck(), 500);
  }

  getRemainingDaysText(): string {
    if (this.currentAccess?.expiryDate) {
      const d = this.premiumAccessService.calculateRemainingDays(this.currentAccess.expiryDate);
      if (d <= 0) return 'Accès expiré';
      return d === 1 ? '1 jour restant' : `${d} jours restants`;
    }
    const d = this.anonymousUserService.getRemainingDays();
    if (d <= 0) return '';
    return d === 1 ? '1 jour restant' : `${d} jours restants`;
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
