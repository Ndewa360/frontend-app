import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { PaymentSessionService } from 'src/app/shared/services/payment-session.service';

const MIN_AMOUNT = 500;

@Component({
  selector: 'app-deposit-modal',
  templateUrl: './deposit-modal.component.html',
  styleUrls: ['./deposit-modal.component.scss'],
})
export class DepositModalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<DepositModalComponent>,
    private fb: FormBuilder,
    private store: Store,
    private paymentSessionService: PaymentSessionService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(MIN_AMOUNT)]],
    });
  }

  ngOnInit(): void {}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get minAmount(): number { return MIN_AMOUNT; }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.error = null;

    const { amount } = this.form.value;
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const lang = window.location.pathname.split('/')[1] || 'fr';
    const returnPath = window.location.pathname;

    this.paymentSessionService.createSession({
      context: 'WALLET_DEPOSIT',
      amount,
      amountEditable: false,
      currency: 'XAF',
      description: `Dépôt wallet Ndewa360° — ${amount.toLocaleString('fr-FR')} FCFA`,
      userId: profile?._id || '',
      userEmail: profile?.email || '',
      metadata: { lang },
      successRedirectPath: `${returnPath}?deposit=success`,
      cancelRedirectPath: returnPath,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loading = false;
        this.dialogRef.close();
        this.router.navigate([`/${lang}/payment/${res.data.token}`]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message?.[0] || err?.error?.message || 'Impossible de créer la session de paiement. Vérifiez votre connexion.';
      },
    });
  }

  close(): void {
    if (this.loading) return;
    this.dialogRef.close();
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(n || 0);
  }
}
