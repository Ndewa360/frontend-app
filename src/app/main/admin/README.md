# Module Admin Ndiye

Ce module contient toute l'interface d'administration pour la plateforme Ndiye, permettant aux administrateurs de gérer les utilisateurs, les rôles, les paiements, la géographie et les paramètres système.

## Structure du Module

```
admin/
├── components/
│   └── admin-layout/           # Layout principal de l'admin
├── guards/
│   └── admin.guard.ts          # Guard pour sécuriser l'accès admin
├── models/
│   └── index.ts                # Types et interfaces TypeScript
├── pages/
│   ├── dashboard/              # Tableau de bord admin
│   ├── users/                  # Gestion des utilisateurs
│   ├── roles/                  # Gestion des rôles et permissions
│   ├── geography/              # Gestion des pays et villes
│   ├── payments/               # Gestion des paiements et abonnements
│   └── settings/               # Paramètres système
├── services/
│   ├── admin-users.service.ts      # Service HTTP pour les utilisateurs
│   ├── admin-roles.service.ts      # Service HTTP pour les rôles
│   ├── admin-dashboard.service.ts  # Service HTTP pour le dashboard
│   ├── admin-geography.service.ts  # Service HTTP pour la géographie
│   ├── admin-payments.service.ts   # Service HTTP pour les paiements
│   └── admin-settings.service.ts   # Service HTTP pour les paramètres
└── store/
    ├── users/                  # Store NGXS pour les utilisateurs
    ├── roles/                  # Store NGXS pour les rôles
    ├── dashboard/              # Store NGXS pour le dashboard
    ├── geography/              # Store NGXS pour la géographie
    ├── payments/               # Store NGXS pour les paiements
    └── settings/               # Store NGXS pour les paramètres
```

## Fonctionnalités

### 🏠 Dashboard Admin
- Vue d'ensemble des statistiques système
- Graphiques de croissance des utilisateurs et revenus
- État de santé du système
- Activités récentes
- Actions rapides

### 👥 Gestion des Utilisateurs
- Liste complète des utilisateurs avec filtres avancés
- Création, modification et suppression d'utilisateurs
- Gestion des statuts (actif, inactif, suspendu, banni)
- Assignation de rôles
- Actions en masse
- Export/Import d'utilisateurs
- Réinitialisation de mots de passe

### 🔐 Gestion des Rôles et Permissions
- Création et gestion des rôles personnalisés
- Matrice des permissions
- Assignation de permissions aux rôles
- Visualisation des utilisateurs par rôle
- Protection des rôles système

### 🌍 Gestion Géographique
- Gestion des pays et devises
- Gestion des villes par pays
- Statistiques géographiques
- Import/Export de données géographiques

### 💳 Gestion des Paiements
- Vue d'ensemble des paiements et revenus
- Gestion des abonnements utilisateurs
- Création et gestion des coupons de réduction
- Statistiques financières détaillées
- Traitement des paiements en attente

### ⚙️ Paramètres Système
- Configuration générale de l'application
- Paramètres email et notifications
- Configuration des fournisseurs de paiement
- Paramètres de sécurité
- Gestion des sauvegardes
- Maintenance système

## Architecture Technique

### Store Pattern (NGXS)
Chaque module utilise le pattern NGXS avec :
- **Actions** : Définissent les actions possibles
- **State** : Gère l'état des données
- **Selectors** : Permettent de sélectionner des données spécifiques

### Services HTTP
Services TypeScript avec gestion d'erreurs intégrée pour communiquer avec l'API backend.

### Modèles TypeScript
Interfaces et types stricts pour assurer la cohérence des données.

### Design System
Utilisation de Carbon Design System d'IBM pour une interface cohérente et professionnelle.

## Sécurité

### Guard Admin
Le `AdminGuard` vérifie :
- L'authentification de l'utilisateur
- Les permissions d'administration
- Redirection automatique si non autorisé

### Permissions
Système de permissions granulaire basé sur :
- Rôles utilisateur
- Permissions spécifiques par module
- Actions autorisées (create, read, update, delete)

## Utilisation

### Accès à l'Administration
```
/admin/dashboard    - Tableau de bord
/admin/users        - Gestion des utilisateurs
/admin/roles        - Rôles et permissions
/admin/geography    - Géographie
/admin/payments     - Paiements
/admin/settings     - Paramètres
```

### Intégration dans l'Application
```typescript
// Dans app-routing.module.ts
{
  path: 'admin',
  loadChildren: () => import('./main/admin/admin.module').then(m => m.AdminModule),
  canActivate: [UserJwtAuthGuard, AdminGuard]
}
```

## Développement

### Ajout d'une Nouvelle Page Admin
1. Créer le composant dans `pages/`
2. Ajouter le service HTTP dans `services/`
3. Créer le store NGXS dans `store/`
4. Ajouter la route dans `admin-routing.module.ts`
5. Mettre à jour la navigation dans `admin-layout.component.ts`

### Ajout d'une Nouvelle Permission
1. Définir la permission dans les modèles
2. Ajouter la vérification dans le guard
3. Implémenter la logique côté backend
4. Tester l'accès avec différents rôles

## Tests

### Tests Unitaires
```bash
ng test --include="**/admin/**/*.spec.ts"
```

### Tests E2E
```bash
ng e2e --suite=admin
```

## Déploiement

Le module admin est automatiquement inclus dans le build de production avec lazy loading pour optimiser les performances.

## Maintenance

### Logs et Monitoring
- Logs d'activité admin dans le dashboard
- Monitoring des performances système
- Alertes automatiques en cas de problème

### Sauvegardes
- Sauvegarde automatique des données
- Export des configurations
- Restauration en cas de problème
