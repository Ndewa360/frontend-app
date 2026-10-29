import { Component, ElementRef, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingModule } from 'carbon-components-angular/loading';
import { NgIf } from '@angular/common';
import { IbmIconComponent } from '../../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { ButtonModule } from 'carbon-components-angular/button';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'show-billing-contract',
  templateUrl: './show-billing-contract.component.html',
  styleUrls: ['./show-billing-contract.component.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [FlexModule, ButtonModule, IbmIconComponent, NgIf, LoadingModule]
})
export class ShowBillingContractComponent implements OnInit, OnDestroy {

  waittingResponse = false;
  isButtonEnabled = false;
  upgradeError: string | null = null;

  private destroy$ = new Subject<void>();

  @ViewChild('refContractBilling', { static: true }) refContractBilling: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<ShowBillingContractComponent>
  ) {}

  ngOnInit(): void {
    // Activer le bouton si le contenu ne necessite pas de scroll
    setTimeout(() => {
      const el = this.refContractBilling?.nativeElement;
      if (el && el.scrollHeight <= el.clientHeight) {
        this.isButtonEnabled = true;
      }
    }, 200);
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

  /** Conditions consultées : le forfait est appliqué automatiquement, rien à valider. */
  validConsultation(): void {
    this.dialogRef.close({ upgraded: false });
  }
}
