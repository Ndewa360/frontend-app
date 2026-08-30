import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Optional,
} from '@angular/core';
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
  styleUrls: ['./premium-access-modal.component.scss'],
})
export class PremiumAccessModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() ownerId = '';
  @Output() close = new EventEmitter<void>();
  @Output() accessGranted = new EventEmitter<void>();

  effectiveUserId = '';
  effectiveUserEmail = '';
  isAnonymous = false;

  loading = false;
  error: string | null = null;
  hasActiveAccess = false;
  ownerInfo: OwnerInfoModel | null = null;
  premiumPrice = 1000;

  // 'checking' | 'offer' | 'owner_info'
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
    @Optional() private dialogRef: MatDialogRef<any>,
  ) {}

  ngOnInit(): void {
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

    if (!this.ownerId) {
      this.step = 'offer';
      return;
    }

    // Vérifier si l'accès pour CET ownerId est déjà en cache
    const checkState = this.store.selectSnapshot(
      PremiumAccessState.checkLoadingFor(this.ownerId),
    );
    const hasAccess = this.store.selectSnapshot(
      PremiumAccessState.hasAccessForOwner(this.ownerId),
    );
    const cachedInfo = this.store.selectSnapshot(
      PremiumAccessState.ownerInfoFor(this.ownerId),
    );

    if (checkState === 'LOADED') {
      this.hasActiveAccess = hasAccess;
      if (hasAccess) {
        this.step = 'owner_info';
        if (cachedInfo) {
          this.ownerInfo = cachedInfo;
        } else {
          this.loadOwnerInfo();
        }
      } else {
        this.step = 'offer';
      }
      return;
    }

    if (checkState === 'LOADING') {
      this.step = 'checking';
      return;
    }

    // Lancer la vérification pour cet ownerId
    this.step = 'checking';
    this.store.dispatch(new PremiumAccessAction.CheckAccessForOwner(
      this.effectiveUserId,
      this.ownerId,
      this.isAnonymous,
    ));
  }

  private subscribeToPremiumStore(): void {
    // Écouter le loading global
    this.store.select(PremiumAccessState.loading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(storeLoading => {
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

    // Écouter l'accès pour CET ownerId précis
    if (this.ownerId) {
      this.store.select(PremiumAccessState.hasAccessForOwner(this.ownerId))
        .pipe(takeUntil(this.destroy$))
        .subscribe(hasAccess => {
          this.hasActiveAccess = hasAccess;
          if (hasAccess && this.step !== 'owner_info') {
            this.step = 'owner_info';
            this.loadOwnerInfo();
          }
          this.cdr.detectChanges();
        });

      this.store.select(PremiumAccessState.ownerInfoFor(this.ownerId))
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
  }

  // ─── Chargement infos propriétaire ────────────────────────────────────────

  loadOwnerInfo(): void {
    if (!this.ownerId || !this.effectiveUserId) return;
    this.store.dispatch(new PremiumAccessAction.GetOwnerInfo(
      this.effectiveUserId,
      this.ownerId,
      this.isAnonymous,
    ));
  }

  // ─── Redirection vers la page de paiement ─────────────────────────────────

  goToPayment(): void {
    if (!this.ownerId) {
      this.error = 'Propriétaire non identifié. Veuillez réessayer.';
      return;
    }

    const email = this.effectiveUserEmail || `${this.effectiveUserId}@visitor.ndewa360.com`;
    const currentPath = window.location.pathname + window.location.search;

    this.loading = true;
    this.error = null;

    const payload = {
      context: 'PREMIUM_ACCESS' as const,
      amount: this.premiumPrice,
      amountEditable: false,
      currency: 'XAF',
      description: `Accès contacts propriétaire — 24 heures`,
      userId: this.effectiveUserId,
      userEmail: email,
      metadata: {
        // ownerId transmis au handler via metadata
        ownerId: this.ownerId,
        isAnonymous: this.isAnonymous,
        visitorId: this.effectiveUserId,
        lang: this.lang,
      },
      successRedirectPath: `${currentPath}${currentPath.includes('?') ? '&' : '?'}premium=success&ownerId=${this.ownerId}&visitorId=${this.effectiveUserId}`,
      cancelRedirectPath: currentPath,
    };

    const request$ = this.isAnonymous
      ? this.paymentSessionService.createSessionPublic(payload)
      : this.paymentSessionService.createSession(payload);

    request$
      .pipe(
        timeout(15000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (res) => {
          this.close.emit();
          if (this.dialogRef) this.dialogRef.close();
          this.router.navigate([`/${this.lang}/payment/${res.data.token}`]);
        },
        error: (err) => {
          this.error = err.error?.message || this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.MISSING_PURCHASE_INFO');
          this.cdr.detectChanges();
        },
      });
  }

  // ─── Fermeture ────────────────────────────────────────────────────────────

  closeModal(): void {
    this.close.emit();
  }

  // ─── Utilitaires template ─────────────────────────────────────────────────

  getRemainingHoursText(): string {
    const info = this.ownerInfo;
    if (!info?.access) return '';
    const h = info.access.remainingHours;
    if (h <= 0) return 'Accès expiré';
    if (h < 2) return 'Moins d\'1 heure restante';
    if (h < 24) return `${h} heures restantes`;
    return '1 jour restant';
  }

  getWhatsAppLink(): string {
    if (!this.ownerInfo?.owner.whatsapp) return '#';
    const phone = this.ownerInfo.owner.whatsapp.replace(/\s+/g, '');
    const message = encodeURIComponent(
      this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.WHATSAPP_MESSAGE'),
    );
    return `https://wa.me/${phone}?text=${message}`;
  }

  callOwner(): void {
    if (this.ownerInfo?.owner.phone) {
      window.location.href = `tel:${this.ownerInfo.owner.phone}`;
    }
  }

  emailOwner(): void {
    if (this.ownerInfo?.owner.email) {
      const subject = encodeURIComponent(
        this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.EMAIL_SUBJECT'),
      );
      const body = encodeURIComponent(
        this.translate.instant('SEARCH_MODULE.PREMIUM_MODAL.EMAIL_BODY'),
      );
      window.location.href = `mailto:${this.ownerInfo.owner.email}?subject=${subject}&body=${body}`;
    }
  }

  formatAmount(amount: number): string {
    return this.premiumAccessService.formatAmount(amount);
  }
}
