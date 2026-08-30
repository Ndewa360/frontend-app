import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./premium-access-button.component.scss'],
})
export class PremiumAccessButtonComponent implements OnInit, OnDestroy {
  @Input() ownerId = '';

  loading = false;
  error: string | null = null;
  hasActiveAccess = false;
  expiryDate: string | null = null;
  showModal = false;
  premiumPrice = 1000;

  private effectiveUserId = '';
  private isAnonymous = false;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private premiumAccessService: PremiumAccessService,
    private anonymousUserService: AnonymousUserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.resolveAndCheck();

    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        this.cdr.markForCheck();
      });

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        this.cdr.markForCheck();
      });

    if (this.ownerId) {
      this.store.select(PremiumAccessState.hasAccessForOwner(this.ownerId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(hasAccess => {
          this.hasActiveAccess = hasAccess;
          this.cdr.markForCheck();
        });

      this.store.select(PremiumAccessState.ownerInfoFor(this.ownerId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(info => {
          this.expiryDate = info?.access?.expiryDate ?? null;
          this.cdr.markForCheck();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resolveAndCheck(): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    this.effectiveUserId = profile?._id || this.anonymousUserService.getVisitorId();
    this.isAnonymous = !profile?._id;

    if (!this.ownerId) return;

    const checkState = this.store.selectSnapshot(
      PremiumAccessState.checkLoadingFor(this.ownerId),
    );
    if (checkState === 'NO_LOADED') {
      this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
        this.effectiveUserId, this.ownerId, this.isAnonymous,
      ));
    }
  }

  checkAccess(): void {
    this.resolveAndCheck();
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    // Forcer un rechargement après fermeture (cas paiement effectué)
    if (this.ownerId) {
      this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
        this.effectiveUserId, this.ownerId, this.isAnonymous,
      ));
    }
  }

  getRemainingHoursText(): string {
    if (!this.expiryDate) return '';
    const h = this.premiumAccessService.calculateRemainingHours(this.expiryDate);
    if (h <= 0) return 'Accès expiré';
    if (h < 2) return 'Moins d\'1 heure restante';
    if (h < 24) return `${h} heures restantes`;
    return '1 jour restant';
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
