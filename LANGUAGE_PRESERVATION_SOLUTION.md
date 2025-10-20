# Solution de Préservation de la Langue lors de la Déconnexion

## Problème Identifié
Lorsque l'utilisateur se déconnecte ou est déconnecté automatiquement par inactivité, la langue sélectionnée n'était pas préservée et les messages de notification n'étaient pas affichés dans la bonne langue.

## Solution Implémentée

### 1. Service Centralisé de Préservation de Langue
**Fichier créé :** `src/app/shared/services/language-preservation.service.ts`

Ce service centralise :
- La préservation de la langue dans le localStorage
- La récupération de la langue préservée
- La gestion des messages localisés avec fallback
- Le nettoyage de la langue préservée

### 2. Modifications des Services de Déconnexion

#### RefreshTokenService
**Fichier modifié :** `src/app/shared/store/auth-token/refresh-token.service.ts`
- Préserve la langue avant chaque déconnexion forcée
- Utilise les messages localisés pour les notifications
- Gère tous les cas : inactivité critique, échec de refresh, etc.

#### DisconnectionService
**Fichier modifié :** `src/app/shared/store/user-profile/disconnection.service.ts`
- Préserve la langue lors de la déconnexion manuelle
- Utilise le service centralisé

#### AuthTokenState
**Fichier modifié :** `src/app/shared/store/auth-token/auth-token.state.ts`
- Préserve la langue lors de l'action de logout

### 3. Amélioration du Service de Traduction
**Fichier modifié :** `src/app/shared/services/localization/translation.service.ts`
- Priorise la langue préservée lors de l'initialisation
- Vérifie d'abord la langue préservée après déconnexion

## Fonctionnalités Ajoutées

### Messages de Fallback Multilingues
Le service fournit des messages de fallback en français, anglais et espagnol pour :
- `NOTIFICATIONS.SESSION_EXPIRED`
- `NOTIFICATIONS.SERVER_ERROR`
- `NOTIFICATIONS.NETWORK_ERROR`
- `COMMON.INFO`
- `COMMON.ERROR`
- `COMMON.WARNING`

### Ordre de Priorité des Langues
1. Langue du profil utilisateur (si connecté)
2. **Langue préservée après déconnexion** (NOUVEAU)
3. Langue sauvegardée dans localStorage
4. Langue du navigateur
5. Français par défaut

## Cas d'Usage Couverts

✅ **Déconnexion manuelle** : L'utilisateur clique sur "Se déconnecter"
✅ **Déconnexion par inactivité** : Session expirée par manque d'activité
✅ **Déconnexion par token expiré** : Échec du rafraîchissement de token
✅ **Déconnexion par erreur serveur** : Problème de connexion ou serveur
✅ **Déconnexion critique** : Inactivité prolongée

## Avantages

1. **Cohérence linguistique** : Les messages de déconnexion sont toujours dans la langue de l'utilisateur
2. **Expérience utilisateur améliorée** : Pas de changement de langue inattendu
3. **Code centralisé** : Un seul service gère toute la logique de préservation
4. **Fallback robuste** : Messages disponibles même si le service de traduction échoue
5. **Compatibilité** : Fonctionne avec tous les types de déconnexion

## Tests Recommandés

1. Changer la langue puis se déconnecter manuellement
2. Changer la langue puis attendre l'expiration de session
3. Changer la langue puis simuler une perte de connexion
4. Vérifier que la langue est restaurée à la reconnexion
5. Tester avec différentes langues (FR, EN, ES)

## Notes Techniques

- La langue est stockée dans `localStorage` avec la clé `ndiye-preferred-language`
- Le service est injecté dans tous les services de déconnexion
- Les messages de fallback sont intégrés pour éviter les dépendances externes
- La solution est compatible avec l'architecture NGXS existante