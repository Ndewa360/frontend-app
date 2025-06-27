# 🧪 Guide de Test du Système de Refresh Token

## ✅ Erreurs Corrigées

### Backend
- ❌ **Erreur** : Duplicate function implementation dans `auth.controller.ts`
- ✅ **Solution** : Suppression de l'ancienne méthode `logout` (DELETE) et conservation de la nouvelle (POST)

### Frontend  
- ❌ **Erreur** : Duplicate function implementation dans `auth.service.ts`
- ✅ **Solution** : Suppression de la méthode `logout` async vide et conservation de la méthode qui retourne Observable
- ❌ **Erreur** : Duplicate ActivatedRoute dans `auth-login.component.ts`
- ✅ **Solution** : Suppression de la duplication dans le constructeur

## 🚀 Tests à Effectuer

### 1. Test de Compilation

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend-v2
ng build
```

### 2. Test de Démarrage

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Frontend (Terminal 2)  
cd frontend-v2
ng serve
```

### 3. Tests Fonctionnels

#### A. Test de Connexion Normale
1. Aller sur `http://localhost:4200/auth/signin`
2. Se connecter avec des identifiants valides
3. Vérifier la redirection vers `/app/properties`
4. Vérifier dans la console : `🟢 UserActivityService: Surveillance démarrée`

#### B. Test de Refresh Automatique
1. Se connecter et rester actif
2. Ouvrir les DevTools → Console
3. Attendre ~5 minutes avant l'expiration du token
4. Vérifier les logs : `🔄 Rafraîchissement du token en cours...`
5. Vérifier : `✅ Token rafraîchi avec succès`

#### C. Test d'Inactivité (15 minutes)
1. Se connecter
2. Rester inactif pendant 15 minutes
3. Essayer de naviguer ou faire une action
4. Vérifier la redirection vers `/auth/signin?returnUrl=...`
5. Se reconnecter et vérifier le retour à la page d'origine

#### D. Test d'Inactivité Critique (30 minutes)
1. Se connecter
2. Rester inactif pendant 30 minutes
3. Vérifier la déconnexion automatique
4. Vérifier le message : "Vous avez été déconnecté pour cause d'inactivité prolongée"

#### E. Test de Déconnexion Manuelle
1. Se connecter
2. Cliquer sur "Déconnexion"
3. Vérifier l'appel à `POST /user/auth/logout`
4. Vérifier la redirection vers la page de connexion

### 4. Tests de l'API Backend

#### Test de l'endpoint de déconnexion
```bash
# 1. Se connecter pour obtenir un token
curl -X POST http://localhost:3000/user/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Utiliser le token pour se déconnecter
curl -X POST http://localhost:3000/user/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test de refresh token
```bash
# Utiliser le refresh token
curl -X GET http://localhost:3000/user/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

## 🔍 Points de Vérification

### Console Frontend
- `🟢 UserActivityService: Surveillance démarrée`
- `🔄 État d'activité changé: ACTIVE/INACTIVE/CRITICAL_INACTIVE`
- `🔄 Rafraîchissement du token en cours...`
- `✅ Token rafraîchi avec succès`
- `🟡 Utilisateur inactif - refresh automatique suspendu`
- `🔴 Inactivité critique - déconnexion forcée`

### Console Backend
- Logs de validation des tokens
- Logs de refresh réussis/échoués
- Logs de déconnexion

### Network Tab (DevTools)
- Requêtes automatiques vers `/user/auth/refresh`
- Requêtes vers `/user/auth/logout` lors de la déconnexion
- Headers Authorization correctement ajoutés

## 🐛 Dépannage

### Problèmes Courants

1. **Token non rafraîchi**
   - Vérifier que l'utilisateur est actif
   - Vérifier les logs de console
   - Vérifier la connectivité réseau

2. **Déconnexion inattendue**
   - Vérifier les seuils d'inactivité (15/30 minutes)
   - Vérifier les logs d'activité utilisateur

3. **Erreurs de compilation**
   - Vérifier les imports manquants
   - Vérifier les duplications de méthodes

4. **Redirection incorrecte**
   - Vérifier les paramètres `returnUrl`
   - Vérifier la logique de redirection dans `auth-login.component.ts`

## 📊 Métriques à Surveiller

- Temps de réponse des refresh tokens
- Fréquence des déconnexions pour inactivité
- Taux de succès des refresh automatiques
- Temps moyen d'inactivité avant déconnexion

## ✅ Checklist de Validation

- [ ] Compilation backend sans erreur
- [ ] Compilation frontend sans erreur
- [ ] Démarrage des deux applications
- [ ] Connexion utilisateur fonctionnelle
- [ ] Surveillance d'activité démarrée
- [ ] Refresh automatique avant expiration
- [ ] Gestion de l'inactivité (15 min)
- [ ] Déconnexion automatique (30 min)
- [ ] Redirection avec returnUrl
- [ ] Déconnexion manuelle
- [ ] Nettoyage des tokens côté backend

## 🎯 Prochaines Étapes

1. **Tests en Production** : Déployer sur un environnement de test
2. **Monitoring** : Ajouter des métriques de surveillance
3. **Optimisation** : Ajuster les seuils selon l'usage réel
4. **Documentation** : Mettre à jour la documentation utilisateur
