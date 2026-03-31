import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { PremiumAccessState, PremiumAccessAction, OwnerInfoModel } from 'src/app/shared/store/premium-access';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { PremiumAccessService } from 'src/app/shared/services/premium-access/premium-access.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { PaymentSessionService } from 'src/app/shared/services/payment-session.service';

@Component({
  selector: 'app-premium-access-modal',
  templateUrl: './premium-access-modal.component.html',
  styleUrls: ['./premium-access-modal.component.scss']
})
export class PremiumAccessModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() ownerId = '';
  @Output() close = new EventEmitter<void>();
  @Output() accessGranted = new EventEmitter<void>();

  // Identité résolue
  effectiveUserId = '';
  effectiveUserEmail = '';
  isAnonymous = false;

  // État
  loading = false;
  error: string | null = null;
  hasActiveAccess = false;
  ownerInfo: OwnerInfoModel | null = null;
  premiumPrice = 500;

  // Étapes : 'checking' | 'offer' | 'owner_info'
  step: 'checking' | 'offer' | 'owner_info' = 'checking';

  private lang = 'fr';
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router,
    private premiumAccessService: PremiumAccessService,
    private anonymousUserService: AnonymousUserService,
    private paymentSessionService: PaymentSessionService,
    private cdr: ChangeDetectorRef,
    @Optional() private dialogRef: MatDialogRef<any>
  ) {}

  ngOnInit(): void {
    // Extraire le lang depuis l'URL courante (ex: /fr/search/...)
    const urlParts = window.location.pathname.split('/');
    this.lang = urlParts[1] || 'fr';
    this.resolveUserIdentity();
    this.subscribeToPremiumStore();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Résolution identité ───────────────────────────────────────────────────

  resolveUserIdentity(): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);

    if (profile?._id) {
      this.effectiveUserId = profile._id;
      this.effectiveUserEmail = profile.email || '';
      this.isAnonymous = false;
    } else {
      this.effectiveUserId = this.anonymousUserService.getVisitorId();
      this.effectiveUserEmail = '';
      this.isAnonymous = true;
    }

    // Vérifier d'abord en local (0 appel réseau)
    if (this.anonymousUserService.hasLocalActiveAccess()) {
      this.hasActiveAccess = true;
      this.step = 'owner_info';
      this.loadOwnerInfo();
      return;
    }

    // Vérifier côté backend
    this.step = 'checking';
    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(this.effectiveUserId));
  }

  private subscribeToPremiumStore(): void {
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        if (!loading && this.step === 'checking' && !this.hasActiveAccess) {
          this.step = 'offer';
          this.cdr.detectChanges();
        }
      });

    this.store.select(PremiumAccessState.error)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        this.cdr.detectChanges();
      });

    this.store.select(PremiumAccessState.hasActiveAccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasAccess => {
        this.hasActiveAccess = hasAccess;
        if (hasAccess && this.step !== 'owner_info') {
          this.step = 'owner_info';
          this.loadOwnerInfo();
        } else if (!hasAccess && this.step === 'checking') {
          this.step = 'offer';
        }
        this.cdr.detectChanges();
      });

    this.store.select(PremiumAccessState.ownerInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe(ownerInfo => {
        if (ownerInfo) {
          this.ownerInfo = ownerInfo;
          this.step = 'owner_info';
          this.accessGranted.emit();
          this.cdr.detectChanges();
        }
      });
  }

  // ─── Chargement infos propriétaire ────────────────────────────────────────

  loadOwnerInfo(): void {
    if (!this.ownerId || !this.effectiveUserId) return;
    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(this.effectiveUserId, this.ownerId));
  }

  // ─── Redirection vers la page de paiement centrale ────────────────────────

  goToPayment(): void {
    const email = this.effectiveUserEmail || `${this.effectiveUserId}@visitor.ndewa360.com`;
    const currentPath = window.location.pathname + window.location.search;

    this.loading = true;
    this.error = null;

    this.paymentSessionService.createSessionWithFallback(this.lang, {
      context: 'premium_access',
      amount: this.premiumPrice,
      amountEditable: false,
      currency: 'XAF',
      description: 'Accès Premium — Informations propriétaires (3 jours)',
      userId: this.effectiveUserId,
      userEmail: email,
      metadata: {
        ownerId: this.ownerId,
        isAnonymous: this.isAnonymous,
        visitorId: this.isAnonymous ? this.effectiveUserId : null,
        lang: this.lang
      },
      successRedirectPath: `${currentPath}${currentPath.includes('?') ? '&' : '?'}premium=success&visitorId=${this.effectiveUserId}`,
      cancelRedirectPath: currentPath
    }).subscribe({
      next: (res) => {
        this.loading = false;
        // Fermer le modal premium
        this.close.emit();
        // Fermer aussi le dialog Material parent (UnitDetailDialog) s'il existe
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        // Naviguer vers la page de paiement
        this.router.navigate([`/${this.lang}/payment/${res.data.token}`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible de créer la session de paiement.';
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Fermeture ────────────────────────────────────────────────────────────

  closeModal(): void {
    this.close.emit();
  }

  // ─── Utilitaires template ─────────────────────────────────────────────────

  getRemainingDaysText(): string {
    if (this.ownerInfo?.access) {
      const d = this.ownerInfo.access.remainingDays;
      if (d <= 0) return 'Accès expiré';
      return d === 1 ? '1 jour restant' : `${d} jours restants`;
    }
    const d = this.anonymousUserService.getRemainingDays();
    if (d <= 0) return '';
    return d === 1 ? '1 jour restant' : `${d} jours restants`;
  }

  getWhatsAppLink(): string {
    if (!this.ownerInfo?.owner.whatsapp) return '#';
    const phone = this.ownerInfo.owner.whatsapp.replace(/\s+/g, '');
    const message = encodeURIComponent('Bonjour, je suis intéressé par votre propriété sur Ndewa360°.');
    return `https://wa.me/${phone}?text=${message}`;
  }

  callOwner(): void {
    if (this.ownerInfo?.owner.phone) {
      window.location.href = `tel:${this.ownerInfo.owner.phone}`;
    }
  }

  emailOwner(): void {
    if (this.ownerInfo?.owner.email) {
      const subject = encodeURIComponent('Demande d\'information - Ndewa360°');
      const body = encodeURIComponent('Bonjour,\n\nJe suis intéressé par votre propriété sur Ndewa360°.\n\nCordialement');
      window.location.href = `mailto:${this.ownerInfo.owner.email}?subject=${subject}&body=${body}`;
    }
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
