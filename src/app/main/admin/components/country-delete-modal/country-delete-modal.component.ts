import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry } from '../../store/geography/admin-geography.model';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';
import { NgIf, AsyncPipe } from '@angular/common';

export interface CountryDeleteModalData {
  country: AdminCountry;
}

@Component({
  selector: 'app-country-delete-modal',
  templateUrl: './country-delete-modal.component.html',
  styleUrls: ['./country-delete-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgIf, AsyncPipe]
})
export class CountryDeleteModalComponent implements OnInit, OnDestroy {
  /** Traductions (textes construits dans le code). */
  private readonly i18n = inject(TranslateService);
  private destroy$ = new Subject<void>();
  
  isLoading$ = new BehaviorSubject<boolean>(false);
  citiesCount = 0;
  /** Biens situés dans ce pays : la suppression est alors refusée par le serveur. */
  propertiesCount = 0;

  constructor(
    private dialogRef: MatDialogRef<CountryDeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CountryDeleteModalData,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService,
    private store: Store,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCountryStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les statistiques du pays
   */
  private loadCountryStats(): void {
    this.isLoading$.next(true);
    this.adminGeographyService.getCountryUsage(this.data.country._id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: usage => {
        this.citiesCount = usage.cities;
        this.propertiesCount = usage.properties;
        this.isLoading$.next(false);
      },
      error: () => this.isLoading$.next(false)
    });
  }

  /**
   * Confirmer la suppression
   */
  onConfirm(): void {
    if (this.isBlocked()) return;
    this.isLoading$.next(true);

    // Utiliser le store pour la suppression
    this.store.dispatch(new AdminGeographyAction.DeleteCountry(this.data.country._id)).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        const serverMessage = error?.error?.message;
        const message = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
        this.toastr.error(message || this.translate.instant('GEOGRAPHY.COUNTRY.DELETE_ERROR'), this.translate.instant('COMMON.ERROR'));
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(() => {
      this.isLoading$.next(false);
      this.toastr.success(this.translate.instant('GEOGRAPHY.COUNTRY.DELETE_SUCCESS', { name: this.data.country.name }), this.translate.instant('COMMON.SUCCESS'));
      this.dialogRef.close(true);
    });
  }

  /**
   * Annuler la suppression
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /** Des biens sont situés dans ce pays : il faut le désactiver plutôt que le supprimer. */
  isBlocked(): boolean {
    return this.propertiesCount > 0;
  }

  /**
   * Obtenir le message d'avertissement
   */
  getWarningMessage(): string {
    if (this.isBlocked()) {
      return this.i18n.instant('ADMIN.COUNTRY_DELETE.TS.BLOCKED', { count: this.propertiesCount });
    }
    if (this.citiesCount > 0) {
      return this.i18n.instant('ADMIN.COUNTRY_DELETE.TS.CITIES_TOO', { count: this.citiesCount });
    }
    return '';
  }

  /**
   * Vérifier si la suppression est dangereuse
   */
  isDangerousDelete(): boolean {
    return this.citiesCount > 0 || this.propertiesCount > 0;
  }
}
