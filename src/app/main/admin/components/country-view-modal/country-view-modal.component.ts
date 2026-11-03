import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry, AdminCity } from '../../store/geography/admin-geography.model';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';

export interface CountryViewModalData {
  country: AdminCountry;
}

@Component({
  selector: 'app-country-view-modal',
  templateUrl: './country-view-modal.component.html',
  styleUrls: ['./country-view-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgIf, NgFor, AsyncPipe]
})
export class CountryViewModalComponent implements OnInit, OnDestroy {
  /** Traductions (textes construits dans le code). */
  private readonly i18n = inject(TranslateService);
  private destroy$ = new Subject<void>();
  
  isLoading$ = new BehaviorSubject<boolean>(false);
  cities: AdminCity[] = [];
  stats = {
    totalCities: 0,
    activeCities: 0,
    /** Biens (non supprimés) situés dans ce pays. */
    properties: 0
  };

  constructor(
    private dialogRef: MatDialogRef<CountryViewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CountryViewModalData,
    private adminGeographyService: AdminGeographyService
  ) {}

  ngOnInit(): void {
    this.loadCountryDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les détails du pays
   */
  private loadCountryDetails(): void {
    this.isLoading$.next(true);
    
    // Charger les villes associées
    this.adminGeographyService.getCitiesByCountry(this.data.country._id).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.cities = [];
        throw error;
      })
    ).subscribe(cities => {
      this.cities = cities;
      this.calculateStats();
      this.isLoading$.next(false);
    });

    this.adminGeographyService.getCountryUsage(this.data.country._id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: usage => this.stats = { ...this.stats, properties: usage.properties },
      error: () => this.stats = { ...this.stats, properties: 0 }
    });
  }

  /**
   * Calculer les statistiques
   */
  private calculateStats(): void {
    this.stats = {
      ...this.stats,
      totalCities: this.cities.length,
      activeCities: this.cities.filter(city => city.isActive).length
    };
  }

  /**
   * Fermer le modal
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Obtenir le statut du pays
   */
  getCountryStatus(): string {
    return this.data.country.isActive ? this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.ACTIVE') : this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.INACTIVE');
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(): string {
    return this.data.country.isActive ? 'active' : 'inactive';
  }

  /**
   * Formater la population
   */
  getFormattedPopulation(): string {
    if (!this.data.country.population) return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    return new Intl.NumberFormat('fr-FR').format(this.data.country.population);
  }

  /**
   * Formater la superficie
   */
  getFormattedArea(): string {
    if (!this.data.country.area) return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    return `${new Intl.NumberFormat('fr-FR').format(this.data.country.area)  } km²`;
  }

  /**
   * Obtenir les langues formatées
   */
  getFormattedLanguages(): string {
    if (!this.data.country.languages || this.data.country.languages.length === 0) {
      return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    }
    return this.data.country.languages.join(', ');
  }

  /**
   * Obtenir les coordonnées formatées
   */
  getFormattedCoordinates(): string {
    if (!this.data.country.coordinates) return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    const lat = this.data.country.coordinates.latitude.toFixed(4);
    const lng = this.data.country.coordinates.longitude.toFixed(4);
    return `${lat}, ${lng}`;
  }

  /**
   * Obtenir la date de création formatée
   */
  getFormattedCreatedAt(): string {
    if (!this.data.country.createdAt) return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    return new Date(this.data.country.createdAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir la date de mise à jour formatée
   */
  getFormattedUpdatedAt(): string {
    if (!this.data.country.updatedAt) return this.i18n.instant('ADMIN.COUNTRY_VIEW.TS.NOT_AVAILABLE');
    return new Date(this.data.country.updatedAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * TrackBy function pour la liste des villes
   */
  trackByCityId(index: number, city: AdminCity): string {
    return city._id;
  }
}
