import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction } from 'src/app/shared/store/premium-access';
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

  // La confirmation est gérée automatiquement par le webhook backend.
  // Ici on vérifie simplement que l'accès est bien actif.
  verifyAccess(): void {
    this.loading = true;
    this.error = null;

    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const userId = profile?._id || this.anonymousUserService.getVisitorId();

    // Utilise l'endpoint global /check/:userId (retourne hasAccess + activeOwnerIds)
    this.premiumAccessService.checkAnyActiveAccess(userId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data.hasAccess) {
          this.accessConfirmed = true;
          // Réinitialiser le store pour forcer un rechargement propre
          this.store.dispatch(new PremiumAccessAction.Reset());
        } else {
          setTimeout(() => this.verifyAccess(), 3000);
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de vérifier votre accès. Veuillez réessayer.';
      }
    });
  }

  viewOwnerInfo(): void {
    const lang = window.location.pathname.split('/')[1] || 'fr';
    this.router.navigate([`/${lang}/search`]);
  }

  backToSearch(): void {
    const lang = window.location.pathname.split('/')[1] || 'fr';
    this.router.navigate([`/${lang}/search`]);
  }

  getExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    return expiryDate;
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
