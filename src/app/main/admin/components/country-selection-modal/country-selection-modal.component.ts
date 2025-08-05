import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { RestCountriesService, RestCountry, Region } from '../../services/rest-countries.service';
import { AdminGeographyService } from '../../services/admin-geography.service';

export interface CountrySelectionModalData {
  title?: string;
  subtitle?: string;
}

export interface CountrySelectionResult {
  country: any;
  region: Region;
}

@Component({
  selector: 'app-country-selection-modal',
  templateUrl: './country-selection-modal.component.html',
  styleUrls: ['./country-selection-modal.component.scss']
})
export class CountrySelectionModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // États du modal
  currentStep: 'region' | 'country' = 'region';
  isLoading$ = new BehaviorSubject<boolean>(false);
  
  // Données
  regions: Region[] = [];
  selectedRegion: Region | null = null;
  countries: RestCountry[] = [];
  filteredCountries: RestCountry[] = [];
  selectedCountry: RestCountry | null = null;

  // Contrôles de formulaire
  searchControl = new FormControl('');

  // Configuration
  title: string;
  subtitle: string;

  constructor(
    private dialogRef: MatDialogRef<CountrySelectionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CountrySelectionModalData,
    private restCountriesService: RestCountriesService,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService
  ) {
    this.title = data?.title || 'Ajouter un pays';
    this.subtitle = data?.subtitle || 'Sélectionnez une région puis un pays à ajouter';
  }

  ngOnInit(): void {
    this.initializeRegions();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser les régions
   */
  private initializeRegions(): void {
    this.regions = this.restCountriesService.getAvailableRegions();
  }

  /**
   * Configurer la recherche de pays
   */
  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      startWith('')
    ).subscribe(searchTerm => {
      this.filterCountries(searchTerm || '');
    });
  }

  /**
   * Gérer le clic sur une région
   */
  onRegionClick(region: Region): void {
    if (this.isLoading$.value) {
      return;
    }
    this.onSelectRegion(region);
  }

  /**
   * Sélectionner une région
   */
  onSelectRegion(region: Region): void {
    this.selectedRegion = region;
    this.isLoading$.next(true);

    this.restCountriesService.getCountriesByRegion(region.name).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors du chargement des pays:', error);
        this.toastr.error('Erreur lors du chargement des pays', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(countries => {
      this.countries = countries;
      this.filteredCountries = countries;
      this.currentStep = 'country';
      this.isLoading$.next(false);
      this.searchControl.setValue('');
    });
  }

  /**
   * Filtrer les pays
   */
  private filterCountries(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredCountries = this.countries;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredCountries = this.countries.filter(country =>
      country.name.common.toLowerCase().includes(term) ||
      country.name.official.toLowerCase().includes(term) ||
      country.cca2.toLowerCase().includes(term) ||
      country.cca3.toLowerCase().includes(term)
    );
  }

  /**
   * Sélectionner un pays
   */
  onSelectCountry(country: RestCountry): void {
    this.selectedCountry = country;
  }

  /**
   * Retourner à la sélection de région
   */
  onBackToRegions(): void {
    this.currentStep = 'region';
    this.selectedRegion = null;
    this.countries = [];
    this.filteredCountries = [];
    this.selectedCountry = null;
    this.searchControl.setValue('');
  }

  /**
   * Confirmer la sélection
   */
  onConfirm(): void {
    if (!this.selectedCountry || !this.selectedRegion) {
      return;
    }

    this.isLoading$.next(true);

    // Transformer le pays pour l'application
    const transformedCountry = this.restCountriesService.transformCountryForApp(this.selectedCountry);

    // Sauvegarder le pays
    this.adminGeographyService.createCountry(transformedCountry).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors de la création du pays:', error);
        this.toastr.error('Erreur lors de la création du pays', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(result => {
      this.isLoading$.next(false);
      this.toastr.success(`Le pays ${this.selectedCountry!.name.common} a été ajouté avec succès`, 'Succès');
      
      const modalResult: CountrySelectionResult = {
        country: result,
        region: this.selectedRegion!
      };
      
      this.dialogRef.close(modalResult);
    });
  }

  /**
   * Annuler
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Obtenir le drapeau d'un pays
   */
  getCountryFlag(country: RestCountry): string {
    return country.flags?.svg || country.flags?.png || '';
  }

  /**
   * Obtenir la devise principale d'un pays
   */
  getPrimaryCurrency(country: RestCountry): string {
    if (!country.currencies) return 'N/A';
    const currencyCode = Object.keys(country.currencies)[0];
    const currency = country.currencies[currencyCode];
    return `${currencyCode} (${currency.symbol || ''})`;
  }

  /**
   * Obtenir la capitale d'un pays
   */
  getCapital(country: RestCountry): string {
    return country.capital?.[0] || 'N/A';
  }

  /**
   * Obtenir la population formatée
   */
  getFormattedPopulation(country: RestCountry): string {
    if (!country.population) return 'N/A';
    return new Intl.NumberFormat('fr-FR').format(country.population);
  }

  /**
   * TrackBy function pour la liste des pays
   */
  trackByCountryCode(index: number, country: RestCountry): string {
    return country.cca2;
  }
}
