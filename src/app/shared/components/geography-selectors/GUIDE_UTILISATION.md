# 🌍🏙️ GUIDE D'UTILISATION DES SÉLECTEURS GÉOGRAPHIQUES

## ✅ **COMPOSANTS CRÉÉS**

### **1. CountrySelectorComponent** 🌍
Sélecteur de pays avec drapeau et autocomplétion

### **2. CitySelectorComponent** 🏙️
Sélecteur de ville avec filtrage par pays

### **3. CountryCitySelectorComponent** 🌍🏙️
Composant combiné pays + ville

---

## 🚀 **INSTALLATION ET IMPORT**

### **1. Importer le module dans votre module**
```typescript
import { GeographySelectorsModule } from '@shared/components/geography-selectors';

@NgModule({
  imports: [
    // ... autres imports
    GeographySelectorsModule
  ]
})
export class VotreModule { }
```

### **2. Importer les types si nécessaire**
```typescript
import { 
  CountryModel, 
  CityModel, 
  CountryCityValue 
} from '@shared/components/geography-selectors';
```

---

## 📝 **UTILISATION DANS LES FORMULAIRES**

### **1. Sélecteur de Pays Simple**
```html
<!-- Template -->
<div class="form-group">
  <label class="form-label required">Pays</label>
  <app-country-selector
    formControlName="country"
    placeholder="Sélectionner un pays"
    [required]="true"
    [showFlag]="true"
    [showCode]="true"
    (countrySelected)="onCountrySelected($event)">
  </app-country-selector>
</div>
```

```typescript
// Component
export class VotreComponent {
  formGroup = this.fb.group({
    country: [null, Validators.required]
  });

  onCountrySelected(country: CountryModel): void {
    console.log('Pays sélectionné:', country);
  }
}
```

### **2. Sélecteur de Ville Simple**
```html
<!-- Template -->
<div class="form-group">
  <label class="form-label required">Ville</label>
  <app-city-selector
    formControlName="city"
    placeholder="Sélectionner une ville"
    [required]="true"
    [countryFilter]="selectedCountry"
    [showRegion]="true"
    [showPopulation]="false"
    (citySelected)="onCitySelected($event)">
  </app-city-selector>
</div>
```

### **3. Composant Combiné Pays + Ville**
```html
<!-- Template -->
<div class="form-group">
  <app-country-city-selector
    formControlName="location"
    countryPlaceholder="Sélectionner un pays"
    cityPlaceholder="Sélectionner une ville"
    [countryRequired]="true"
    [cityRequired]="true"
    [layout]="'horizontal'"
    [showCountryFlag]="true"
    [showCityRegion]="true"
    (selectionChanged)="onLocationChanged($event)">
  </app-country-city-selector>
</div>
```

```typescript
// Component
export class VotreComponent {
  formGroup = this.fb.group({
    location: [null, Validators.required]
  });

  onLocationChanged(location: CountryCityValue): void {
    console.log('Localisation:', location);
    // location.country: CountryModel | null
    // location.city: CityModel | null
  }
}
```

---

## 🔄 **GESTION DES VALEURS PRÉSÉLECTIONNÉES**

### **1. Mode Création (Valeurs par défaut)**
```typescript
// Présélectionner un pays par défaut
export class CreatePropertyComponent {
  formGroup = this.fb.group({
    country: [null],
    city: [null]
  });

  ngOnInit(): void {
    // Présélectionner le Cameroun par exemple
    this.formGroup.patchValue({
      country: { _id: 'cameroon-id', fullName: 'Cameroun', flag: '🇨🇲' }
    });
  }
}
```

### **2. Mode Mise à Jour (Valeurs existantes)**
```typescript
// Charger les valeurs existantes
export class UpdatePropertyComponent {
  @Input() property: PropertyModel;

  formGroup = this.fb.group({
    location: [null]
  });

  ngOnInit(): void {
    // Charger les valeurs existantes
    if (this.property) {
      this.formGroup.patchValue({
        location: {
          country: this.property.geolocationCountry,
          city: this.property.geolocationCity
        }
      });
    }
  }
}
```

### **3. Avec IDs de présélection**
```html
<!-- Utiliser les IDs pour la présélection -->
<app-country-city-selector
  formControlName="location"
  [preselectedCountryId]="property?.geolocationCountry?._id"
  [preselectedCityId]="property?.geolocationCity?._id">
</app-country-city-selector>
```

---

## ⚙️ **PROPRIÉTÉS ET OPTIONS**

