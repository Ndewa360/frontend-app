import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';

@Component({
  selector: 'app-premium-access-button',
  templateUrl: './premium-access-button.component.html',
  styleUrls: ['./premium-access-button.component.scss']
})
export class PremiumAccessButtonComponent implements OnInit, OnDestroy {
  @Input() ownerId = '';
  @Input() userId = '';
  @Input() userEmail = '';

  loading = false;
  error: string | null = null;
  hasActiveAccess = false;
  currentAccess: any = null;
  showModal = false;
  premiumPrice = 500; // 500 FCFA pour forfait global

  // ✅ TEMPORAIRE: Variable pour simuler l'accès premium (à désactiver plus tard)
  private temporaryFreeAccess = true;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private premiumAccessService: PremiumAccessService
  ) {}

  ngOnInit(): void {
    this.checkAccess();

    // S'abonner aux changements du store NGXS
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

  // Vérifier l'accès actif
  checkAccess(): void {
    // ✅ TEMPORAIRE: Accès libre activé
    if (this.temporaryFreeAccess) {
      this.hasActiveAccess = true;
      this.currentAccess = {
        id: 'temp-access-id',
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        remainingDays: 3,
        accessCount: 1,
        accessedOwnersCount: 1
      };
      console.log('✅ Accès premium temporaire activé dans premium-access-button');
      return;
    }

    if (!this.userId) {
      this.error = 'Informations utilisateur manquantes';
      return;
    }

    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(this.userId));
  }

  // Ouvrir le modal
  openModal(): void {
    this.showModal = true;
  }

  // Fermer le modal
  closeModal(): void {
    this.showModal = false;
    // Revérifier l'accès après fermeture du modal (au cas où un achat aurait été effectué)
    setTimeout(() => {
      this.checkAccess();
    }, 1000);
  }

  // Obtenir le texte des jours restants
  getRemainingDaysText(): string {
    if (!this.currentAccess?.expiryDate) return '';
    
    const remainingDays = this.premiumAccessService.calculateRemainingDays(this.currentAccess.expiryDate);
    if (remainingDays <= 0) {
      return 'Accès expiré';
    } else if (remainingDays === 1) {
      return '1 jour restant';
    } else {
      return `${remainingDays} jours restants`;
    }
  }

  // Formater le montant
  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
