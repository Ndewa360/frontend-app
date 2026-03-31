import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';

@Component({
  selector: 'app-premium-success',
  templateUrl: './premium-success.component.html',
  styleUrls: ['./premium-success.component.scss']
})
export class PremiumSuccessComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  accessConfirmed = false;
  sessionId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private premiumAccessService: PremiumAccessService
  ) {}

  ngOnInit(): void {
    // Récupérer le session_id depuis l'URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.sessionId = params['session_id'];
        if (this.sessionId) {
          this.confirmAccess();
        } else {
          this.error = 'Session de paiement non trouvée';
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Confirmer l'accès premium
  confirmAccess(): void {
    if (!this.sessionId) {
      this.error = 'Session de paiement manquante';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Confirmer le paiement avec le backend
    this.store.dispatch(new PremiumAccessAction.ConfirmAccess(this.sessionId));

    // S'abonner aux changements pour détecter la confirmation
    this.store.select(PremiumAccessState.hasActiveAccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => {
        if (hasAccess) {
          this.loading = false;
          this.accessConfirmed = true;
        }
      });

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.loading = false;
          this.error = error;
        }
      });
  }

  // Voir les informations du propriétaire
  viewOwnerInfo(): void {
    // Rediriger vers la page de recherche avec un paramètre pour ouvrir le modal
    this.router.navigate(['/search'], { 
      queryParams: { 
        premium: 'true',
        action: 'view-owner-info'
      } 
    });
  }

  // Retour à la recherche
  backToSearch(): void {
    this.router.navigate(['/search']);
  }

  // Obtenir la date d'expiration
  getExpiryDate(): Date {
    // 3 jours à partir de maintenant
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    return expiryDate;
  }

  // Formater le montant
  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
