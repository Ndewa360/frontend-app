import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentLinkService } from 'src/app/shared/services/payment-link.service';
import { RoomModel } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-generate-payment-link-modal',
  templateUrl: './generate-payment-link-modal.component.html',
  styleUrls: ['./generate-payment-link-modal.component.scss']
})
export class GeneratePaymentLinkModalComponent implements OnInit {
  formGroup: FormGroup;
  loading = false;
  generatedLink: string | null = null;
  copied = false;

  constructor(
    private dialogRef: MatDialogRef<GeneratePaymentLinkModalComponent>,
    private formBuilder: FormBuilder,
    private paymentLinkService: PaymentLinkService,
    private languageUrlService: LanguageUrlService,
    private toastr: ToastrService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: {
      room: RoomModel;
      tenant: any;
      location: any;
    }
  ) {
    this.formGroup = this.formBuilder.group({
      description: ['PAYMENT_LINK.DEFAULT_DESCRIPTION', Validators.required]
    });
  }

  ngOnInit(): void {
    // Vérifier d'abord s'il existe déjà un lien pour cette location
    this.checkExistingLink();
  }

  checkExistingLink(): void {
    if (!this.data.location?._id) return;

    this.paymentLinkService.getExistingPaymentLink(this.data.location._id).subscribe({
      next: (response) => {
        this.generatedLink = response.data.paymentUrl;
      },
      error: (error) => {
        // 404 = aucun lien existant, comportement normal
        if (error.status !== 404) {
          console.warn('Erreur lors de la vérification du lien existant:', error.status);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid || !this.data.location) return;

    this.loading = true;
    // Utiliser LanguageUrlService au lieu de window.location.pathname
    // pour garantir la bonne langue en production
    const lang = this.languageUrlService.getCurrentLanguage();

    const request = {
      locationId: this.data.location._id,
      description: this.formGroup.value.description,
      lang,
    };

    this.paymentLinkService.generatePaymentLink(request).subscribe({
      next: (response) => {
        this.generatedLink = response.data.paymentUrl;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error(
          this.translate.instant('PAYMENT_LINK.GENERATION_ERROR'),
          'Ndewa360°'
        );
      }
    });
  }

  copyToClipboard(): void {
    if (this.generatedLink) {
      navigator.clipboard.writeText(this.generatedLink).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    }
  }

  openLink(): void {
    if (this.generatedLink) {
      window.open(this.generatedLink, '_blank');
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getCurrentDate(): Date {
    return new Date();
  }
}
