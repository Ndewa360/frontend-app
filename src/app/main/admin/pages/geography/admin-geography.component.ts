import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Store } from '@ngxs/store';

// Actions
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';

// States
import { AdminGeographyState } from '../../store/geography/admin-geography.state';

// Models
import { AdminCountry, AdminCity } from '../../store/geography/admin-geography.model';

@Component({
  selector: 'app-admin-geography',
  templateUrl: './admin-geography.component.html',
  styleUrls: ['./admin-geography.component.scss']
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

  // Search and filters
  countrySearchTerm = '';
  citySearchTerm = '';
  currencySearchTerm = '';
  showCountryFilters = false;
  showCityFilters = false;
  showCurrencyFilters = false;

  // Filtered observables
  filteredCountries$ = this.countries$;
  filteredCities$ = this.cities$;
  filteredCurrencies$ = this.currencies$;

  constructor(private store: Store) {}

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
      new AdminGeographyAction.LoadCities()
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
    this.showCreateModal = true;
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
    // TODO: Ouvrir un modal ou naviguer vers une page de détails
    console.log('Voir détails pays:', country.name);
  }

  // ==================== MÉTHODES DE CRÉATION ====================

  /**
   * Créer un nouveau pays
   */
  onCreateCountry(): void {
    console.log('onCreateCountry appelée');
    this.selectedItem = null;
    this.showCreateModal = true;
    console.log('showCreateModal:', this.showCreateModal);
    console.log('selectedTab:', this.selectedTab);
  }

  /**
   * Créer une nouvelle ville
   */
  onCreateCity(): void {
    this.selectedItem = null;
    this.showCreateModal = true;
    // TODO: Ouvrir le modal de création de ville
    console.log('Créer une nouvelle ville');
  }

  /**
   * Créer une nouvelle devise
   */
  onCreateCurrency(): void {
    this.selectedItem = null;
    this.showCreateModal = true;
    // TODO: Ouvrir le modal de création de devise
    console.log('Créer une nouvelle devise');
  }

  /**
   * Éditer un pays
   */
  onEditCountry(country: AdminCountry): void {
    this.selectedItem = country;
    this.showEditModal = true;
    // TODO: Ouvrir le modal d'édition de pays
    console.log('Éditer pays:', country.name);
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le pays "${country.name}" ? Cette action est irréversible.`)) {
      // TODO: Implémenter la suppression
      console.log('Supprimer pays:', country.name);
    }
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
    console.log('Recherche pays:', searchTerm);
    // TODO: Implémenter la recherche
  }

  /**
   * Toggle des filtres de pays
   */
  onToggleCountryFilters(): void {
    this.showCountryFilters = !this.showCountryFilters;
    console.log('Toggle filtres pays:', this.showCountryFilters);
  }

  /**
   * Recherche de villes
   */
  onCitySearch(event: any): void {
    const searchTerm = event.target.value;
    console.log('Recherche ville:', searchTerm);
    // TODO: Implémenter la recherche
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
}
