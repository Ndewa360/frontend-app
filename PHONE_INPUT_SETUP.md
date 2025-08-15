# Installation du composant téléphone international

## 1. Installation du package
```bash
npm install ngx-intl-tel-input --save
npm install intl-tel-input --save
npm install google-libphonenumber --save
```

## 2. Import dans le module
```typescript
// app.module.ts ou user-profile.module.ts
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';

@NgModule({
  imports: [
    NgxIntlTelInputModule
  ]
})
```

## 3. CSS dans angular.json
```json
"styles": [
  "node_modules/intl-tel-input/build/css/intlTelInput.css"
]
```

## 4. Utilisation dans le template
```html
<ngx-intl-tel-input
  [cssClass]="'field-input'"
  [preferredCountries]="['cm', 'fr', 'us']"
  [enableAutoCountrySelect]="true"
  [enablePlaceholder]="true"
  [searchCountryFlag]="true"
  [searchCountryField]="[SearchCountryField.Iso2, SearchCountryField.Name]"
  [selectFirstCountry]="false"
  [selectedCountryISO]="CountryISO.Cameroon"
  [maxLength]="15"
  [phoneValidation]="true"
  [inputId]="'phone'"
  name="phone"
  formControlName="phoneNumber">
</ngx-intl-tel-input>
```

## 5. Validation
```typescript
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';

// Dans le FormBuilder
phoneNumber: ['', [Validators.required]]

// Validation personnalisée
phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value) {
      const phoneNumber = control.value;
      if (phoneNumber.internationalNumber && phoneNumber.number) {
        return null; // Valide
      }
    }
    return { invalidPhone: true };
  };
}
```