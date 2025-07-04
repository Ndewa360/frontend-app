# Module de Recherche Moderne - Ndiye

## 🎯 Vue d'ensemble

Le module de recherche moderne offre une expérience utilisateur exceptionnelle pour la recherche de logements avec une interface redesignée selon les couleurs et le design system de l'application Ndiye.

## 🚀 Fonctionnalités

### ✨ Interface Utilisateur Moderne
- **Barre de recherche intelligente** avec suggestions en temps réel
- **Filtres rapides** pour les équipements populaires
- **Filtres avancés** avec interface intuitive
- **Vue grille/liste** commutable
- **Recherches populaires** suggérées
- **Design responsive** optimisé mobile

### 🔍 Recherche Avancée
- **Recherche par ville** avec géolocalisation
- **Filtres de prix** avec plage personnalisable
- **Types de logement** (Chambre, Studio, Appartement)
- **Équipements** (Cuisine, Douche privée, Parking)
- **Tri intelligent** (Prix, Date, Superficie)
- **Pagination optimisée** avec chargement progressif

### 🎨 Design System
- **Couleurs cohérentes** avec la charte graphique Ndiye
- **Variables CSS Carbon** pour la cohérence
- **Animations fluides** et transitions
- **États de chargement** avec skeletons
- **Feedback visuel** pour toutes les interactions

## 📁 Structure des Fichiers

```
src/app/main/search/
├── components/
│   └── modern-search/
│       ├── modern-search.component.ts      # Logique principale
│       ├── modern-search.component.html    # Template HTML
│       └── modern-search.component.scss    # Styles SCSS
├── search-routing.module.ts                # Routes du module
├── search.module.ts                        # Configuration du module
└── README.md                              # Documentation
```

## 🔧 Configuration Backend

### API Endpoints Améliorés

#### Recherche Simple
```typescript
GET /search/by-city/:cityId?page=1&limit=12
```

#### Recherche Avancée
```typescript
GET /search/advanced?city=xxx&priceMin=0&priceMax=500000&roomType=STUDIO&hasKitchen=true&sortBy=price&sortOrder=asc&page=1&limit=12
```

### Filtres Supportés
- `city`: ID de la ville
- `priceMin/priceMax`: Plage de prix
- `roomType`: Type de logement
- `minArea`: Superficie minimum
- `hasKitchen`: Cuisine équipée
- `hasPrivateShower`: Douche privée
- `hasParking`: Parking disponible
- `sortBy`: Critère de tri (price, createdAt, area)
- `sortOrder`: Ordre (asc, desc)

## 🎨 Couleurs et Thème

### Palette Principale
```scss
// Couleur primaire Ndiye
--carbon-primary-60: rgb(204, 140, 10);

// Couleurs d'interface
--carbon-background: #ffffff;
--carbon-layer-01: #ffffff;
--carbon-layer-02: #f8f9fa;
--carbon-text-primary: #161616;
--carbon-text-secondary: #525252;
```

### États Interactifs
```scss
// Hover
--carbon-layer-hover-01: #e0e0e0;
--carbon-primary-70: #b8a009;

// Focus
--carbon-focus: var(--carbon-primary-60);
--carbon-border-interactive: var(--carbon-primary-60);
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptations Mobile
- Barre de recherche verticale
- Filtres en plein écran
- Grille à une colonne
- Navigation tactile optimisée

## 🔍 Utilisation

### Navigation
```typescript
// Accès à la recherche moderne
/search/index

// Versions alternatives
/search/redesigned  // Version précédente
/search/legacy      // Version originale
```

### Intégration dans l'Application
```typescript
// Dans un composant
this.router.navigate(['/search/index'], {
  queryParams: {
    city: 'cityId',
    search: 'terme de recherche'
  }
});
```

## 🛠️ Développement

### Installation des Dépendances
```bash
cd frontend-v2
npm install
```

### Démarrage en Développement
```bash
npm start
# L'application sera accessible sur http://localhost:4200
```

### Tests
```bash
# Tests unitaires
npm test

# Tests e2e
npm run e2e
```

## 🔧 Configuration

### Variables d'Environnement
```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:3001',
  // ...autres configurations
};
```

### Services Utilisés
- `SearchService`: Appels API de recherche
- `CityState`: Gestion des villes (NGXS)
- `SearchState`: État de recherche (NGXS)
- `PlateformService`: Services de plateforme

## 🎯 Optimisations

### Performance
- **Debouncing** sur la recherche (300ms)
- **Pagination** avec chargement progressif
- **Lazy loading** des images
- **Memoization** des résultats

### SEO
- **URLs sémantiques** avec paramètres
- **Meta tags** dynamiques
- **Structured data** pour les résultats
- **Sitemap** automatique

### Accessibilité
- **ARIA labels** sur tous les éléments
- **Navigation clavier** complète
- **Contraste** conforme WCAG 2.1
- **Screen readers** supportés

## 🚀 Déploiement

### Build de Production
```bash
npm run build
# Les fichiers seront dans dist/
```

### Variables de Production
```bash
NODE_ENV=production
API_URL=https://api.ndewa-360.com
```

## 📊 Métriques

### Performance Cible
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### Analytics
- **Recherches populaires** trackées
- **Taux de conversion** mesuré
- **Temps de session** analysé
- **Parcours utilisateur** optimisé

## 🔮 Roadmap

### Prochaines Fonctionnalités
- [ ] **Recherche vocale** avec Web Speech API
- [ ] **Géolocalisation** automatique
- [ ] **Favoris** et recherches sauvegardées
- [ ] **Notifications** de nouveaux logements
- [ ] **Comparateur** de logements
- [ ] **Réalité augmentée** pour les visites

### Améliorations Techniques
- [ ] **Service Worker** pour le cache
- [ ] **PWA** avec installation
- [ ] **WebP** pour les images
- [ ] **CDN** pour les assets statiques

## 🤝 Contribution

### Guidelines
1. Respecter le design system Carbon
2. Utiliser les couleurs de la charte Ndiye
3. Tester sur mobile et desktop
4. Documenter les nouvelles fonctionnalités
5. Suivre les conventions TypeScript/Angular

### Code Review
- Performance et optimisation
- Accessibilité et UX
- Cohérence du design
- Tests et documentation

---

**Développé avec ❤️ pour Ndiye - Votre plateforme de gestion immobilière moderne**
