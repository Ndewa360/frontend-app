import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';

import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry } from '../../store/geography/admin-geography.model';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';

export interface CountryDeleteModalData {
  country: AdminCountry;
}

@Component({
  selector: 'app-country-delete-modal',
  templateUrl: './country-delete-modal.component.html',
  styleUrls: ['./country-delete-modal.component.scss']
})
export class CountryDeleteModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading$ = new BehaviorSubject<boolean>(false);
  citiesCount = 0;
  usersCount = 0;

  constructor(
    private dialogRef: MatDialogRef<CountryDeleteModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CountryDeleteModalData,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService,
    private store: Store
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
    
    // Charger le nombre de villes associées
    this.adminGeographyService.getCitiesByCountry(this.data.country._id).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors du chargement des villes:', error);
        this.citiesCount = 0;
        throw error;
      })
    ).subscribe(cities => {
      this.citiesCount = cities.length;
      this.isLoading$.next(false);
    });

    // TODO: Charger le nombre d'utilisateurs associés
    // this.usersCount = this.data.country.userCount || 0;
  }

  /**
   * Confirmer la suppression
   */
  onConfirm(): void {
    this.isLoading$.next(true);

    // Utiliser le store pour la suppression
    this.store.dispatch(new AdminGeographyAction.DeleteCountry(this.data.country._id)).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors de la suppression du pays:', error);
        this.toastr.error('Erreur lors de la suppression du pays', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(() => {
      this.isLoading$.next(false);
      this.toastr.success(`Le pays ${this.data.country.name} a été supprimé avec succès`, 'Succès');
      this.dialogRef.close(true);
    });
  }

  /**
   * Annuler la suppression
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Obtenir le message d'avertissement
   */
  getWarningMessage(): string {
    const warnings = [];
    
    if (this.citiesCount > 0) {
      warnings.push(`${this.citiesCount} ville${this.citiesCount > 1 ? 's' : ''}`);
    }
    
    if (this.usersCount > 0) {
      warnings.push(`${this.usersCount} utilisateur${this.usersCount > 1 ? 's' : ''}`);
    }

    if (warnings.length === 0) {
      return '';
    }

    return `Cette action supprimera également ${warnings.join(' et ')} associé${warnings.length > 1 ? 's' : ''} à ce pays.`;
  }

  /**
   * Vérifier si la suppression est dangereuse
   */
  isDangerousDelete(): boolean {
    return this.citiesCount > 0 || this.usersCount > 0;
  }
}
