import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentLinkService } from 'src/app/shared/services/payment-link.service';
import { RoomModel } from 'src/app/shared/store';

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
    if (!this.data.location?._id) {
      return;
    }

    // Ne pas afficher le loader lors de la vérification initiale
    this.paymentLinkService.getExistingPaymentLink(this.data.location._id).subscribe({
      next: (response) => {
        // Un lien existe déjà, l'afficher
        this.generatedLink = response.data.paymentUrl;
        console.log('✅ Lien existant trouvé:', response.data);
      },
      error: (error) => {
        // Aucun lien existant, continuer normalement
        // Ne pas afficher d'erreur à l'utilisateur, c'est normal
        console.log('ℹ️ Aucun lien existant, prêt à en créer un nouveau');

        // Vérifier si c'est vraiment une erreur ou juste l'absence de lien
        if (error.status !== 404) {
          console.warn('⚠️ Erreur inattendue lors de la vérification du lien:', error);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid || !this.data.location) {
      return;
    }

    this.loading = true;
    const lang = window.location.pathname.split('/')[1] || 'fr';

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
      error: (error) => {
        console.error('Erreur lors de la génération du lien:', error);
        this.loading = false;
        alert('Impossible de générer le lien de paiement. Veuillez réessayer.');
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
