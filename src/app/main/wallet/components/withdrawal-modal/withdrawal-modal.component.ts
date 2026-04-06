import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WalletAction, WalletState, WithdrawalMethod } from 'src/app/shared/store/wallet';

const FEE_RATE = 0.02;
const MIN_AMOUNT = 1000;

@Component({
  selector: 'app-withdrawal-modal',
  templateUrl: './withdrawal-modal.component.html',
  styleUrls: ['./withdrawal-modal.component.scss'],
})
export class WithdrawalModalComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  methods: { value: WithdrawalMethod; label: string; icon: string; placeholder: string }[] = [
    { value: 'MTN_MONEY',    label: 'MTN Mobile Money',  icon: 'fa-mobile-alt', placeholder: '6XXXXXXXX' },
    { value: 'ORANGE_MONEY', label: 'Orange Money',      icon: 'fa-mobile-alt', placeholder: '6XXXXXXXX' },
    { value: 'EASY_TRANSACT', label: 'Easy Transact',   icon: 'fa-mobile-alt', placeholder: '6XXXXXXXX' },
    { value: 'BANK',         label: 'Virement bancaire', icon: 'fa-university', placeholder: 'IBAN ou numéro de compte' },
  ];

  constructor(
    private dialogRef: MatDialogRef<WithdrawalModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { balance: number },
    private fb: FormBuilder,
    private store: Store,
    private actions: Actions,
  ) {
    this.form = this.fb.group({
      amount:    [null, [Validators.required, Validators.min(MIN_AMOUNT), Validators.max(data.balance)]],
      method:    ['MTN_MONEY', Validators.required],
      recipient: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.store.select(WalletState.withdrawLoading).pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);

    this.actions.pipe(ofActionSuccessful(WalletAction.RequestWithdrawal), takeUntil(this.destroy$))
      .subscribe(() => this.dialogRef.close({ success: true }));

    this.actions.pipe(ofActionErrored(WalletAction.RequestWithdrawal), takeUntil(this.destroy$))
      .subscribe((ctx: any) => {
        this.error = ctx?.error?.error?.message || 'Une erreur est survenue.';
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get fees(): number { return Math.round((this.form.value.amount || 0) * FEE_RATE); }
  get netAmount(): number { return (this.form.value.amount || 0) - this.fees; }
  get selectedMethod() { return this.methods.find(m => m.value === this.form.value.method); }
  get minAmount(): number { return MIN_AMOUNT; }

  setMaxAmount(): void {
    this.form.patchValue({ amount: this.data.balance });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.error = null;
    const { amount, method, recipient } = this.form.value;
    this.store.dispatch(new WalletAction.RequestWithdrawal(amount, method, recipient));
  }

  close(): void { this.dialogRef.close(); }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(n || 0);
  }
}
