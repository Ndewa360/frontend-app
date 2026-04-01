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

    // Résoudre l'identité
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const userId = profile?._id || this.anonymousUserService.getVisitorId();

    // Vérifier côté backend que l'accès est bien ACTIVE
    this.premiumAccessService.checkActiveAccess(userId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data.hasAccess) {
          this.accessConfirmed = true;
          // Sauvegarder localement pour les visiteurs anonymes
          if (!profile?._id && res.data.access?.expiryDate) {
            this.anonymousUserService.savePremiumAccess({
              accessId: res.data.access.id || 'confirmed',
              transactionId: res.data.access.paymentTransactionRef || 'confirmed',
              expiryDate: res.data.access.expiryDate,
              phone: '',
              paymentMethod: 'card',
              paidAt: new Date().toISOString(),
            });
          }
          // Mettre à jour le store
          this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(userId));
        } else {
          // Accès pas encore actif — réessayer dans 3s (webhook peut être en retard)
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
    expiryDate.setDate(expiryDate.getDate() + 3);
    return expiryDate;
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
