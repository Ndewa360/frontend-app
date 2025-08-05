# 👨‍💻 GUIDE DÉVELOPPEUR - Page Géographie Redesignée

## 🚀 **DÉMARRAGE RAPIDE**

### **Installation et Configuration**
```bash
# Aucune installation supplémentaire requise
# Le redesign utilise le design system existant
```

### **Structure des Fichiers**
```
geography/
├── admin-geography.component.html     # Template redesigné
├── admin-geography.component.scss     # Styles modernes
├── admin-geography.component.ts       # Logique métier
├── REDESIGN_PROFESSIONNEL.md         # Documentation
└── GUIDE_DEVELOPPEUR.md              # Ce guide
```

---

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **Composant Principal**
```typescript
@Component({
  selector: 'app-admin-geography',
  templateUrl: './admin-geography.component.html',
  styleUrls: [
    './admin-geography.component.scss',
    '../../styles/admin-design-system.scss'
  ]
})
export class AdminGeographyComponent implements OnInit, OnDestroy
```

### **Observables et State Management**
```typescript
// Observables principaux
countries$ = this.store.select(AdminGeographyState.selectCountries);
cities$ = this.store.select(AdminGeographyState.selectCities);
currencies$ = this.store.select(AdminGeographyState.selectCurrencies);
stats$ = this.store.select(AdminGeographyState.selectStats);
isLoading$ = this.store.select(AdminGeographyState.selectIsLoading);

// Observables filtrés
filteredCountries$ = this.countries$;
filteredCities$ = this.cities$;
filteredCurrencies$ = this.currencies$;
```

---

## 🎨 **UTILISATION DU DESIGN SYSTEM**

### **Variables CSS Disponibles**
```scss
// Couleurs spécifiques géographie
--geography-primary: var(--ndiye-primary);
--countries-color: #6366f1;
--cities-color: #10b981;
--currencies-color: #f59e0b;
--users-color: #3b82f6;

// Espacements système 8pt
--admin-spacing-xs: 0.25rem;   // 4px
--admin-spacing-sm: 0.5rem;    // 8px
--admin-spacing-md: 1rem;      // 16px
--admin-spacing-lg: 1.5rem;    // 24px
--admin-spacing-xl: 2rem;      // 32px
```

### **Classes CSS Principales**
```scss
// Layout
.geography-admin-page          // Container principal
.page-header                   // En-tête de page
.metrics-section              // Section métriques
.content-navigation           // Navigation onglets
.content-main                 // Contenu principal

// Composants
.metric-card                  // Carte métrique
.action-btn                   // Bouton d'action
.nav-tab                      // Onglet navigation
.data-table                   // Tableau de données
.filter-panel                 // Panneau filtres
```

---

## 🔧 **MÉTHODES PRINCIPALES**

### **Navigation et Onglets**
```typescript
// Changer d'onglet
onTabChange(tab: string): void {
  this.selectedTab = tab;
  console.log(`📋 Changement d'onglet: ${tab}`);
}

// Actualiser les données
onRefreshData(): void {
  this.isRefreshing = true;
  this.store.dispatch(new AdminGeographyAction.LoadAll());
}
```

### **Recherche et Filtres**
```typescript
// Recherche pays
onCountrySearch(event: any): void {
  const term = event.target.value;
  this.countrySearchTerm = term;
  // TODO: Implémenter la logique de filtrage
}

// Toggle filtres
onToggleCountryFilters(): void {
  this.showCountryFilters = !this.showCountryFilters;
}

// Réinitialiser filtres
onResetCountryFilters(): void {
  this.countrySearchTerm = '';
  this.showCountryFilters = false;
  this.onRefreshData();
}
```

### **Actions CRUD**
```typescript
// Créer un élément
onCreateItem(): void {
  this.showCreateModal = true;
  this.selectedItem = null;
}

// Modifier un élément
onEditCountry(country: AdminCountry): void {
  this.selectedItem = country;
  this.showEditModal = true;
}

