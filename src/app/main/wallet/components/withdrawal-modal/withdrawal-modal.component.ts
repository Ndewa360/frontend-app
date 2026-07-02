import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WalletAction, WalletState, WithdrawalMethod } from 'src/app/shared/store/wallet';

const FEE_RATE  = 0.02;
const MIN_AMOUNT = 500;

// Cameroun — 9 chiffres sans indicatif pays (+237 non inclus)
// Orange : 69X (prefixe 2 chiffres + 7) | 655-659 (prefixe 3 chiffres + 6) | 66X (prefixe 2 chiffres + 7)
// MTN    : 67X (prefixe 2 chiffres + 7) | 68X (prefixe 2 chiffres + 7)    | 650-654 (prefixe 3 chiffres + 6)
const ORANGE_REGEX = /^(69|66)\d{7}$|^65[5-9]\d{6}$/;
const MTN_REGEX    = /^(67|68)\d{7}$|^65[0-4]\d{6}$/;

export interface WithdrawalMethodDef {
  value: WithdrawalMethod;
  label: string;
  description: string;
  badge: string;
  badgeClass: string;
  placeholder: string;
  inputType: 'phone' | 'text';
}

@Component({
  selector: 'app-withdrawal-modal',
  templateUrl: './withdrawal-modal.component.html',
  styleUrls: ['./withdrawal-modal.component.scss'],
})
export class WithdrawalModalComponent implements OnInit, OnDestroy {

  step: 'method' | 'details' = 'method';
  selectedMethodDef: WithdrawalMethodDef | null = null;

  form: FormGroup;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  methods: WithdrawalMethodDef[] = [
    {
      value:       'ORANGE_MONEY',
      label:       'Orange Money',
      description: 'Retrait vers votre compte Orange Money',
      badge:       'OM',
      badgeClass:  'badge--orange',
      placeholder: '6XXXXXXXX',
      inputType:   'phone',
    },
    {
      value:       'MTN_MONEY',
      label:       'MTN Mobile Money',
      description: 'Retrait vers votre compte MTN MoMo',
      badge:       'MTN',
      badgeClass:  'badge--mtn',
      placeholder: '6XXXXXXXX',
      inputType:   'phone',
    },
    {
      value:       'BANK',
      label:       'Virement bancaire',
      description: 'Retrait vers votre compte bancaire',
      badge:       '🏦',
      badgeClass:  'badge--bank',
      placeholder: 'IBAN ou numéro de compte',
      inputType:   'text',
    },
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
      method:    ['', Validators.required],
      recipient: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]],
    });
  }

  ngOnInit(): void {
    this.store.select(WalletState.withdrawLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.loading = l);

    this.actions.pipe(ofActionSuccessful(WalletAction.RequestWithdrawal), takeUntil(this.destroy$))
      .subscribe(() => this.dialogRef.close({ success: true }));

    this.actions.pipe(ofActionErrored(WalletAction.RequestWithdrawal), takeUntil(this.destroy$))
      .subscribe((ctx: any) => {
        this.error = ctx?.error?.error?.message?.[0]
          || ctx?.error?.error?.message
          || 'Une erreur est survenue.';
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get fees(): number      { return Math.round((this.form.value.amount || 0) * FEE_RATE); }
  get netAmount(): number { return (this.form.value.amount || 0) - this.fees; }
  get minAmount(): number { return MIN_AMOUNT; }
  get isPhone(): boolean  { return this.selectedMethodDef?.inputType === 'phone'; }

  selectMethod(m: WithdrawalMethodDef): void {
    this.selectedMethodDef = m;
    this.form.patchValue({ method: m.value, recipient: '' });
    this.error = null;
    this.updateRecipientValidator(m.value);
    this.step = 'details';
  }

  backToMethod(): void {
    this.step = 'method';
    this.selectedMethodDef = null;
    this.error = null;
    this.form.patchValue({ method: '', recipient: '' });
    this.form.get('recipient')?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
    this.form.get('recipient')?.updateValueAndValidity();
  }

  setMaxAmount(): void {
    this.form.patchValue({ amount: this.data.balance });
  }

  private updateRecipientValidator(method: WithdrawalMethod): void {
    const ctrl = this.form.get('recipient');
    if (method === 'ORANGE_MONEY') {
      ctrl?.setValidators([
        Validators.required,
        Validators.minLength(9),
        Validators.maxLength(9),
        Validators.pattern(ORANGE_REGEX),
      ]);
    } else if (method === 'MTN_MONEY') {
      ctrl?.setValidators([
        Validators.required,
        Validators.minLength(9),
        Validators.maxLength(9),
        Validators.pattern(MTN_REGEX),
      ]);
    } else {
      // BANK : IBAN ou numéro de compte (6 à 34 caractères)
      ctrl?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(34)]);
    }
    ctrl?.updateValueAndValidity();
  }

  get phoneError(): string | null {
    const ctrl = this.form.get('recipient');
    if (!ctrl?.invalid || !ctrl?.touched) return null;
    if (ctrl.errors?.['required']) return 'Ce champ est requis.';
    if (ctrl.errors?.['minlength'] || ctrl.errors?.['maxlength'])
      return 'Le numéro doit contenir exactement 9 chiffres (ex : 6XXXXXXXX).';
    if (ctrl.errors?.['pattern']) {
      if (this.selectedMethodDef?.value === 'ORANGE_MONEY')
        return 'Numéro invalide pour Orange Money. Les numéros Orange commencent par 69, 655-659 ou 66 (ex : 691234567).';
      if (this.selectedMethodDef?.value === 'MTN_MONEY')
        return 'Numéro invalide pour MTN MoMo. Les numéros MTN commencent par 67, 68 ou 650-654 (ex : 671234567).';
    }
    return 'Numéro invalide.';
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.error = null;
    const { amount, method, recipient } = this.form.value;
    this.store.dispatch(new WalletAction.RequestWithdrawal(amount, method, recipient));
  }

  close(): void { this.dialogRef.close(); }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0,
    }).format(n || 0);
  }
}