### **CountrySelectorComponent**
```typescript
@Input() placeholder: string = 'Sélectionner un pays';
@Input() disabled: boolean = false;
@Input() required: boolean = false;
@Input() showFlag: boolean = true;
@Input() showCode: boolean = true;
@Input() preselectedCountryId: string | null = null;

@Output() countrySelected = new EventEmitter<CountryModel>();
@Output() countryCleared = new EventEmitter<void>();
```

### **CitySelectorComponent**
```typescript
@Input() placeholder: string = 'Sélectionner une ville';
@Input() disabled: boolean = false;
@Input() required: boolean = false;
@Input() countryFilter: CountryModel | null = null;
@Input() preselectedCityId: string | null = null;
@Input() showRegion: boolean = true;
@Input() showPopulation: boolean = false;

@Output() citySelected = new EventEmitter<CityModel>();
@Output() cityCleared = new EventEmitter<void>();
```

### **CountryCitySelectorComponent**
```typescript
@Input() countryPlaceholder: string = 'Sélectionner un pays';
@Input() cityPlaceholder: string = 'Sélectionner une ville';
@Input() disabled: boolean = false;
@Input() countryRequired: boolean = true;
@Input() cityRequired: boolean = true;
@Input() layout: 'horizontal' | 'vertical' = 'horizontal';
@Input() showCountryFlag: boolean = true;
@Input() showCountryCode: boolean = true;
@Input() showCityRegion: boolean = true;
@Input() showCityPopulation: boolean = false;

@Output() countrySelected = new EventEmitter<CountryModel>();
@Output() citySelected = new EventEmitter<CityModel>();
@Output() selectionChanged = new EventEmitter<CountryCityValue>();
```

---

## 🎨 **PERSONNALISATION DU STYLE**

### **Variables CSS personnalisables**
```scss
// Dans votre fichier de styles
.country-selector {
  --selector-border-color: #e0e0e0;
  --selector-focus-color: #0f62fe;
  --selector-background: #ffffff;
  --selector-text-color: #161616;
  --selector-placeholder-color: #a8a8a8;
}
```

### **Classes CSS disponibles**
- `.country-selector.disabled` - État désactivé
- `.country-selector.required` - Champ obligatoire
- `.city-selector.disabled` - État désactivé
- `.country-city-selector.layout-vertical` - Layout vertical
- `.country-city-selector.layout-horizontal` - Layout horizontal

---

## 🔧 **EXEMPLES COMPLETS**

### **Remplacement dans AddPropertyComponent**
```html
<!-- AVANT (avec ibm-combo-box) -->
<div class="form-group">
  <label class="form-label required">Pays</label>
  <ibm-combo-box
    [items]="countriesList"
    formControlName="geolocationCountry"
    placeholder="Sélectionner un pays">
    <ibm-dropdown-list></ibm-dropdown-list>
  </ibm-combo-box>
</div>

<!-- APRÈS (avec notre composant) -->
<div class="form-group">
  <label class="form-label required">Localisation</label>
  <app-country-city-selector
    formControlName="geolocation"
    [countryRequired]="true"
    [cityRequired]="true"
    [layout]="'horizontal'">
  </app-country-city-selector>
</div>
```

### **Remplacement dans UpdatePropertyComponent**
```typescript
// AVANT
ngOnInit(): void {
  this.formGroup.patchValue({
    geolocationCountry: {
      content: currentCountry.fullName,
      valueType: currentCountry._id
    },
    geolocationCity: {
      content: currentCity.fullName,
      valueType: currentCity._id
    }
  });
}

// APRÈS
ngOnInit(): void {
  this.formGroup.patchValue({
    geolocation: {
      country: this.property.geolocationCountry,
      city: this.property.geolocationCity
    }
  });
}
```

---

## 🚀 **AVANTAGES DES NOUVEAUX COMPOSANTS**

✅ **Autocomplétion native** - Recherche en temps réel  
✅ **Drapeaux des pays** - Interface visuelle améliorée  
✅ **Gestion automatique des stores** - Pas besoin de gérer manuellement  
✅ **Validation intégrée** - Messages d'erreur automatiques  
✅ **Responsive design** - Adapté mobile et desktop  
✅ **Performance optimisée** - TrackBy functions et OnPush  
✅ **Accessibilité** - Support clavier et lecteurs d'écran  
✅ **Type safety** - TypeScript complet  

---

## 📋 **CHECKLIST DE MIGRATION**

- [ ] Importer `GeographySelectorsModule` dans vos modules
- [ ] Remplacer les `ibm-combo-box` par les nouveaux composants
- [ ] Adapter la structure des FormControls
- [ ] Tester les valeurs présélectionnées en mode update
- [ ] Vérifier la validation des formulaires
- [ ] Tester l'autocomplétion et la recherche
- [ ] Valider le design responsive

Le système est maintenant prêt à être utilisé ! 🎉
