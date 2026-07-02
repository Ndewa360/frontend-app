import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';

import { GeonamesService, TransformedCity } from '../../services/geonames.service';
import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry } from '../../store/geography/admin-geography.model';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';

export interface CitySelectionResult {
  success: boolean;
  city?: any;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-city-selection-modal',
  templateUrl: './city-selection-modal.component.html',
  styleUrls: ['./city-selection-modal.component.scss']
})
export class CitySelectionModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentStep: 'country' | 'city' = 'country';
  isLoading$ = new BehaviorSubject<boolean>(false);
  isLoadingMore$ = new BehaviorSubject<boolean>(false);

  countries: AdminCountry[] = [];
  cities: TransformedCity[] = [];
  selectedCountry: AdminCountry | null = null;
  selectedCity: TransformedCity | null = null;

  // Pagination
  totalCount = 0;
  currentStartRow = 0;
  get hasMore(): boolean { return this.cities.length < this.totalCount; }

  countrySearchControl = new FormControl('');
  citySearchControl = new FormControl('');

  constructor(
    private dialogRef: MatDialogRef<CitySelectionModalComponent>,
    private geonamesService: GeonamesService,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.store.select(AdminGeographyState.selectCountries).pipe(
      takeUntil(this.destroy$)
    ).subscribe(countries => {
      this.countries = countries.filter(c => c.isActive);
    });

    // Recherche live avec debounce — interroge l'API à chaque frappe
    this.citySearchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!this.selectedCountry) return of(null);
        const trimmed = (term || '').trim();

        this.cities = [];
        this.totalCount = 0;
        this.currentStartRow = 0;
        this.isLoading$.next(true);

        if (!trimmed) {
          // Champ vide → recharger les villes populaires du pays
          return this.geonamesService.getCitiesByCountry(this.selectedCountry.code, PAGE_SIZE).pipe(
            catchError(() => of(null))
          );
        }

        return this.geonamesService.searchCitiesByName(trimmed, this.selectedCountry.iso2 || this.selectedCountry.code, PAGE_SIZE, 0).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(result => {
      this.isLoading$.next(false);
      if (!result) return;

      if (Array.isArray(result)) {
        // Résultat de getCitiesByCountry (tableau simple)
        this.cities = result;
        this.totalCount = result.length;
      } else {
        // Résultat de searchCitiesByName { cities, totalCount }
        this.cities = result.cities;
        this.totalCount = result.totalCount;
        this.currentStartRow = PAGE_SIZE;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectCountry(country: AdminCountry): void {
    this.selectedCountry = country;
    this.cities = [];
    this.totalCount = 0;
    this.currentStartRow = 0;
    this.selectedCity = null;
    this.citySearchControl.setValue('', { emitEvent: false });
    this.isLoading$.next(true);
    this.currentStep = 'city';

    // Chargement initial : villes les plus peuplées du pays
    this.geonamesService.getCitiesByCountry(country.code, PAGE_SIZE).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.toastr.error('Erreur lors du chargement des villes', 'Erreur');
        this.isLoading$.next(false);
        return of([]);
      })
    ).subscribe(cities => {
      this.cities = cities;
      this.totalCount = cities.length; // pas de totalCount sur getCitiesByCountry
      this.isLoading$.next(false);
    });
  }

  loadMore(): void {
    if (!this.selectedCountry || this.isLoadingMore$.value || !this.hasMore) return;

    const term = (this.citySearchControl.value || '').trim();
    if (!term) return; // "charger plus" n'a de sens qu'en mode recherche

    this.isLoadingMore$.next(true);

    this.geonamesService.searchCitiesByName(
      term,
      this.selectedCountry.iso2 || this.selectedCountry.code,
      PAGE_SIZE,
      this.currentStartRow
    ).pipe(
      takeUntil(this.destroy$),
      catchError(() => of({ cities: [], totalCount: this.totalCount }))
    ).subscribe(result => {
      this.cities = [...this.cities, ...result.cities];
      this.totalCount = result.totalCount;
      this.currentStartRow += PAGE_SIZE;
      this.isLoadingMore$.next(false);
    });
  }

  onSelectCity(city: TransformedCity): void { this.selectedCity = city; }

  onConfirm(): void {
    if (!this.selectedCountry || !this.selectedCity) {
      this.toastr.warning('Veuillez sélectionner un pays et une ville', 'Sélection incomplète');
      return;
    }

    this.isLoading$.next(true);

    const cityData = this.geonamesService.transformCityForBackend(this.selectedCity, this.selectedCountry._id);

    this.store.dispatch(new AdminGeographyAction.CreateCity(cityData)).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.toastr.error('Erreur lors de la création de la ville', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(() => {
      this.isLoading$.next(false);
      this.toastr.success(`La ville ${this.selectedCity!.name} a été ajoutée avec succès`, 'Succès');
      this.dialogRef.close({ success: true, city: { ...cityData, country: this.selectedCountry } });
    });
  }

  onCancel(): void { this.dialogRef.close({ success: false }); }

  onBack(): void {
    if (this.currentStep === 'city') {
      this.currentStep = 'country';
      this.selectedCity = null;
      this.cities = [];
      this.totalCount = 0;
    }
  }

  getFilteredCountries(): AdminCountry[] {
    const term = (this.countrySearchControl.value || '').toLowerCase();
    if (!term) return this.countries;
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    );
  }

  isCitySelected(city: TransformedCity): boolean { return this.selectedCity?.geonameId === city.geonameId; }

  getConfirmButtonText(): string {
    if (this.isLoading$.value) return 'Création en cours...';
    return this.selectedCity ? `Ajouter ${this.selectedCity.name}` : 'Sélectionner une ville';
  }

  canConfirm(): boolean { return !!(this.selectedCountry && this.selectedCity && !this.isLoading$.value); }

  trackByCountryId(_: number, c: AdminCountry): string { return c._id; }
  trackByCityId(_: number, c: TransformedCity): number { return c.geonameId; }
}
