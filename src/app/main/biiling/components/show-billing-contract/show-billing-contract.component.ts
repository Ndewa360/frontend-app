import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Actions, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SubscriptionLimitAction } from 'src/app/shared/store/subscription-limit';

@Component({
  selector: 'show-billing-contract',
  templateUrl: './show-billing-contract.component.html',
  styleUrls: ['./show-billing-contract.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ShowBillingContractComponent implements OnInit, OnDestroy {

  waittingResponse = false;
  isButtonEnabled = false;
  upgradeError: string | null = null;

  private destroy$ = new Subject<void>();

  @ViewChild('refContractBilling', { static: true }) refContractBilling: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<ShowBillingContractComponent>,
    private _store: Store,
    private _ngxsAction: Actions,
  ) {}

  ngOnInit(): void {
    // Activer le bouton si le contenu ne necessite pas de scroll
    setTimeout(() => {
      const el = this.refContractBilling?.nativeElement;
      if (el && el.scrollHeight <= el.clientHeight) {
        this.isButtonEnabled = true;
      }
    }, 200);

    // Succes : fermer le dialog — le composant parent gere la suite
    this._ngxsAction.pipe(
      ofActionSuccessful(SubscriptionLimitAction.UpgradeToPremium),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.waittingResponse = false;
      this.dialogRef.close({ upgraded: true });
    });

    // Erreur
    this._ngxsAction.pipe(
      ofActionErrored(SubscriptionLimitAction.UpgradeToPremium),
      takeUntil(this.destroy$)
    ).subscribe((ctx: any) => {
      this.waittingResponse = false;
      const error = ctx?.error?.error;
      if (error?.error === 'Souscription/UnpaidInvoices') {
        this.upgradeError = error?.message?.[0] || 'Vous avez des factures impayées. Veuillez les régler avant de passer au premium.';
      } else if (error?.error === 'Souscription/AlreadyPremium') {
        this.upgradeError = 'Vous êtes déjà sur le plan premium.';
        this.dialogRef.close({ upgraded: false });
      } else {
        this.upgradeError = error?.message?.[0] || 'Une erreur est survenue lors de l\'upgrade.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    this.dialogRef.close({ upgraded: false });
  }

  onContractScroll(e: Event): void {
    const element = e.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      this.isButtonEnabled = true;
    }
  }

  validConsultation(): void {
    this.waittingResponse = true;
    this.upgradeError = null;
    this._store.dispatch(new SubscriptionLimitAction.UpgradeToPremium());
  }
}
