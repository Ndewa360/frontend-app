import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize, timeout } from 'rxjs/operators';
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
  premiumPrice = 1000;

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
    private translate: TranslateService,
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

    // Réutiliser la vérification déjà faite par le composant parent (unit-detail-dialog
    // ou premium-access-button) au lieu de refaire un appel réseau / ré-écraser le
    // chargement global du store à chaque ouverture du modal.
    const state = this.store.selectSnapshot(PremiumAccessState);
    if (state.initLoadingState === 'LOADED') {
      this.hasActiveAccess = state.hasActiveAccess;
      if (this.hasActiveAccess) {
        this.step = 'owner_info';
        if (state.ownerInfo) {
          this.ownerInfo = state.ownerInfo;
        } else if (this.ownerId && this.effectiveUserId) {
          this.loadOwnerInfo();
        }
      } else {
        this.step = 'offer';
      }
      return;
    }

    if (state.initLoadingState === 'LOADING') {
      // Vérification déjà en cours → attendre (rester en 'checking');
      // le subscribe au store chargera l'étape suivante quand elle se terminera.
      this.step = 'checking';
      return;
    }

    // Aucune vérification faite → la lancer
    this.step = 'checking';
    this.store.dispatch(new PremiumAccessAction.CheckActiveAccess(this.effectiveUserId));
  }

  private subscribeToPremiumStore(): void {
    // NOTE : this.loading est délibérément piloté LOCALEMENT (goToPayment / finalize),
    // PAS par le store. Le store PremiumAccessState.loading est global et partagé avec
    // d'autres composants (unit-detail-dialog, premium-access-button…) ; l'utiliser pour
    // désactiver le CTA faisait rester le bouton en "Traitement…" le temps que le store
    // (parfois même après la disparition du modal) redescende, voire indéfiniment.
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(storeLoading => {
        // Le store `loading` ne pilote que la transition "vérification" → "offre".
        // Il ne doit jamais désactiver le bouton d'achat.
        if (this.step === 'checking' && !storeLoading && !this.hasActiveAccess) {
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
        // Ne passer à owner_info que si un accès est réellement actif.
        // (Le passage checking → offer est géré par le subscribe `loading` ci-dessus.)
        if (hasAccess && this.step !== 'owner_info') {
          this.step = 'owner_info';
          this.loadOwnerInfo();
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
    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
      this.effectiveUserId,
      this.ownerId,
      this.isAnonymous
    ));
  }

  // ─── Redirection vers la page de paiement centrale ────────────────────────

  goToPayment(): void {
    const email = this.effectiveUserEmail || `${this.effectiveUserId}@visitor.ndewa360.com`;
    const currentPath = window.location.pathname + window.location.search;

    this.loading = true;
    this.error = null;

    // Les visiteurs anonymes n'ont pas de JWT → route publique (create-public).
    // Les utilisateurs connectés → route sécurisée (create, JWT).
    const payload = {
      context: 'PREMIUM_ACCESS' as const,
      amount: this.premiumPrice,
      amountEditable: false,
      currency: 'XAF',
      description: 'Accès Premium — Informations propriétaires (24 heures)',
      userId: this.effectiveUserId,
      userEmail: email,
      metadata: {
        ownerId: this.ownerId,
        isAnonymous: this.isAnonymous,
        visitorId: this.effectiveUserId,
        lang: this.lang
      },
      successRedirectPath: `${currentPath}${currentPath.includes('?') ? '&' : '?'}premium=success&visitorId=${this.effectiveUserId}`,
      cancelRedirectPath: currentPath
    };

    const request$ = this.isAnonymous
      ? this.paymentSessionService.createSessionPublic(payload)
      : this.paymentSessionService.createSession(payload);

    request$
      .pipe(
        // Robustesse du loader : jamais de spinner/bouton bloqué indéfiniment.
        // Timeout si le backend ne répond pas + finalize pour libérer l'état.
        timeout(15000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
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
          this.error = err.error?.message || this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.MISSING_PURCHASE_INFO');
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
    const d = this.ownerInfo?.access
      ? this.ownerInfo.access.remainingDays
      : this.anonymousUserService.getRemainingDays();
    if (d <= 0) return this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.ACCESS_EXPIRED');
    return d === 1
      ? this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.REMAINING_DAYS_SINGULAR')
      : this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.REMAINING_DAYS_PLURAL', { days: d });
  }

  getWhatsAppLink(): string {
    if (!this.ownerInfo?.owner.whatsapp) return '#';
    const phone = this.ownerInfo.owner.whatsapp.replace(/\s+/g, '');
    const message = encodeURIComponent(this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.WHATSAPP_MESSAGE'));
    return `https://wa.me/${phone}?text=${message}`;
  }

  callOwner(): void {
    if (this.ownerInfo?.owner.phone) {
      window.location.href = `tel:${this.ownerInfo.owner.phone}`;
    }
  }

  emailOwner(): void {
    if (this.ownerInfo?.owner.email) {
      const subject = encodeURIComponent(this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.EMAIL_SUBJECT'));
      const body = encodeURIComponent(this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.EMAIL_BODY'));
      window.location.href = `mailto:${this.ownerInfo.owner.email}?subject=${subject}&body=${body}`;
    }
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
