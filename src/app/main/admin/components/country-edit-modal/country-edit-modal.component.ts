import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry, UpdateCountryDto } from '../../store/geography/admin-geography.model';

export interface CountryEditModalData {
  country: AdminCountry;
}

@Component({
  selector: 'app-country-edit-modal',
  templateUrl: './country-edit-modal.component.html',
  styleUrls: ['./country-edit-modal.component.scss']
})
export class CountryEditModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading$ = new BehaviorSubject<boolean>(false);
  countryForm: FormGroup;
  
  // Listes pour les sélecteurs
  timezones = [
    'UTC',
    'UTC+1',
    'UTC+2',
    'UTC+3',
    'UTC+4',
    'UTC+5',
    'UTC+6',
    'UTC+7',
    'UTC+8',
    'UTC+9',
    'UTC+10',
    'UTC+11',
    'UTC+12',
    'UTC-1',
    'UTC-2',
    'UTC-3',
    'UTC-4',
    'UTC-5',
    'UTC-6',
    'UTC-7',
    'UTC-8',
    'UTC-9',
    'UTC-10',
    'UTC-11',
    'UTC-12'
  ];

  currencies = [
    { code: 'XAF', name: 'Franc CFA', symbol: 'FCFA' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'Dollar américain', symbol: '$' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'C$' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'A$' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' }
  ];

  constructor(
    private dialogRef: MatDialogRef<CountryEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CountryEditModalData,
    private fb: FormBuilder,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService
  ) {
    this.countryForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Créer le formulaire
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]],
      currency: ['', [Validators.required]],
      timezone: [''],
      capital: [''],
      phoneCode: [''],
      isActive: [true]
    });
  }

  /**
   * Initialiser le formulaire avec les données du pays
   */
  private initializeForm(): void {
    this.countryForm.patchValue({
      name: this.data.country.name,
      code: this.data.country.code,
      currency: this.data.country.currency,
      timezone: this.data.country.timezone || '',
      capital: this.data.country.capital || '',
      phoneCode: this.data.country.phoneCode || '',
      isActive: this.data.country.isActive
    });
  }

  /**
   * Sauvegarder les modifications
   */
  onSave(): void {
    if (this.countryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading$.next(true);
    
    const updateData: UpdateCountryDto = {
      ...this.countryForm.value
    };

    this.adminGeographyService.updateCountry(this.data.country._id, updateData).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors de la mise à jour du pays:', error);
        this.toastr.error('Erreur lors de la mise à jour du pays', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(updatedCountry => {
      this.isLoading$.next(false);
      this.toastr.success(`Le pays ${updatedCountry.name} a été mis à jour avec succès`, 'Succès');
      this.dialogRef.close(updatedCountry);
    });
  }

  /**
   * Annuler les modifications
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.countryForm.controls).forEach(key => {
      const control = this.countryForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.countryForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.countryForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Ce champ est obligatoire';
    }
    
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }

    return 'Valeur invalide';
  }
}
