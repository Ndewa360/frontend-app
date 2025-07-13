import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';

@Component({
  selector: 'app-premium-access-modal',
  templateUrl: './premium-access-modal.component.html',
  styleUrls: ['./premium-access-modal.component.scss']
})
export class PremiumAccessModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() ownerId = '';
  @Input() userId = '';
  @Input() userEmail = '';
  @Output() close = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  processing = false;
  hasActiveAccess = false;
  ownerInfo: OwnerInfoModel | null = null;
  premiumPrice = 500; // 500 FCFA pour forfait global

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private premiumAccessService: PremiumAccessService
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.checkAccess();
    }

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

    this.store.select(PremiumAccessState.ownerInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ownerInfo => this.ownerInfo = ownerInfo);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Vérifier l'accès actif
  checkAccess(): void {
    if (!this.userId) {
      this.error = 'Informations utilisateur manquantes';
      return;
    }

    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(this.userId));
  }

  // Charger les informations du propriétaire
  loadOwnerInfo(): void {
    if (!this.ownerId) {
      this.error = 'ID du propriétaire manquant';
      return;
    }

    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(this.userId, this.ownerId));
  }

  // Acheter l'accès premium
  purchasePremiumAccess(): void {
    if (!this.userId || !this.userEmail) {
      this.error = 'Informations manquantes pour effectuer l\'achat';
      return;
    }

    this.processing = true;
    this.error = null;

    const purchaseData = {
      userId: this.userId,
      userEmail: this.userEmail,
      amount: this.premiumPrice,
      successUrl: `${window.location.origin}/search/premium-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/search`,
      metadata: {
        source: 'search_modal',
        timestamp: new Date().toISOString(),
        ownerId: this.ownerId
      }
    };

    this.store.dispatch(new PremiumAccessAction.CreateSession(purchaseData));
  }

  // Fermer le modal
  closeModal(): void {
    this.close.emit();
  }

  // Obtenir le texte des jours restants
  getRemainingDaysText(): string {
    if (!this.ownerInfo?.access) return '';
    
    const remainingDays = this.ownerInfo.access.remainingDays;
    if (remainingDays <= 0) {
      return 'Accès expiré';
    } else if (remainingDays === 1) {
      return '1 jour restant';
    } else {
      return `${remainingDays} jours restants`;
    }
  }

  // Obtenir le lien WhatsApp
  getWhatsAppLink(): string {
    if (!this.ownerInfo?.owner.whatsapp) return '#';
    
    const phone = this.ownerInfo.owner.whatsapp.replace(/\s+/g, '');
    const message = encodeURIComponent('Bonjour, je suis intéressé par votre propriété sur Ndewa360°.');
    return `https://wa.me/${phone}?text=${message}`;
  }

  // Appeler le propriétaire
  callOwner(): void {
    if (this.ownerInfo?.owner.phone) {
      window.location.href = `tel:${this.ownerInfo.owner.phone}`;
    }
  }

  // Envoyer un email au propriétaire
  emailOwner(): void {
    if (this.ownerInfo?.owner.email) {
      const subject = encodeURIComponent('Demande d\'information - Ndewa360°');
      const body = encodeURIComponent('Bonjour,\n\nJe suis intéressé par votre propriété sur Ndewa360°.\n\nCordialement');
      window.location.href = `mailto:${this.ownerInfo.owner.email}?subject=${subject}&body=${body}`;
    }
  }

  // Formater le montant
  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
