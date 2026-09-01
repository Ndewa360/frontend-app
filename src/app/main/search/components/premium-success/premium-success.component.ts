import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { UserProfileState } from 'src/app/shared/store/user-profile';

@Component({
  selector: 'app-premium-success',
  templateUrl: './premium-success.component.html',
  styleUrls: ['./premium-success.component.scss']
})
export class PremiumSuccessComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  accessConfirmed = false;

  private retryCount = 0;
  private readonly maxRetries = 5;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private premiumAccessService: PremiumAccessService,
    private anonymousUserService: AnonymousUserService,
  ) {}

  ngOnInit(): void {
    this.verifyAccess();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyAccess(): void {
    this.loading = true;
    this.error = null;

    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const params = this.route.snapshot.queryParams;
    const userId = profile?._id || params['visitorId'] || this.anonymousUserService.getVisitorId();

    this.premiumAccessService.checkAnyActiveAccess(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.data.hasAccess) {
            this.accessConfirmed = true;
            // NE PAS dispatcher Reset() ici — le store sera mis à jour
            // par handlePremiumReturn dans UnitDetailDialogComponent
          } else if (this.retryCount < this.maxRetries) {
            // Le webhook backend n'a peut-être pas encore traité le paiement
            this.retryCount++;
            setTimeout(() => this.verifyAccess(), 3000);
          } else {
            this.error = 'Accès non confirmé après plusieurs tentatives. Contactez le support.';
          }
        },
        error: () => {
          this.loading = false;
          this.error = 'Impossible de vérifier votre accès. Veuillez réessayer.';
        }
      });
  }

  /**
   * Redirige vers l'unité qui était ouverte avant le paiement.
   * Tous les params nécessaires (unit, ownerId, visitorId) sont dans l'URL courante.
   */
  viewOwnerInfo(): void {
    const lang = window.location.pathname.split('/')[1] || 'fr';
    const params = this.route.snapshot.queryParams;

    const queryParams: Record<string, string> = {};
    if (params['unit']) queryParams['unit'] = params['unit'];
    if (params['ownerId']) {
      queryParams['premium'] = 'success';
      queryParams['ownerId'] = params['ownerId'];
    }
    if (params['visitorId']) queryParams['visitorId'] = params['visitorId'];

    this.router.navigate([`/${lang}/search/index`], { queryParams });
  }

  backToSearch(): void {
    const lang = window.location.pathname.split('/')[1] || 'fr';
    this.router.navigate([`/${lang}/search/index`]);
  }

  getExpiryDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
