# Système de Loader Basé sur les Données

## Problème résolu

**Avant** : Le loader global disparaissait dès que la navigation était terminée (`NavigationEnd`), laissant une page blanche pendant que les composants chargeaient leurs données.

**Après** : Le loader reste affiché jusqu'à ce que toutes les données requises pour la page soient effectivement chargées.

## Architecture

### **DataDrivenLoaderService**

Service principal qui gère le loader basé sur l'état réel des données :

```typescript
interface PageLoadingState {
  route: string;
  isLoading: boolean;
  requiredData: string[];
  loadedData: string[];
  message?: string;
  progress?: number;
}
```

### **Configuration des routes**

Chaque route peut avoir sa configuration de données requises :

```typescript
private routeConfigs = {
  '/app/properties': {
    route: '/app/properties',
    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'],
    customMessage: 'Chargement de vos propriétés...',
    minLoadingTime: 800
  },
  '/app/properties/details': {
    route: '/app/properties/details',
    requiredStores: [
      'userprofile.initLoadingState', 
      'properties.initLoadingState',
      'rooms.initLoadingState',
      'locataires.initLoadingState',
      'locations.initLoadingState'
    ],
    customMessage: 'Chargement des détails de la propriété...',
    minLoadingTime: 1000
  }
};
```

## Flux de fonctionnement

### **1. Navigation détectée**
```
🔄 Utilisateur navigue vers /app/properties
📋 Configuration trouvée : requiert [userprofile, properties]
🚀 Démarrage du chargement basé sur les données
```

### **2. Observation des stores**
```
📊 Observer userprofile.initLoadingState
📊 Observer properties.initLoadingState
⏳ Attendre que tous passent à 'LOADED'
```

### **3. Progression en temps réel**
```
✅ userprofile.initLoadingState = 'LOADED' (50%)
⏳ properties.initLoadingState = 'LOADING' (50%)
📊 Message: "Chargement de vos propriétés... 50%"
```

### **4. Completion**
```
✅ properties.initLoadingState = 'LOADED' (100%)
⏱️ Respect du temps minimum (800ms)
🎉 Masquage du loader global
```

## Utilisation

### **1. Configuration automatique**

Le service détecte automatiquement les routes configurées et démarre le chargement approprié.

### **2. Observation automatique des stores**

Le service observe automatiquement les stores configurés :

```typescript
// Le service observe automatiquement ces stores
private observeRequiredStores(config: DataLoadingConfig): void {
  const storeObservables = config.requiredStores.map(storePath =>
    this.store.select(state => this.getNestedProperty(state, storePath))
  );

  combineLatest(storeObservables).subscribe(states => {
    // Détection automatique quand les stores passent à 'LOADED'
    const allLoaded = states.every(state => state === 'LOADED');
    if (allLoaded) {
      this.completeDataDrivenLoading(config);
    }
  });
}
```

### **3. Marquage manuel (optionnel)**

Pour des cas spéciaux, marquage manuel possible :

```typescript
// Seulement si nécessaire pour des cas particuliers
this.dataDrivenLoader.markDataLoaded('customData.initLoadingState');
```

### **3. Configuration dynamique**

Ajouter des configurations de route à la volée :

```typescript
this.dataDrivenLoader.addRouteConfig({
  route: '/custom-page',
  requiredStores: ['customData.initLoadingState'],
  customMessage: 'Chargement des données personnalisées...',
  minLoadingTime: 600
});
```

## Composant de Debug

Le composant `DataLoaderDebugComponent` affiche en temps réel :

- ✅ **Route actuelle**
- ✅ **État de chargement** (en cours/terminé)
- ✅ **Progression** (pourcentage)
- ✅ **Message actuel**
- ✅ **Liste des données requises** avec statut individuel
- ✅ **Barre de progression visuelle**

### **Activation**

Le composant de debug s'affiche automatiquement en mode développement :

```html
<!-- Data Loader Debug (only in development) -->
<app-data-loader-debug *ngIf="!isProduction"></app-data-loader-debug>
```

## Avantages

### **✅ Expérience utilisateur améliorée**
- Pas de page blanche
- Loader affiché tant que nécessaire
- Messages de progression informatifs

### **✅ Flexibilité**
- Configuration par route
- Temps minimum personnalisable
- Messages personnalisés

### **✅ Performance**
- Observation efficace des stores
- Masquage automatique du loader
- Gestion des erreurs

### **✅ Debug facile**
- Composant de debug intégré
- Logs détaillés
- Visualisation en temps réel

## Configuration des routes

### **Routes principales configurées**

| Route | Données requises | Message | Temps min |
|-------|------------------|---------|-----------|
| `/app/properties` | userprofile, properties | "Chargement de vos propriétés..." | 800ms |
| `/app/properties/details` | userprofile, properties, rooms, locataires, locations | "Chargement des détails..." | 1000ms |
| `/app/search` | userprofile, countries | "Chargement de la recherche..." | 600ms |
| `/admin` | userprofile | "Chargement de l'administration..." | 500ms |

### **Ajout de nouvelles routes**

Pour ajouter une nouvelle route :

1. **Identifier les données requises** pour la page
2. **Ajouter la configuration** dans `routeConfigs`
3. **Tester** avec le composant de debug

```typescript
'/nouvelle-route': {
  route: '/nouvelle-route',
  requiredStores: ['store1.initLoadingState', 'store2.initLoadingState'],
  customMessage: 'Chargement de la nouvelle page...',
  minLoadingTime: 700
}
```

## Migration depuis l'ancien système

### **Avant (problématique)**
```typescript
// app.component.ts
this.router.events.subscribe(event => {
  if (event instanceof NavigationEnd) {
    // ❌ Masquer le loader immédiatement
    this.hideLoader();
  }
});
```

### **Après (solution)**
```typescript
// app.component.ts
constructor(private dataDrivenLoader: DataDrivenLoaderService) {}

// Le service gère automatiquement le loader basé sur les données
this.dataDrivenLoader.globalLoaderVisible$.subscribe(isVisible => {
  if (!isVisible) {
    // ✅ Loader masqué seulement quand les données sont chargées
    this.appLoaded = true;
  }
});
```

## Tests et validation

### **Scénarios de test**

1. **Navigation normale** : Loader affiché jusqu'au chargement complet
2. **Navigation rapide** : Respect du temps minimum
3. **Erreur de chargement** : Masquage gracieux du loader
4. **Route non configurée** : Fallback vers comportement par défaut

### **Métriques à surveiller**

- ✅ **Temps d'affichage** du premier contenu
- ✅ **Durée du loader** par route
- ✅ **Taux d'erreur** de chargement
- ✅ **Expérience utilisateur** (pas de page blanche)

Le nouveau système garantit une expérience utilisateur fluide en s'assurant que le loader reste affiché jusqu'à ce que la page soit réellement prête à être utilisée !
