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
      description: [`Lien de paiement pour ${this.data.room?.code || 'l\'unité'}`, Validators.required]
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

    this.loading = true;
    this.paymentLinkService.getExistingPaymentLink(this.data.location._id).subscribe({
      next: (response) => {
        // Un lien existe déjà, l'afficher
        this.generatedLink = response.data.paymentUrl;
        this.loading = false;
        console.log('✅ Lien existant trouvé:', response.data);
      },
      error: () => {
        // Aucun lien existant, continuer normalement
        this.loading = false;
        console.log('ℹ️ Aucun lien existant, prêt à en créer un nouveau');
      }
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid || !this.data.location) {
      return;
    }

    this.loading = true;
    const formValue = this.formGroup.value;

    const request = {
      locationId: this.data.location._id,
      description: formValue.description
    };

    this.paymentLinkService.generatePaymentLink(request).subscribe({
      next: (response) => {
        this.generatedLink = response.data.paymentUrl;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la génération du lien:', error);
        this.loading = false;
        // TODO: Afficher un message d'erreur
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
