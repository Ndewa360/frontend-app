# 🔄 Système de Refresh Token Automatique avec Détection d'Activité

## 📋 Vue d'ensemble

Ce système implémente une gestion automatique et intelligente des tokens d'authentification avec détection d'activité utilisateur pour l'application Ndewa360.

## 🎯 Fonctionnalités

### ✅ Refresh Automatique
- **Refresh préventif** : Le token est rafraîchi automatiquement 5 minutes avant son expiration
- **Refresh basé sur l'activité** : Le refresh ne se fait que si l'utilisateur est actif
- **Gestion des erreurs** : Retry automatique et gestion des échecs de refresh

### 👤 Détection d'Activité Utilisateur
- **États d'activité** :
  - `ACTIVE` : Utilisateur actif (< 15 minutes d'inactivité)
  - `INACTIVE` : Utilisateur inactif (15-30 minutes d'inactivité)
  - `CRITICAL_INACTIVE` : Inactivité critique (> 30 minutes)

- **Événements surveillés** :
  - Clics de souris
  - Saisie clavier
  - Défilement
  - Focus de fenêtre
  - Touches tactiles (mobile)

### 🔐 Sécurité Renforcée
- **Validation côté backend** : Vérification de l'expiration et du type de token
- **Nettoyage automatique** : Suppression des refresh tokens lors de la déconnexion
- **Protection contre les attaques** : Validation stricte des tokens

## 🏗️ Architecture

### Frontend (Angular/Ionic)

#### Services Principaux
1. **`UserActivityService`** : Détection et surveillance de l'activité utilisateur
2. **`RefreshTokenService`** : Gestion du refresh automatique des tokens
3. **`AdvancedAuthGuard`** : Guard avancé pour la protection des routes

#### States NGXS
- **`AuthTokenState`** : Gestion des tokens et états d'activité
- **`UserProfileState`** : Gestion du profil utilisateur et surveillance

#### Intercepteurs
- **`AuthTokenInterceptor`** : Gestion automatique des tokens dans les requêtes HTTP

### Backend (NestJS)

#### Améliorations
- **Validation des tokens** : Vérification du type et de l'expiration
- **Endpoint de déconnexion** : `POST /user/auth/logout` pour nettoyer les refresh tokens
- **Sécurité renforcée** : Gestion des erreurs et validation stricte

## 🚀 Utilisation

### Configuration de Base

```typescript
// Démarrage automatique lors de la connexion
this.userActivityService.startMonitoring({
  inactivityTimeout: 15 * 60 * 1000,      // 15 minutes
  criticalInactivityTimeout: 30 * 60 * 1000, // 30 minutes
  checkInterval: 60 * 1000,                // 1 minute
  debounceTime: 1000                       // 1 seconde
});
```

### Surveillance d'Activité

```typescript
// Écouter les changements d'état
this.userActivityService.getActivityState().subscribe(state => {
  switch (state) {
    case UserActivityState.ACTIVE:
      console.log('Utilisateur actif');
      break;
    case UserActivityState.INACTIVE:
      console.log('Utilisateur inactif');
      break;
    case UserActivityState.CRITICAL_INACTIVE:
      console.log('Inactivité critique - déconnexion');
      break;
  }
});
```

### Protection des Routes

```typescript
// Utilisation du guard avancé
{
  path: 'protected',
  component: ProtectedComponent,
  canActivate: [AdvancedAuthGuard]
}
```

## 🔄 Flux de Fonctionnement

### 1. Connexion Utilisateur
1. L'utilisateur se connecte
2. Les tokens sont stockés
3. La surveillance d'activité démarre automatiquement
4. Le refresh automatique est configuré

### 2. Activité Normale
1. L'utilisateur interagit avec l'application
2. L'activité est détectée et enregistrée
3. Le token est rafraîchi automatiquement avant expiration
4. L'utilisateur continue sans interruption

### 3. Inactivité
1. Aucune activité détectée pendant 15 minutes
2. L'état passe à `INACTIVE`
3. Le refresh automatique est suspendu
4. L'utilisateur doit se reconnecter pour continuer

### 4. Inactivité Critique
1. Aucune activité pendant 30 minutes
2. L'état passe à `CRITICAL_INACTIVE`
3. Déconnexion automatique forcée
4. Redirection vers la page de connexion

### 5. Reconnexion
1. L'utilisateur est redirigé vers `/auth/signin?returnUrl=...`
2. Après reconnexion, redirection vers la page d'origine
3. La surveillance d'activité redémarre

## 🛡️ Sécurité

### Côté Frontend
- Validation de l'état d'activité avant refresh
- Gestion des timeouts et retry
- Nettoyage automatique des ressources
- Protection contre les fuites mémoire

### Côté Backend
- Validation stricte des refresh tokens
- Vérification du type de token (access vs refresh)
- Nettoyage des tokens lors de la déconnexion
- Gestion des erreurs d'expiration

## 🧪 Tests

### Tests Unitaires
```bash
# Exécuter les tests du service d'activité
ng test --include="**/user-activity.service.spec.ts"

# Exécuter tous les tests d'authentification
ng test --include="**/auth-token/**/*.spec.ts"
```

### Tests d'Intégration
1. **Test de refresh automatique** : Vérifier le refresh avant expiration
2. **Test d'inactivité** : Simuler l'inactivité et vérifier la déconnexion
3. **Test de reconnexion** : Vérifier la redirection après reconnexion
4. **Test de nettoyage** : Vérifier le nettoyage lors de la déconnexion

## 📊 Monitoring et Logs

### Logs Frontend
- `🟢 UserActivityService: Surveillance démarrée`
- `🔄 État d'activité changé: ACTIVE/INACTIVE/CRITICAL_INACTIVE`
- `🔄 Rafraîchissement du token en cours...`
- `✅ Token rafraîchi avec succès`
- `🔴 Inactivité critique - déconnexion forcée`

### Logs Backend
- Validation des tokens
- Tentatives de refresh
- Déconnexions et nettoyage

## 🔧 Configuration Avancée

### Personnalisation des Seuils
```typescript
const customConfig = {
  inactivityTimeout: 10 * 60 * 1000,      // 10 minutes
  criticalInactivityTimeout: 20 * 60 * 1000, // 20 minutes
  checkInterval: 30 * 1000,                // 30 secondes
  debounceTime: 500                        // 500ms
};

userActivityService.updateConfig(customConfig);
```

### Variables d'Environnement Backend
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=3600s
JWT_REFRESH_EXPIRES_IN=7d
```

## 🚨 Dépannage

### Problèmes Courants
1. **Token non rafraîchi** : Vérifier l'état d'activité utilisateur
2. **Déconnexion inattendue** : Vérifier les seuils d'inactivité
3. **Erreurs de refresh** : Vérifier la connectivité réseau
4. **Redirection incorrecte** : Vérifier les paramètres returnUrl

### Debug
```typescript
// Activer les logs détaillés
console.log('État d\'activité:', userActivityService.getActivityState());
console.log('Configuration:', userActivityService.getConfig());
console.log('Token expiration:', refreshTokenService.getTokenExpiration());
```

## 📝 Notes de Version

### v2.0.0 - Système de Refresh Token Automatique
- ✅ Détection d'activité utilisateur
- ✅ Refresh automatique basé sur l'activité
- ✅ Guard de session avancé
- ✅ Sécurité renforcée côté backend
- ✅ Gestion de la reconnexion avec returnUrl
- ✅ Tests unitaires et documentation
