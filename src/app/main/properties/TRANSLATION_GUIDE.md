# Guide de Traduction - Composants Détails de Propriété

## Vue d'ensemble

Ce guide explique comment utiliser le système de traduction pour les composants des détails de propriété dans l'application Ndewa360°.

## Structure des Traductions

### Fichiers de traduction
- `src/assets/i18n/fr.json` - Traductions françaises
- `src/assets/i18n/en.json` - Traductions anglaises

### Clés de traduction organisées par section

```json
{
  "PROPERTY_DETAILS": {
    "NAVIGATION": { ... },
    "ACTIONS": { ... },
    "TABS": { ... },
    "UNITS": { ... },
    "TENANTS": { ... },
    "OVERVIEW": { ... }
  }
}
```

## Utilisation dans les Templates

### 1. Texte simple
```html
<h2>{{ 'PROPERTY_DETAILS.UNITS.TITLE' | translate }}</h2>
```

### 2. Placeholder d'input
```html
<input [placeholder]="'PROPERTY_DETAILS.UNITS.SEARCH_PLACEHOLDER' | translate">
```

### 3. Texte conditionnel
```html
{{ property.location ?? ('PROPERTY_DETAILS.NAVIGATION.ADDRESS_NOT_SPECIFIED' | translate) }}
```

### 4. Avec paramètres
```html
{{ 'PROPERTY_DETAILS.UNITS.UNIT_COUNT' | translate: {count: unitCount} }}
```

## Utilisation dans les Composants TypeScript

### 1. Service de traduction
```typescript
import { PropertyDetailsTranslationService } from '../services/property-details-translation.service';

constructor(private translationService: PropertyDetailsTranslationService) {}

// Traduction instantanée
getStatusLabel(status: string): string {
  const statusLabels = this.translationService.getUnitStatusTranslations();
  const translationKey = statusLabels[status];
  return translationKey ? this.translationService.instant(translationKey) : status;
}

// Traduction observable
getTranslatedText(key: string): Observable<string> {
  return this.translationService.translate(key);
}
```

### 2. Méthodes utilitaires
```typescript
// Dans le composant property-details-complete
getTabLabel(tabId: string): string {
  return `PROPERTY_DETAILS.TABS.${tabId.toUpperCase()}`;
}
```

## Bonnes Pratiques

### 1. Nommage des clés
- Utilisez une hiérarchie claire : `SECTION.SUBSECTION.ELEMENT`
- Utilisez des noms descriptifs en UPPER_CASE
- Groupez les traductions par fonctionnalité

### 2. Organisation
```json
{
  "PROPERTY_DETAILS": {
    "UNITS": {
      "TITLE": "Unités Locatives",
      "ACTIONS": {
        "ADD": "Ajouter",
        "EDIT": "Modifier",
        "DELETE": "Supprimer"
      },
      "STATUS": {
        "AVAILABLE": "Disponible",
        "OCCUPIED": "Occupé"
      }
    }
  }
}
```

### 3. Gestion des pluriels
```json
{
  "UNIT_COUNT": "{{count}} unité",
  "UNIT_COUNT_PLURAL": "{{count}} unités"
}
```

### 4. Textes par défaut
```typescript
// Toujours prévoir un fallback
getLabel(key: string): string {
  return this.translationService.instant(key) || 'Texte par défaut';
}
```

## Composants Traduits

### ✅ Composants avec traductions complètes
- `property-details-complete.component`
- `property-overview.component` (partiel)
- `property-units-list.component` (partiel)
- `property-tenants.component` (partiel)

### 🔄 Composants à traduire
- `property-history.component`
- `property-finances.component`
- `modern-unit-modal.component`
- `modern-tenant-modal.component`
- `modern-payment-modal.component`

## Ajout de Nouvelles Traductions

### 1. Ajouter dans les fichiers JSON
```json
// fr.json
{
  "PROPERTY_DETAILS": {
    "NEW_SECTION": {
      "NEW_KEY": "Nouveau texte en français"
    }
  }
}

// en.json
{
  "PROPERTY_DETAILS": {
    "NEW_SECTION": {
      "NEW_KEY": "New text in English"
    }
  }
}
```

### 2. Utiliser dans le template
```html
<span>{{ 'PROPERTY_DETAILS.NEW_SECTION.NEW_KEY' | translate }}</span>
```

### 3. Ajouter au service si nécessaire
```typescript
// property-details-translation.service.ts
getNewSectionTranslations(): { [key: string]: string } {
  return {
    'new_key': 'PROPERTY_DETAILS.NEW_SECTION.NEW_KEY'
  };
}
```

## Tests

### Vérifier les traductions
```typescript
// Dans les tests unitaires
it('should display translated text', () => {
  const translatedText = component.translationService.instant('PROPERTY_DETAILS.UNITS.TITLE');
  expect(translatedText).toBe('Unités Locatives');
});
```

## Dépannage

### Problèmes courants
1. **Clé non trouvée** : Vérifiez l'orthographe et la hiérarchie
2. **Traduction non mise à jour** : Redémarrez le serveur de développement
3. **Caractères spéciaux** : Utilisez l'échappement JSON approprié

### Debug
```typescript
// Afficher la clé si la traduction échoue
{{ 'PROPERTY_DETAILS.UNITS.TITLE' | translate || 'PROPERTY_DETAILS.UNITS.TITLE' }}
```

## Ressources

- [Documentation ngx-translate](https://github.com/ngx-translate/core)
- [Service de localisation](../../../shared/services/localization/localization.service.ts)
- [Service de traduction](../../../shared/services/localization/translation.service.ts)