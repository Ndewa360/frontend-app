# Améliorations des Redirections avec Gestion de Langue

## Problème Résolu
Les URLs de redirection après connexion et déconnexion ne tenaient pas compte de la langue sélectionnée par l'utilisateur, causant des incohérences dans l'expérience utilisateur.

## Solutions Implémentées

### 1. Service de Préservation de Langue Étendu
**Fichier modifié :** `src/app/shared/services/language-preservation.service.ts`

**Nouvelles méthodes ajoutées :**
- `getCurrentOrPreservedLanguage()` : Obtient la langue actuelle ou préservée
- `buildUrlWithLanguage(path, language?)` : Génère une URL avec la langue appropriée
- `navigateWithLanguage(path, queryParams?)` : Navigue vers une URL avec la langue
- `redirectToLogin(returnUrl?)` : Redirection vers la connexion avec langue
- `redirectToHome()` : Redirection vers l'accueil avec langue

### 2. Services de Déconnexion Mis à Jour

#### RefreshTokenService
**Fichier modifié :** `src/app/shared/store/auth-token/refresh-token.service.ts`
- Utilise `redirectToLogin()` au lieu de `router.navigateByUrl()`
- Préserve les paramètres de requête (reason, returnUrl)
- Assure la cohérence linguistique dans toutes les déconnexions automatiques

#### UserProfileState
**Fichier modifié :** `src/app/shared/store/user-profile/user-profile.state.ts`
- Redirections avec langue pour les erreurs 401
- Gestion conditionnelle des redirections selon le contexte

### 3. Composants d'Interface Mis à Jour

#### HeaderComponent
**Fichier modifié :** `src/app/layout/header/header/header.component.ts`
- Préserve la langue avant déconnexion manuelle
- Utilise `redirectToLogin()` après déconnexion réussie

#### AuthLoginComponent
**Fichier modifié :** `src/app/auth/auth-login/auth-login.component.ts`
- Toutes les redirections après connexion utilisent `buildUrlWithLanguage()`
- Gestion des redirections pour tous les types d'utilisateurs :
  - Utilisateurs normaux → `/app/properties/home`
  - Agents → Selon le statut du profil
  - Admins → `/app/properties/home`
- Redirections sécurisées avec validation des URLs de retour

## Cas d'Usage Couverts

### Déconnexions Automatiques
✅ **Session expirée** : Redirige vers `/[lang]/auth/signin?returnUrl=...`
✅ **Inactivité critique** : Redirige vers `/[lang]/auth/signin?returnUrl=...&reason=inactive`
✅ **Token expiré** : Redirige vers `/[lang]/auth/signin?returnUrl=...&reason=token_expired`
✅ **Erreur serveur** : Redirige vers `/[lang]/auth/signin?returnUrl=...`

### Déconnexions Manuelles
✅ **Bouton logout** : Redirige vers `/[lang]/auth/signin`
✅ **Préservation langue** : Maintient la langue sélectionnée

### Connexions Réussies
✅ **Utilisateur normal** : Redirige vers `/[lang]/app/properties/home`
✅ **Agent incomplet** : Redirige vers `/[lang]/app/agent/complete-profile`
✅ **Agent en attente** : Redirige vers `/[lang]/app/agent/pending-approval`
✅ **Agent approuvé** : Redirige vers `/[lang]/app/properties/home`
✅ **Admin** : Redirige vers `/[lang]/app/properties/home`
✅ **Compte inactif** : Redirige vers `/[lang]/auth/confirmation/[email]`

### URLs de Retour
✅ **Validation sécurisée** : Vérifie que l'URL appartient au même domaine
✅ **Préservation paramètres** : Maintient les paramètres de requête
✅ **Fallback intelligent** : Redirection par défaut si URL invalide

## Avantages

1. **Cohérence linguistique** : Toutes les redirections respectent la langue utilisateur
2. **Expérience fluide** : Pas de changement de langue inattendu
3. **Sécurité renforcée** : Validation des URLs de retour
4. **Maintenance simplifiée** : Logique centralisée dans un service
5. **Compatibilité totale** : Fonctionne avec l'architecture existante

## Paramètres de Requête Supportés

- `returnUrl` : URL de retour après connexion
- `reason` : Raison de la déconnexion (inactive, token_expired, etc.)
- Tous les paramètres personnalisés sont préservés

## Format des URLs Générées

```
/[langue]/[chemin]?[paramètres]

Exemples :
- /fr/auth/signin?returnUrl=%2Ffr%2Fapp%2Fproperties
- /en/app/properties/home
- /es/auth/confirmation/user@example.com
```

## Tests Recommandés

1. **Déconnexion manuelle** : Vérifier la langue dans l'URL de redirection
2. **Session expirée** : Confirmer la préservation de la langue et returnUrl
3. **Connexion réussie** : Tester tous les types d'utilisateurs
4. **Changement de langue** : Vérifier la persistance après déconnexion/reconnexion
5. **URLs de retour** : Tester avec des URLs valides et invalides
6. **Navigation directe** : Accéder directement aux pages avec différentes langues

## Notes Techniques

- Compatible avec le système de routage Angular existant
- Utilise le localStorage pour la persistance de langue
- Validation côté client des URLs de retour pour la sécurité
- Gestion gracieuse des erreurs de navigation
- Support des paramètres de requête complexes