// Supprimer un élément
onDeleteCountry(country: AdminCountry): void {
  // TODO: Confirmation et suppression
}
```

---

## 📊 **GESTION DES DONNÉES**

### **Structure des Modèles**
```typescript
interface AdminCountry {
  id: string;
  name: string;
  code: string;
  currency?: string;
  currencySymbol?: string;
  cityCount?: number;
  userCount?: number;
  isActive: boolean;
}

interface AdminCity {
  id: string;
  name: string;
  country?: AdminCountry;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  propertyCount?: number;
  isActive: boolean;
}
```

### **Gestion des Stats**
```typescript
interface GeographyStats {
  countries: {
    total: number;
    active: number;
  };
  cities: {
    total: number;
    active: number;
  };
  currencies: {
    total: number;
    active: number;
  };
  distribution: {
    usersByCountry: any[];
  };
}
```

---

## 🎯 **BONNES PRATIQUES**

### **Performance**
```typescript
// Utiliser trackBy pour les listes
trackByCountryId(index: number, country: AdminCountry): string {
  return country.id;
}

// Optimiser les observables
private destroy$ = new Subject<void>();

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### **Accessibilité**
```html
<!-- Labels appropriés -->
<label for="country-search" class="sr-only">Rechercher un pays</label>
<input id="country-search" type="text" class="search-input">

<!-- ARIA attributes -->
<button 
  class="action-btn-sm delete" 
  (click)="onDeleteCountry(country)"
  [attr.aria-label]="'Supprimer ' + country.name">
  <i class="fas fa-trash"></i>
</button>
```

### **Responsive Design**
```scss
// Mobile-first approach
.metric-card {
  // Styles de base pour mobile
  
  @media (min-width: 768px) {
    // Styles pour tablette
  }
  
  @media (min-width: 1024px) {
    // Styles pour desktop
  }
}
```

---

## 🧪 **TESTS**

### **Tests Unitaires**
```typescript
describe('AdminGeographyComponent', () => {
  let component: AdminGeographyComponent;
  let fixture: ComponentFixture<AdminGeographyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminGeographyComponent],
      imports: [NgxsModule.forRoot([AdminGeographyState])]
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change tab', () => {
    component.onTabChange('cities');
    expect(component.selectedTab).toBe('cities');
  });
});
```

### **Tests E2E**
```typescript
describe('Geography Admin Page', () => {
  it('should display metrics cards', () => {
    cy.visit('/admin/geography');
    cy.get('.metric-card').should('have.length', 4);
  });

  it('should filter countries', () => {
    cy.get('.search-input').type('France');
    cy.get('.table-row').should('contain', 'France');
  });
});
```

---

## 🔄 **INTÉGRATION CONTINUE**

### **Linting et Formatting**
```bash
# Vérifier le code
npm run lint

# Formater le code
npm run format

# Tests
npm run test
npm run test:e2e
```

### **Build et Déploiement**
```bash
# Build de production
npm run build --prod

# Analyse du bundle
npm run analyze
```

---

## 🐛 **DEBUGGING**

### **Console Logs**
```typescript
// Logs structurés pour le debugging
console.log('🌍 Géographie - Initialisation');
console.log('📊 Stats chargées:', stats);
console.log('🔍 Recherche:', this.countrySearchTerm);
```

### **DevTools Angular**
```bash
# Installer Angular DevTools
# Inspecter le state NgXS
# Profiler les performances
```

---

## 📚 **RESSOURCES**

### **Documentation**
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [NgXS Documentation](https://www.ngxs.io/)
- [SCSS Best Practices](https://sass-lang.com/guide)

### **Design System**
- Variables CSS dans `admin-design-system.scss`
- Composants réutilisables
- Guidelines d'accessibilité

### **Support**
- Issues GitHub pour les bugs
- Documentation interne
- Code reviews obligatoires
