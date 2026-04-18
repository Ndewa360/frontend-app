import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';
import { AdminCountry, AdminCity, AdminCurrency } from '../../store/geography/admin-geography.model';

import { CountrySelectionModalComponent, CountrySelectionResult } from '../../components/country-selection-modal/country-selection-modal.component';
import { CountryDeleteModalComponent } from '../../components/country-delete-modal/country-delete-modal.component';
import { CountryViewModalComponent } from '../../components/country-view-modal/country-view-modal.component';
import { CitySelectionModalComponent } from '../../components/city-selection-modal/city-selection-modal.component';
import { CountryEditModalComponent } from '../../components/country-edit-modal/country-edit-modal.component';
import { CityDeleteModalComponent, CityToDelete } from '../../components/city-delete-modal/city-delete-modal.component';
import { AdminGeographyService } from '../../services/admin-geography.service';
import { ExportService, ExportColumn } from '../../../properties/services/export.service';

@Component({
  selector: 'app-admin-geography',
  templateUrl: './admin-geography.component.html',
  styleUrls: ['./admin-geography.component.scss', '../../styles/admin-design-system.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AdminGeographyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  countries$    = this.store.select(AdminGeographyState.selectCountries);
  cities$       = this.store.select(AdminGeographyState.selectCities);
  currencies$   = this.store.select(AdminGeographyState.selectCurrencies);
  stats$        = this.store.select(AdminGeographyState.selectStats);
  isLoading$    = this.store.select(AdminGeographyState.selectIsLoading);

  selectedTab = 'countries';
  isRefreshing = false;

  // Filtres pays
  countrySearchTerm = '';
  showCountryFilters = false;

  // Filtres villes
  citySearchTerm = '';
  selectedCountryFilter = '';
  selectedStatusFilter = '';

  // Filtres devises
  currencySearchTerm = '';

  filteredCountries$ = this.countries$;
  filteredCities$    = this.cities$;
  filteredCurrencies$ = this.currencies$;

  // Modal suppression ville
  showCityDeleteModal = false;
  cityToDelete: CityToDelete | null = null;

  // Modal devise
  showCurrencyModal = false;
  editingCurrency: AdminCurrency | null = null;
  currencyForm: FormGroup;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private geographyService: AdminGeographyService,
    private exportService: ExportService
  ) {
    this.currencyForm = this.fb.group({
      name:      ['', Validators.required],
      code:      ['', [Validators.required, Validators.maxLength(3)]],
      symbol:    ['', Validators.required],
      rate:      [1, [Validators.required, Validators.min(0)]],
      isActive:  [true],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminGeographyAction.LoadCountries(),
      new AdminGeographyAction.LoadCities(),
      new AdminGeographyAction.LoadCurrencies(),
      new AdminGeographyAction.LoadGeographyStats()
    ]);
  }

  onTabChange(tab: string): void { this.selectedTab = tab; }

  onCreateItem(): void {
    if (this.selectedTab === 'countries') {
      this.openCountrySelectionModal();
    } else if (this.selectedTab === 'cities') {
      this.openCitySelectionModal();
    } else if (this.selectedTab === 'currencies') {
      this.onCreateCurrency();
    }
  }

  openCountrySelectionModal(): void {
    const dialogRef = this.dialog.open(CountrySelectionModalComponent, {
      width: '900px', maxWidth: '95vw', maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe((result: CountrySelectionResult) => {
      if (result) {
        this.toastr.success(`Le pays ${result.country.shortName} a été ajouté avec succès`);
        this.loadData();
      }
    });
  }

  openCitySelectionModal(): void {
    const dialogRef = this.dialog.open(CitySelectionModalComponent, {
      width: '900px', maxWidth: '95vw', maxHeight: '90vh'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.toastr.success(`La ville ${result.city.fullName} a été ajoutée avec succès`);
        this.loadData();
      }
    });
  }

  async onRefreshData(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.store.dispatch(new AdminGeographyAction.RefreshData());
    setTimeout(() => this.isRefreshing = false, 1000);
  }

  // ── Pays ──────────────────────────────────────────────────────────────────

  onToggleCountryStatus(country: AdminCountry): void {
    this.geographyService.toggleCountry(country._id, !country.isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`Pays ${country.isActive ? 'désactivé' : 'activé'} avec succès`);
          this.store.dispatch(new AdminGeographyAction.LoadCountries());
        },
        error: () => this.toastr.error('Erreur lors du changement de statut')
      });
  }

  onViewCountryDetails(country: AdminCountry): void {
    this.dialog.open(CountryViewModalComponent, {
      width: '800px', maxWidth: '95vw', maxHeight: '90vh', data: { country }
    });
  }

  onEditCountry(country: AdminCountry): void {
    const dialogRef = this.dialog.open(CountryEditModalComponent, {
      width: '600px', maxWidth: '95vw', maxHeight: '90vh', data: { country }
    });
    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.toastr.success(`Pays ${updated.name} mis à jour`);
        this.loadData();
      }
    });
  }

  onDeleteCountry(country: AdminCountry): void {
    const dialogRef = this.dialog.open(CountryDeleteModalComponent, {
      width: '500px', maxWidth: '95vw', data: { country }
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.toastr.success(`Pays supprimé`);
        this.loadData();
      }
    });
  }

  onCountrySearch(event: Event): void {
    this.countrySearchTerm = (event.target as HTMLInputElement).value;
  }

  onToggleCountryFilters(): void { this.showCountryFilters = !this.showCountryFilters; }
  onResetCountryFilters(): void { this.countrySearchTerm = ''; this.showCountryFilters = false; }
  onApplyCountryFilters(): void { this.showCountryFilters = false; }
  onSort(_column: string): void {}

  onExportCountries(): void {
    this.countries$.pipe(take(1)).subscribe((countries: AdminCountry[]) => {
      if (!countries?.length) { this.toastr.warning('Aucun pays à exporter'); return; }
      const columns: ExportColumn[] = [
        { key: 'name', label: 'Nom du pays' },
        { key: 'code', label: 'Code' },
        { key: 'currency', label: 'Devise' },
        { key: 'cityCount', label: 'Villes' },
        { key: 'isActive', label: 'Statut', formatter: (v) => v ? 'Actif' : 'Inactif' }
      ];
      this.exportService.exportToExcel({ filename: 'Pays', sheetName: 'Pays', columns, data: countries });
    });
  }

  getFilteredCountries(countries: AdminCountry[]): AdminCountry[] {
    if (!countries) return [];
    if (!this.countrySearchTerm) return countries;
    const term = this.countrySearchTerm.toLowerCase();
    return countries.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.code?.toLowerCase().includes(term) ||
      c.currency?.toLowerCase().includes(term)
    );
  }

  // ── Villes ────────────────────────────────────────────────────────────────

  onToggleCityStatus(city: AdminCity): void {
    this.geographyService.toggleCity(city._id, !city.isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`Ville ${city.isActive ? 'désactivée' : 'activée'}`);
          this.store.dispatch(new AdminGeographyAction.LoadCities());
        },
        error: () => this.toastr.error('Erreur lors du changement de statut de la ville')
      });
  }

  onViewCity(city: AdminCity): void {
    this.toastr.info(`Ville : ${city.name} — ${city.country?.name || ''}`);
  }

  onEditCity(city: AdminCity): void {
    // Réutilise le modal CitySelection en passant la ville à éditer
    const dialogRef = this.dialog.open(CitySelectionModalComponent, {
      width: '900px', maxWidth: '95vw', maxHeight: '90vh',
      data: { editMode: true, city }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.toastr.success(`La ville ${result.city?.fullName || city.name} a été mise à jour`);
        this.loadData();
      }
    });
  }

  onDeleteCity(city: AdminCity): void {
    this.cityToDelete = {
      _id: city._id,
      fullName: city.name,
      country: city.country ? { _id: city.country._id, fullName: city.country.name || '' } : undefined,
      isActive: city.isActive,
      propertyCount: city.propertyCount || 0,
      userCount: city.userCount || 0
    };
    this.showCityDeleteModal = true;
  }

  onCloseCityDeleteModal(): void { this.showCityDeleteModal = false; this.cityToDelete = null; }

  onCityDeleted(_cityId: string): void {
    this.toastr.success(`Ville "${this.cityToDelete?.fullName}" supprimée`);
    this.onCloseCityDeleteModal();
    this.onRefreshData();
  }

  onCitySearch(event: Event): void {
    this.citySearchTerm = (event.target as HTMLInputElement).value;
  }

  onImportCitiesFromGeonames(): void {
    this.toastr.info('Fonctionnalité d\'import GeoNames en cours de développement');
  }

  onCreateCity(): void { this.selectedTab = 'cities'; this.openCitySelectionModal(); }

  onExportCities(): void {
    this.cities$.pipe(take(1)).subscribe((cities: AdminCity[]) => {
      if (!cities?.length) { this.toastr.warning('Aucune ville à exporter'); return; }
      const columns: ExportColumn[] = [
        { key: 'name', label: 'Ville' },
        { key: 'country', label: 'Pays', formatter: (v) => v?.name || 'N/A' },
        { key: 'isActive', label: 'Statut', formatter: (v) => v ? 'Actif' : 'Inactif' }
      ];
      this.exportService.exportToExcel({ filename: 'Villes', sheetName: 'Villes', columns, data: cities });
    });
  }

  getFilteredCities(cities: AdminCity[]): AdminCity[] {
    if (!cities) return [];
    return cities.filter(city => {
      const matchesName = !this.citySearchTerm || city.name.toLowerCase().includes(this.citySearchTerm.toLowerCase());
      const matchesCountry = !this.selectedCountryFilter || city.country?._id === this.selectedCountryFilter;
      const matchesStatus = !this.selectedStatusFilter ||
        (this.selectedStatusFilter === 'active' && city.isActive) ||
        (this.selectedStatusFilter === 'inactive' && !city.isActive);
      return matchesName && matchesCountry && matchesStatus;
    });
  }

  // ── Devises ───────────────────────────────────────────────────────────────

  onCreateCurrency(): void {
    this.editingCurrency = null;
    this.currencyForm.reset({ rate: 1, isActive: true, isDefault: false });
    this.showCurrencyModal = true;
  }

  onEditCurrency(currency: AdminCurrency): void {
    this.editingCurrency = currency;
    this.currencyForm.patchValue({
      name:      currency.name,
      code:      currency.code,
      symbol:    currency.symbol,
      rate:      currency.rate,
      isActive:  currency.isActive,
      isDefault: currency.isDefault
    });
    this.showCurrencyModal = true;
  }

  onSaveCurrency(): void {
    if (this.currencyForm.invalid) { this.currencyForm.markAllAsTouched(); return; }
    const data = this.currencyForm.value;
    if (this.editingCurrency) {
      this.geographyService.updateCurrency(this.editingCurrency._id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Devise mise à jour');
            this.showCurrencyModal = false;
            this.store.dispatch(new AdminGeographyAction.LoadCurrencies());
          },
          error: () => this.toastr.error('Erreur lors de la mise à jour')
        });
    } else {
      this.geographyService.createCurrency(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Devise créée');
            this.showCurrencyModal = false;
            this.store.dispatch(new AdminGeographyAction.LoadCurrencies());
          },
          error: () => this.toastr.error('Erreur lors de la création')
        });
    }
  }

  // Modal de confirmation suppression devise (remplace window.confirm)
  showDeleteCurrencyModal = false;
  currencyToDelete: AdminCurrency | null = null;

  onDeleteCurrency(currency: AdminCurrency): void {
    this.currencyToDelete = currency;
    this.showDeleteCurrencyModal = true;
  }

  confirmDeleteCurrency(): void {
    if (!this.currencyToDelete) return;
    const currency = this.currencyToDelete;
    this.showDeleteCurrencyModal = false;
    this.currencyToDelete = null;
    this.geographyService.deleteCurrency(currency._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Devise supprimée'); this.store.dispatch(new AdminGeographyAction.LoadCurrencies()); },
        error: () => this.toastr.error('Erreur lors de la suppression')
      });
  }

  cancelDeleteCurrency(): void {
    this.showDeleteCurrencyModal = false;
    this.currencyToDelete = null;
  }

  onToggleCurrencyStatus(currency: AdminCurrency): void {
    this.geographyService.updateCurrency(currency._id, { isActive: !currency.isActive })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`Devise ${currency.isActive ? 'désactivée' : 'activée'}`);
          this.store.dispatch(new AdminGeographyAction.LoadCurrencies());
        },
        error: () => this.toastr.error('Erreur lors du changement de statut')
      });
  }

  onSetDefaultCurrency(currency: AdminCurrency): void {
    this.geographyService.setDefaultCurrency(currency._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`${currency.code} définie comme devise par défaut`);
          this.store.dispatch(new AdminGeographyAction.LoadCurrencies());
        },
        error: () => this.toastr.error('Erreur lors du changement de devise par défaut')
      });
  }

  onCloseCurrencyModal(): void { this.showCurrencyModal = false; this.editingCurrency = null; }

  getFilteredCurrencies(currencies: AdminCurrency[]): AdminCurrency[] {
    if (!currencies) return [];
    if (!this.currencySearchTerm) return currencies;
    const term = this.currencySearchTerm.toLowerCase();
    return currencies.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.code?.toLowerCase().includes(term) ||
      c.symbol?.toLowerCase().includes(term)
    );
  }

  onExportCurrencies(): void {
    this.currencies$.pipe(take(1)).subscribe((currencies: AdminCurrency[]) => {
      if (!currencies?.length) { this.toastr.warning('Aucune devise à exporter'); return; }
      const columns: ExportColumn[] = [
        { key: 'name', label: 'Nom' },
        { key: 'code', label: 'Code' },
        { key: 'symbol', label: 'Symbole' },
        { key: 'rate', label: 'Taux' },
        { key: 'isDefault', label: 'Par défaut', formatter: (v) => v ? 'Oui' : 'Non' },
        { key: 'isActive', label: 'Statut', formatter: (v) => v ? 'Actif' : 'Inactif' }
      ];
      this.exportService.exportToExcel({ filename: 'Devises', sheetName: 'Devises', columns, data: currencies });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  trackByCountryId(_: number, c: AdminCountry): string { return c._id; }
  trackByCityId(_: number, c: AdminCity): string { return c._id; }
  trackByCurrencyId(_: number, c: AdminCurrency): string { return c._id; }

  getActiveCountriesCount(): number {
    return (this.store.selectSnapshot(AdminGeographyState.selectCountries) || []).filter(c => c.isActive).length;
  }

  getActiveCitiesCount(): number {
    return (this.store.selectSnapshot(AdminGeographyState.selectCities) || []).filter(c => c.isActive).length;
  }

  getActiveCurrenciesCount(): number {
    return (this.store.selectSnapshot(AdminGeographyState.selectCurrencies) || []).filter(c => c.isActive).length;
  }
}
