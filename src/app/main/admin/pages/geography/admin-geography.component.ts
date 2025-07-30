import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

  constructor(private store: Store) {}

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

  onRefreshData(): void {
    this.store.dispatch(new AdminGeographyAction.RefreshData());
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedItem = null;
  }

  onItemCreated(): void {
    this.onCloseModal();
    this.loadData();
  }

  onItemUpdated(): void {
    this.onCloseModal();
    this.loadData();
  }

  trackByCountryId(index: number, country: AdminCountry): string {
    return country._id;
  }

  trackByCityId(index: number, city: AdminCity): string {
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
}
