import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

// Actions
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';

// States
import { AdminGeographyState } from '../../store/geography/admin-geography.state';

// Models
import { AdminCountry, AdminCity } from '../../store/geography/admin-geography.model';

// Components
import { CountrySelectionModalComponent, CountrySelectionResult } from '../../components/country-selection-modal/country-selection-modal.component';
import { CountryDeleteModalComponent } from '../../components/country-delete-modal/country-delete-modal.component';
import { CountryViewModalComponent } from '../../components/country-view-modal/country-view-modal.component';
import { CitySelectionModalComponent } from '../../components/city-selection-modal/city-selection-modal.component';
import { CountryEditModalComponent } from '../../components/country-edit-modal/country-edit-modal.component';

// Services
import { ExportService, ExportColumn } from '../../../properties/services/export.service';

@Component({
  selector: 'app-admin-geography',
  templateUrl: './admin-geography.component.html',
  styleUrls: [
    './admin-geography.component.scss',
    '../../styles/admin-design-system.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class AdminGeographyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  countries$ = this.store.select(AdminGeographyState.selectCountries);
  cities$ = this.store.select(AdminGeographyState.selectCities);
  currencies$ = this.store.select(AdminGeographyState.selectCurrencies);
  stats$ = this.store.select(AdminGeographyState.selectStats);
  isLoading$ = this.store.select(AdminGeographyState.selectIsLoading);

  // Component state
  selectedTab = 'countries';
  showCreateModal = false;
  showEditModal = false;
  selectedItem: AdminCountry | AdminCity | null = null;
  isRefreshing = false;

  // Filtres pour les villes
  citySearchTerm = '';
  selectedCountryFilter = '';
  selectedStatusFilter = '';

  // Search and filters
  countrySearchTerm = '';
  currencySearchTerm = '';
  showCountryFilters = false;
  showCityFilters = false;
  showCurrencyFilters = false;

  // Filtered observables
  filteredCountries$ = this.countries$;
  filteredCities$ = this.cities$;
  filteredCurrencies$ = this.currencies$;

  // Nouvelles propriétés pour la gestion par région
  availableRegions: string[] = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
  activatedRegions: string[] = [];
  regionStats: any = {};
  loadingRegions: Set<string> = new Set();

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Observer les changements de données
    this.countries$.subscribe(countries => {
      console.log('🔄 Countries observable updated:', countries?.length || 0, countries);
    });

    this.cities$.subscribe(cities => {
      console.log('🔄 Cities observable updated:', cities?.length || 0, cities);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    console.log('Chargement des données géographiques...');

    this.store.dispatch([
      new AdminGeographyAction.LoadCountries(),
      new AdminGeographyAction.LoadCities(),
      new AdminGeographyAction.LoadGeographyStats()
    ]);

    // Vérifier si les données se chargent
    setTimeout(() => {
      this.countries$.subscribe(countries => {
        console.log('Pays chargés:', countries?.length || 0, countries);
      });

      this.cities$.subscribe(cities => {
        console.log('Villes chargées:', cities?.length || 0, cities);
      });
    }, 1000);
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
  }

  onCreateItem(): void {
    if (this.selectedTab === 'countries') {
      this.openCountrySelectionModal();
    } else if (this.selectedTab === 'cities') {
      this.openCitySelectionModal();
    } else {
      // Pour les autres onglets, garder l'ancien comportement pour l'instant
      this.showCreateModal = true;
    }
  }

  /**
   * Ouvrir le modal de sélection de pays
   */
  openCountrySelectionModal(): void {
    const dialogRef = this.dialog.open(CountrySelectionModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        title: 'Ajouter un pays',
        subtitle: 'Sélectionnez une région puis un pays à ajouter à votre application'
      }
    });

    dialogRef.afterClosed().subscribe((result: CountrySelectionResult) => {
      if (result) {
        console.log('✅ Pays ajouté avec succès:', result);
        this.toastr.success(`Le pays ${result.country.shortName} a été ajouté avec succès`, 'Succès');

        // Recharger les données
        this.loadData();
      }
    });
  }

  /**
   * Ouvrir le modal d'ajout de ville
   */
  openCitySelectionModal(): void {
    const dialogRef = this.dialog.open(CitySelectionModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        console.log('✅ Ville ajoutée avec succès:', result.city);
        this.toastr.success(`La ville ${result.city.fullName} a été ajoutée avec succès`, 'Succès');

        // Recharger les données
        this.loadData();
      }
    });
  }

  onEditItem(item: AdminCountry | AdminCity): void {
    this.selectedItem = item;
    this.showEditModal = true;
  }

  onDeleteItem(item: AdminCountry | AdminCity): void {
    const itemType = this.selectedTab === 'countries' ? 'pays' : 'ville';
    const itemName = 'name' in item ? item.name : '';
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce ${itemType} "${itemName}" ?`)) {
      if (this.selectedTab === 'countries') {
        this.store.dispatch(new AdminGeographyAction.DeleteCountry(item._id));
      } else {
        this.store.dispatch(new AdminGeographyAction.DeleteCountry(item._id));
      }
    }
  }

  async onRefreshData(): Promise<void> {
    if (this.isRefreshing) return;

    try {
      this.isRefreshing = true;
      this.store.dispatch(new AdminGeographyAction.RefreshData());

      // Petit délai pour l'animation
      setTimeout(() => {
        this.isRefreshing = false;
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données géographiques:', error);
      this.isRefreshing = false;
    }
  }



  onItemCreated(): void {
    this.onCloseModal();
    this.loadData();
  }

  onItemUpdated(): void {
    this.onCloseModal();
    this.loadData();
  }

  trackByCountryId(_index: number, country: AdminCountry): string {
    return country._id;
  }

  trackByCityId(_index: number, city: AdminCity): string {
    return city._id;
  }

  // Menu state
  openMenuId: string | null = null;

  toggleCountryMenu(countryId: string): void {
    this.openMenuId = this.openMenuId === countryId ? null : countryId;
  }

  toggleCityMenu(cityId: string): void {
    this.openMenuId = this.openMenuId === cityId ? null : cityId;
  }

  // ==================== NOUVELLES MÉTHODES POUR LE DESIGN MODERNE ====================



  /**
   * Activer/Désactiver un pays
   */
  onToggleCountryStatus(country: AdminCountry): void {
    const action = country.isActive ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} le pays "${country.name}" ?`)) {
      // TODO: Implémenter l'action de toggle
      console.log(`${action} pays:`, country.name);
    }
  }

  /**
   * Voir les détails d'un pays
   */
  onViewCountryDetails(country: AdminCountry): void {
    const dialogRef = this.dialog.open(CountryViewModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { country }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('✅ Modal de visualisation fermé');
    });
  }

  // ==================== MÉTHODES DE CRÉATION ====================
  // Les méthodes de création sont définies plus bas dans la section REDESIGN

  /**
   * Éditer un pays
   */
  onEditCountry(country: AdminCountry): void {
    const dialogRef = this.dialog.open(CountryEditModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { country }
    });

    dialogRef.afterClosed().subscribe((updatedCountry) => {
      if (updatedCountry) {
        console.log('✅ Pays mis à jour:', updatedCountry);
        this.toastr.success(`Le pays ${updatedCountry.name} a été mis à jour avec succès`, 'Succès');

        // Recharger les données
        this.loadData();
      }
    });
  }

  /**
   * Éditer une ville
   */
  onEditCity(city: AdminCity): void {
    this.selectedItem = city;
    this.showEditModal = true;
    // TODO: Ouvrir le modal d'édition de ville
    console.log('Éditer ville:', city.name);
  }

  /**
   * Supprimer un pays
   */
  onDeleteCountry(country: AdminCountry): void {
    const dialogRef = this.dialog.open(CountryDeleteModalComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: false,
      data: { country }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        console.log('✅ Pays supprimé:', country.name);

        // Recharger les données
        this.loadData();
      }
    });
  }

  /**
   * Supprimer une ville
   */
  onDeleteCity(city: AdminCity): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la ville "${city.name}" ? Cette action est irréversible.`)) {
      // TODO: Implémenter la suppression
      console.log('Supprimer ville:', city.name);
    }
  }

  /**
   * Fermer les modals
   */
  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedItem = null;
  }

  /**
   * Obtenir le titre du modal selon l'onglet actif
   */
  getModalTitle(): string {
    switch (this.selectedTab) {
      case 'countries': return 'Pays';
      case 'cities': return 'Ville';
      case 'currencies': return 'Devise';
      default: return 'Élément';
    }
  }

  /**
   * Soumettre le formulaire de pays
   */
  onSubmitCountryForm(): void {
    // TODO: Implémenter la création/modification de pays
    console.log('Soumettre formulaire pays');
    this.onCloseModal();
  }

  /**
   * Soumettre le formulaire de ville
   */
  onSubmitCityForm(): void {
    // TODO: Implémenter la création/modification de ville
    console.log('Soumettre formulaire ville');
    this.onCloseModal();
  }

  /**
   * Soumettre le formulaire de devise
   */
  onSubmitCurrencyForm(): void {
    // TODO: Implémenter la création/modification de devise
    console.log('Soumettre formulaire devise');
    this.onCloseModal();
  }

  // ==================== MÉTHODES POUR LES STATISTIQUES RÉELLES ====================

  /**
   * Obtenir le nombre de pays actifs
   */
  getActiveCountriesCount(): number {
    const countries = this.store.selectSnapshot(AdminGeographyState.selectCountries) || [];
    return countries.filter(country => country.isActive).length;
  }

  /**
   * Obtenir le nombre de pays avec des utilisateurs
   */
  getCountriesWithUsersCount(): number {
    const countries = this.store.selectSnapshot(AdminGeographyState.selectCountries) || [];
    return countries.filter(country => (country.userCount || 0) > 0).length;
  }

  /**
   * Obtenir le pourcentage de pays actifs
   */
  getCountriesActivePercentage(): number {
    const countries = this.store.selectSnapshot(AdminGeographyState.selectCountries) || [];
    if (countries.length === 0) return 0;
    return (this.getActiveCountriesCount() / countries.length) * 100;
  }

  /**
   * Obtenir le nombre de villes actives
   */
  getActiveCitiesCount(): number {
    const cities = this.store.selectSnapshot(AdminGeographyState.selectCities) || [];
    return cities.filter(city => city.isActive).length;
  }

  /**
   * Obtenir le nombre de villes avec des propriétés
   */
  getCitiesWithPropertiesCount(): number {
    const cities = this.store.selectSnapshot(AdminGeographyState.selectCities) || [];
    return cities.filter(city => (city.propertyCount || 0) > 0).length;
  }

  /**
   * Obtenir le pourcentage de villes actives
   */
  getCitiesActivePercentage(): number {
    const cities = this.store.selectSnapshot(AdminGeographyState.selectCities) || [];
    if (cities.length === 0) return 0;
    return (this.getActiveCitiesCount() / cities.length) * 100;
  }

  /**
   * Obtenir le nombre total de devises
   */
  getTotalCurrenciesCount(): number {
    // TODO: Implémenter quand le modèle Currency sera disponible
    return 3; // Placeholder
  }

  /**
   * Obtenir le nombre de devises actives
   */
  getActiveCurrenciesCount(): number {
    // TODO: Implémenter quand le modèle Currency sera disponible
    return 2; // Placeholder
  }

  /**
   * Obtenir la devise par défaut
   */
  getDefaultCurrency(): string {
    // TODO: Implémenter quand le modèle Currency sera disponible
    return 'XAF'; // Placeholder
  }

  /**
   * Obtenir le nombre total d'utilisateurs
   */
  getTotalUsers(_filters: any): number {
    // TODO: Implémenter le calcul réel
    return 1250; // Placeholder
  }

  /**
   * Obtenir le nombre total de propriétés
   */
  getTotalProperties(_filters: any): number {
    // TODO: Implémenter le calcul réel
    return 850; // Placeholder
  }

  /**
   * Voir la distribution géographique
   */
  onViewDistribution(): void {
    console.log('Voir distribution géographique');
    // TODO: Ouvrir un modal ou naviguer vers une page de distribution
  }



  /**
   * Toggle du statut d'une ville
   */
  onToggleCityStatus(city: AdminCity): void {
    const action = city.isActive ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} la ville "${city.name}" ?`)) {
      // TODO: Implémenter l'action de toggle
      console.log(`Toggle statut ville: ${city.name}`);
    }
  }

  /**
   * Voir les détails d'une ville
   */
  onViewCityDetails(city: AdminCity): void {
    console.log('Voir détails ville:', city.name);
    // TODO: Ouvrir un modal ou naviguer vers une page de détails
  }

  /**
   * Recherche de pays
   */
  onCountrySearch(event: any): void {
    const searchTerm = event.target.value;
    this.countrySearchTerm = searchTerm;
    // La logique de filtrage se fait via les observables
  }

  /**
   * Recherche de villes
   */
  onCitySearch(event: any): void {
    const searchTerm = event.target.value;
    this.citySearchTerm = searchTerm;
    // La logique de filtrage se fait via les observables
  }

  /**
   * Toggle des filtres de pays
   */
  onToggleCountryFilters(): void {
    this.showCountryFilters = !this.showCountryFilters;
    console.log('Toggle filtres pays:', this.showCountryFilters);
  }



  /**
   * Toggle des filtres de villes
   */
  onToggleCityFilters(): void {
    this.showCityFilters = !this.showCityFilters;
    console.log('Toggle filtres villes:', this.showCityFilters);
  }

  /**
   * Recherche de devises
   */
  onCurrencySearch(event: any): void {
    const searchTerm = event.target.value;
    console.log('Recherche devise:', searchTerm);
    // TODO: Implémenter la recherche
  }

  /**
   * Toggle des filtres de devises
   */
  onToggleCurrencyFilters(): void {
    this.showCurrencyFilters = !this.showCurrencyFilters;
    console.log('Toggle filtres devises:', this.showCurrencyFilters);
  }

  /**
   * Obtenir les données des devises (placeholder)
   */
  getCurrenciesData(): any[] {
    return [
      {
        _id: '1',
        name: 'Franc CFA',
        code: 'XAF',
        symbol: 'FCFA',
        rate: 655.957,
        isActive: true,
        isDefault: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '2',
        name: 'Euro',
        code: 'EUR',
        symbol: '€',
        rate: 1,
        isActive: true,
        isDefault: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: '3',
        name: 'Dollar US',
        code: 'USD',
        symbol: '$',
        rate: 0.85,
        isActive: false,
        isDefault: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
  }

  /**
   * Track by pour les devises
   */
  trackByCurrencyId(_index: number, currency: any): string {
    return currency._id;
  }

  /**
   * Éditer une devise
   */
  onEditCurrency(currency: any): void {
    this.selectedItem = currency;
    this.showEditModal = true;
    console.log('Éditer devise:', currency.name);
  }

  /**
   * Supprimer une devise
   */
  onDeleteCurrency(currency: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la devise "${currency.name}" ? Cette action est irréversible.`)) {
      console.log('Supprimer devise:', currency.name);
    }
  }

  /**
   * Toggle du statut d'une devise
   */
  onToggleCurrencyStatus(currency: any): void {
    const action = currency.isActive ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} la devise "${currency.name}" ?`)) {
      console.log(`Toggle statut devise: ${currency.name}`);
    }
  }

  /**
   * Voir les détails d'une devise
   */
  onViewCurrencyDetails(currency: any): void {
    console.log('Voir détails devise:', currency.name);
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Obtenir une valeur sécurisée d'un pays
   */
  getCountryValue(country: any, field: string): number {
    if (!country || typeof country !== 'object') {
      return 0;
    }

    const value = country[field];

    // Si la valeur est un nombre valide
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    // Si c'est une string qui peut être convertie en nombre
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }

    // Valeur par défaut
    return 0;
  }

  /**
   * Obtenir une valeur sécurisée d'une ville
   */
  getCityValue(city: any, field: string): number {
    if (!city || typeof city !== 'object') {
      return 0;
    }

    const value = city[field];

    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }

    return 0;
  }

  /**
   * Vérifier si une propriété existe et n'est pas undefined/null
   */
  hasValue(obj: any, field: string): boolean {
    return obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '';
  }

  // ==================== NOUVELLES MÉTHODES - GESTION PAR RÉGION ====================

  /**
   * Obtenir le nombre de régions activées
   */
  getActivatedRegionsCount(): number {
    return this.activatedRegions.length;
  }

  /**
   * Track by pour les régions
   */
  trackByRegion(_index: number, region: string): string {
    return region;
  }

  /**
   * Vérifier si une région est activée
   */
  isRegionActivated(region: string): boolean {
    return this.activatedRegions.includes(region);
  }

  /**
   * Vérifier si une région est en cours de chargement
   */
  isRegionLoading(region: string): boolean {
    return this.loadingRegions.has(region);
  }

  /**
   * Obtenir l'icône d'une région
   */
  getRegionIcon(region: string): string {
    const icons = {
      'Africa': 'fa-globe-africa',
      'Americas': 'fa-globe-americas',
      'Asia': 'fa-globe-asia',
      'Europe': 'fa-globe-europe',
      'Oceania': 'fa-water'
    };
    return icons[region] || 'fa-globe';
  }

  /**
   * Obtenir le nom d'affichage d'une région
   */
  getRegionDisplayName(region: string): string {
    const names = {
      'Africa': 'Afrique',
      'Americas': 'Amériques',
      'Asia': 'Asie',
      'Europe': 'Europe',
      'Oceania': 'Océanie'
    };
    return names[region] || region;
  }

  /**
   * Obtenir la description d'une région
   */
  getRegionDescription(region: string): string {
    const descriptions = {
      'Africa': 'Continent africain avec 54 pays',
      'Americas': 'Amérique du Nord et du Sud',
      'Asia': 'Continent asiatique et Moyen-Orient',
      'Europe': 'Continent européen',
      'Oceania': 'Océanie et îles du Pacifique'
    };
    return descriptions[region] || 'Région du monde';
  }

  /**
   * Obtenir les statistiques d'une région
   */
  getRegionStats(region: string): any {
    return this.regionStats[region] || {
      countries: { total: 0, active: 0 },
      cities: 0,
      users: 0
    };
  }

  /**
   * Activer une région
   */
  onActivateRegion(region: string): void {
    console.log(`🌍 Activation de la région: ${region}`);

    this.loadingRegions.add(region);

    // TODO: Appeler le service pour activer la région
    // this.adminGeographyService.activateRegion(region).subscribe({
    //   next: (result) => {
    //     this.activatedRegions.push(region);
    //     this.regionStats[region] = result;
    //     this.loadingRegions.delete(region);
    //     console.log(`✅ Région ${region} activée:`, result);
    //   },
    //   error: (error) => {
    //     this.loadingRegions.delete(region);
    //     console.error(`❌ Erreur activation ${region}:`, error);
    //   }
    // });

    // Simulation pour le moment
    setTimeout(() => {
      this.activatedRegions.push(region);
      this.regionStats[region] = {
        countries: { total: 54, active: 12 },
        cities: 156,
        users: 0
      };
      this.loadingRegions.delete(region);
      console.log(`✅ Région ${region} activée (simulation)`);
    }, 2000);
  }

  /**
   * Gérer une région (voir ses pays)
   */
  onManageRegion(region: string): void {
    console.log(`🔧 Gestion de la région: ${region}`);
    // TODO: Naviguer vers la vue de gestion des pays de cette région
    // ou ouvrir un modal avec la liste des pays
  }

  // ========================================
  // NOUVELLES MÉTHODES POUR LE REDESIGN
  // ========================================

  /**
   * Réinitialiser les filtres des pays
   */
  onResetCountryFilters(): void {
    console.log('🔄 Réinitialisation des filtres pays');
    this.countrySearchTerm = '';
    this.showCountryFilters = false;
    // TODO: Réinitialiser les autres filtres
    this.onRefreshData();
  }

  /**
   * Appliquer les filtres des pays
   */
  onApplyCountryFilters(): void {
    console.log('✅ Application des filtres pays');
    // TODO: Appliquer les filtres sélectionnés
    this.showCountryFilters = false;
  }

  /**
   * Trier les données
   */
  onSort(column: string): void {
    console.log(`📊 Tri par colonne: ${column}`);
    // TODO: Implémenter le tri
  }

  /**
   * Exporter les pays
   */
  onExportCountries(): void {
    console.log('📥 Export des pays');

    this.countries$.pipe(
      take(1)
    ).subscribe((countries: AdminCountry[]) => {
      if (!countries || countries.length === 0) {
        this.toastr.warning('Aucun pays à exporter', 'Export');
        return;
      }

      const columns: ExportColumn[] = [
        { key: 'name', label: 'Nom du pays' },
        { key: 'code', label: 'Code' },
        { key: 'currency', label: 'Devise' },
        { key: 'continent', label: 'Continent' },
        { key: 'region', label: 'Région' },
        { key: 'capital', label: 'Capitale' },
        { key: 'population', label: 'Population', formatter: (value) => value ? new Intl.NumberFormat('fr-FR').format(value) : 'N/A' },
        { key: 'area', label: 'Superficie (km²)', formatter: (value) => value ? new Intl.NumberFormat('fr-FR').format(value) : 'N/A' },
        { key: 'cityCount', label: 'Nombre de villes' },
        { key: 'isActive', label: 'Statut', formatter: (value) => value ? 'Actif' : 'Inactif' },
        { key: 'createdAt', label: 'Date de création', formatter: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A' }
      ];

      this.exportService.exportToExcel({
        filename: 'Pays',
        sheetName: 'Liste des pays',
        columns,
        data: countries
      });
    });
  }

  /**
   * Exporter les villes
   */
  onExportCities(): void {
    console.log('📥 Export des villes');

    this.cities$.pipe(
      take(1)
    ).subscribe((cities: AdminCity[]) => {
      if (!cities || cities.length === 0) {
        this.toastr.warning('Aucune ville à exporter', 'Export');
        return;
      }

      const columns: ExportColumn[] = [
        { key: 'fullName', label: 'Nom de la ville' },
        { key: 'country', label: 'Pays', formatter: (value) => value?.name || 'N/A' },
        { key: 'region', label: 'Région' },
        { key: 'population', label: 'Population', formatter: (value) => value ? new Intl.NumberFormat('fr-FR').format(value) : 'N/A' },
        { key: 'elevation', label: 'Altitude (m)', formatter: (value) => value ? new Intl.NumberFormat('fr-FR').format(value) : 'N/A' },
        { key: 'lat', label: 'Latitude', formatter: (value) => value ? value.toFixed(6) : 'N/A' },
        { key: 'long', label: 'Longitude', formatter: (value) => value ? value.toFixed(6) : 'N/A' },
        { key: 'timezone', label: 'Fuseau horaire' },
        { key: 'isCapital', label: 'Capitale', formatter: (value) => value ? 'Oui' : 'Non' },
        { key: 'isActive', label: 'Statut', formatter: (value) => value ? 'Actif' : 'Inactif' },
        { key: 'createdAt', label: 'Date de création', formatter: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A' }
      ];

      this.exportService.exportToExcel({
        filename: 'Villes',
        sheetName: 'Liste des villes',
        columns,
        data: cities
      });
    });
  }

  /**
   * Créer un nouveau pays
   */
  onCreateCountry(): void {
    console.log('➕ Création d\'un nouveau pays');
    this.selectedTab = 'countries';
    this.onCreateItem();
  }

  /**
   * Créer une nouvelle ville
   */
  onCreateCity(): void {
    console.log('➕ Création d\'une nouvelle ville');
    this.selectedTab = 'cities';
    this.onCreateItem();
  }

  /**
   * Filtrer les villes selon les critères de recherche
   */
  getFilteredCities(cities: AdminCity[]): AdminCity[] {
    if (!cities) return [];

    return cities.filter(city => {
      // Filtre par nom
      const matchesName = !this.citySearchTerm ||
        city.name.toLowerCase().includes(this.citySearchTerm.toLowerCase());

      // Filtre par pays
      const matchesCountry = !this.selectedCountryFilter ||
        (city.country && city.country._id === this.selectedCountryFilter);

      // Filtre par statut
      const matchesStatus = !this.selectedStatusFilter ||
        (this.selectedStatusFilter === 'active' && city.isActive) ||
        (this.selectedStatusFilter === 'inactive' && !city.isActive);

      return matchesName && matchesCountry && matchesStatus;
    });
  }

  /**
   * Voir les détails d'une ville
   */
  onViewCity(city: AdminCity): void {
    console.log('Voir ville:', city.name);
    // TODO: Ouvrir un modal de détails
  }

  /**
   * Importer des villes depuis GeoNames
   */
  onImportCitiesFromGeonames(): void {
    console.log('Importer des villes depuis GeoNames');

    // TODO: Ouvrir un modal de sélection de pays pour l'import
    this.toastr.info(
      'Fonctionnalité d\'import GeoNames en cours de développement',
      'Import GeoNames'
    );
  }

  /**
   * Créer une nouvelle devise
   */
  onCreateCurrency(): void {
    console.log('➕ Création d\'une nouvelle devise');
    this.selectedTab = 'currencies';
    this.onCreateItem();
  }



  /**
   * Exporter les devises
   */
  onExportCurrencies(): void {
    console.log('📥 Export des devises');

    this.currencies$.pipe(
      take(1)
    ).subscribe((currencies: any[]) => {
      if (!currencies || currencies.length === 0) {
        this.toastr.warning('Aucune devise à exporter', 'Export');
        return;
      }

      const columns: ExportColumn[] = [
        { key: 'name', label: 'Nom de la devise' },
        { key: 'code', label: 'Code' },
        { key: 'symbol', label: 'Symbole' },
        { key: 'rate', label: 'Taux de change', formatter: (value) => value ? value.toFixed(4) : 'N/A' },
        { key: 'isDefault', label: 'Devise par défaut', formatter: (value) => value ? 'Oui' : 'Non' },
        { key: 'isActive', label: 'Statut', formatter: (value) => value ? 'Actif' : 'Inactif' },
        { key: 'createdAt', label: 'Date de création', formatter: (value) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A' }
      ];

      this.exportService.exportToExcel({
        filename: 'Devises',
        sheetName: 'Liste des devises',
        columns,
        data: currencies
      });
    });
  }

  /**
   * Réinitialiser les filtres des villes
   */
  onResetCityFilters(): void {
    console.log('🔄 Réinitialisation des filtres villes');
    this.citySearchTerm = '';
    this.showCityFilters = false;
    this.onRefreshData();
  }

  /**
   * Appliquer les filtres des villes
   */
  onApplyCityFilters(): void {
    console.log('✅ Application des filtres villes');
    this.showCityFilters = false;
  }

  /**
   * Réinitialiser les filtres des devises
   */
  onResetCurrencyFilters(): void {
    console.log('🔄 Réinitialisation des filtres devises');
    this.currencySearchTerm = '';
    this.showCurrencyFilters = false;
    this.onRefreshData();
  }

  /**
   * Appliquer les filtres des devises
   */
  onApplyCurrencyFilters(): void {
    console.log('✅ Application des filtres devises');
    this.showCurrencyFilters = false;
  }
}
