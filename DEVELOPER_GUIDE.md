# Guide Développeur - Composants Modernes

## Structure des Composants

### 1. PropertyDetailsCompleteComponent

#### Utilisation
```typescript
// Route: /app/properties/details/:id
// Sélecteur: <app-property-details-complete>
```

#### Propriétés d'entrée
```typescript
// Aucune propriété d'entrée - utilise des données simulées
```

#### Méthodes principales
- `setActiveTab(tabId: string)` - Change l'onglet actif
- `getPropertyStatus()` - Retourne le statut de la propriété
- `onEditProperty()` - Action d'édition
- `onAddTenant()` - Action d'ajout de locataire

### 2. PropertyUnitsComponent

#### Utilisation
```html
<app-property-units 
  [propertyId]="propertyId"
  [units]="units">
</app-property-units>
```

#### Propriétés d'entrée
```typescript
@Input() propertyId: string = '';
@Input() units: Unit[] = [];
```

#### Méthodes principales
- `filterUnits()` - Filtre les unités
- `addUnit()` - Ajoute une nouvelle unité
- `editUnit(unit)` - Édite une unité
- `deleteUnit(unit)` - Supprime une unité

### 3. PropertyTenantsComponent

#### Utilisation
```html
<app-property-tenants 
  [propertyId]="propertyId"
  [tenants]="tenants">
</app-property-tenants>
```

#### Propriétés d'entrée
```typescript
@Input() propertyId: string = '';
@Input() tenants: Tenant[] = [];
```

#### Méthodes principales
- `filterTenants()` - Filtre les locataires
- `addTenant()` - Ajoute un nouveau locataire
- `renewLease(tenant)` - Renouvelle un bail
- `terminateLease(tenant)` - Résilie un bail

### 4. PropertyHistoryComponent

#### Utilisation
```html
<app-property-history 
  [propertyId]="propertyId"
  [history]="history">
</app-property-history>
```

#### Propriétés d'entrée
```typescript
@Input() propertyId: string = '';
@Input() history: HistoryItem[] = [];
```

#### Méthodes principales
- `filterHistory()` - Filtre l'historique
- `exportHistory()` - Exporte l'historique

### 5. PropertyFinancesComponent

#### Utilisation
```html
<app-property-finances 
  [propertyId]="propertyId"
  [finances]="finances">
</app-property-finances>
```

#### Propriétés d'entrée
```typescript
@Input() propertyId: string = '';
@Input() finances: FinanceData | null = null;
```

#### Méthodes principales
- `updatePeriod()` - Met à jour la période
- `generateReport()` - Génère un rapport
- `exportFinances()` - Exporte les données

### 6. AdvancedSearchFiltersComponent

#### Utilisation
```html
<app-advanced-search-filters
  [initialFilters]="currentFilters"
  [resultCount]="resultCount"
  [canSaveSearch]="true"
  (filtersChanged)="onFiltersChanged($event)"
  (searchRequested)="onSearchRequested($event)"
  (saveSearchRequested)="onSaveSearch($event)"
  (resetRequested)="onResetFilters()">
</app-advanced-search-filters>
```

#### Propriétés d'entrée
```typescript
@Input() initialFilters?: SearchFilters;
@Input() resultCount: number = 0;
@Input() canSaveSearch: boolean = false;
```

#### Événements de sortie
```typescript
@Output() filtersChanged = new EventEmitter<SearchFilters>();
@Output() searchRequested = new EventEmitter<SearchFilters>();
@Output() saveSearchRequested = new EventEmitter<SearchFilters>();
@Output() resetRequested = new EventEmitter<void>();
```

## Interfaces TypeScript

### SearchFilters
```typescript
interface SearchFilters {
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  rooms?: number;
  amenities?: string[];
  preferences?: string[];
}
```

### Unit
```typescript
interface Unit {
  id: string;
  name: string;
  type: string;
  surface: number;
  price: number;
  status: 'occupied' | 'available' | 'maintenance';
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}
```

### Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'expired';
}
```

### HistoryItem
```typescript
interface HistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'maintenance' | 'tenant_move_in' | 'tenant_move_out' | 'contract_renewal';
  description: string;
  amount?: number;
  unitId?: string;
  tenantId?: string;
}
```

### FinanceData
```typescript
interface FinanceData {
  monthlyRevenue: number;
  yearlyRevenue: number;
  expenses: number;
  netIncome: number;
  revenueHistory: { month: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}
```

## Styles et Thèmes

### Classes CSS Principales
- `.property-details-complete` - Container principal
- `.metric-card` - Cartes de métriques
- `.tab-button` - Boutons d'onglets
- `.status-badge` - Badges de statut
- `.action-button` - Boutons d'action

### Animations
- `fadeIn` - Animation d'apparition
- `slideUp` - Animation de glissement vers le haut
- `slideInUp` - Animation combinée

### Responsive Design
- Breakpoints Tailwind CSS standard
- Optimisé pour mobile, tablette et desktop
- Grilles adaptatives

## Bonnes Pratiques

### 1. Gestion des Données
```typescript
// Utiliser des observables pour les données réactives
@Select(PropertyState.selectProperty) property$: Observable<Property>;

// Implémenter OnDestroy pour nettoyer les subscriptions
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 2. Gestion des Erreurs
```typescript
// Gérer les erreurs dans les templates
<div *ngIf="error" class="error-message">
  {{ error }}
</div>

// Gérer les états de chargement
<div *ngIf="loading" class="loading-spinner">
  Chargement...
</div>
```

### 3. Performance
```typescript
// Utiliser trackBy pour les listes
trackByUnitId(index: number, unit: Unit): string {
  return unit.id;
}

// Utiliser OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 4. Accessibilité
```html
<!-- Ajouter des labels appropriés -->
<button aria-label="Modifier l'unité" (click)="editUnit(unit)">
  <svg>...</svg>
</button>

<!-- Utiliser des rôles ARIA -->
<div role="tablist">
  <button role="tab" [attr.aria-selected]="activeTab === 'overview'">
    Vue d'ensemble
  </button>
</div>
```

## Débogage

### 1. Erreurs Communes
- **Template errors** : Vérifier les propriétés et méthodes dans les templates
- **Module errors** : S'assurer que tous les composants sont déclarés
- **Import errors** : Vérifier les chemins d'import

### 2. Outils de Débogage
- Angular DevTools
- Redux DevTools (pour NGXS)
- Console du navigateur

### 3. Tests
```typescript
// Test unitaire basique
describe('PropertyUnitsComponent', () => {
  let component: PropertyUnitsComponent;
  let fixture: ComponentFixture<PropertyUnitsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PropertyUnitsComponent]
    });
    fixture = TestBed.createComponent(PropertyUnitsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```
