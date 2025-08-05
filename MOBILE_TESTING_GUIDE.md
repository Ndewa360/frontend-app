# 📱 **GUIDE DE TEST MOBILE - NDIYE**

## **🚀 Configuration Rapide**

### **Étape 1 : Configuration Automatique**
```bash
# Configurer automatiquement l'environnement mobile
npm run setup-mobile

# OU démarrer directement en mode mobile
npm run mobile-dev
```

### **Étape 2 : Démarrage Manuel**
```bash
# 1. Démarrer le backend sur votre IP locale
# Assurez-vous que votre serveur backend écoute sur http://192.168.1.5:3001

# 2. Démarrer le frontend Angular
npm start

# 3. L'application sera accessible sur http://192.168.1.5:4200
```

---

## **📱 Test sur Téléphone Android**

### **Méthode 1 : Navigateur Mobile (Recommandée pour le développement)**

1. **Connectez votre téléphone au même WiFi** que votre PC
2. **Ouvrez Chrome** sur votre téléphone Android
3. **Allez sur** : `http://192.168.1.5:4200/mobile/search`
4. **Activez les DevTools** : Chrome → Menu → Plus d'outils → Outils de développement

### **Méthode 2 : Application Native (Pour les tests avancés)**

```bash
# 1. Build l'application
npm run build

# 2. Synchroniser avec Capacitor
npx cap sync android

# 3. Ouvrir dans Android Studio
npx cap open android

# 4. Ou lancer directement avec live reload
npx cap run android -l --external
```

---

## **🔧 Debugging Mobile**

### **Chrome DevTools pour Mobile**
1. **Sur PC** : Ouvrez Chrome et allez sur `chrome://inspect/#devices`
2. **Sur téléphone** : Activez le débogage USB dans les options développeur
3. **Connectez** le téléphone en USB
4. **Inspectez** l'application directement depuis Chrome PC

### **Logs en Temps Réel**
```bash
# Voir les logs de l'application native
npx cap run android -l

# Ou utiliser adb directement
adb logcat | grep -i ndiye
```

---

## **⚠️ Résolution des Problèmes**

### **Problème : "Site inaccessible"**
```bash
# Vérifier que le serveur écoute sur toutes les interfaces
npm start  # Déjà configuré avec --host 0.0.0.0

# Vérifier l'IP locale
ipconfig  # Windows
ifconfig  # Linux/Mac
```

### **Problème : "Connexion refusée"**
1. **Firewall Windows** :
   - Panneau de configuration → Pare-feu Windows Defender
   - Paramètres avancés → Règles de trafic entrant
   - Nouvelle règle → Port → TCP → 4200,3001
   - Autoriser la connexion

2. **Antivirus** : Temporairement désactiver ou ajouter une exception

### **Problème : "Erreurs réseau répétitives"**
- ✅ **Résolu** : Le système de throttling limite maintenant les messages d'erreur
- Les erreurs identiques ne s'affichent que 3 fois maximum
- Timeout de 30 secondes entre les répétitions

---

## **🌐 URLs de Test**

| Type | URL | Description |
|------|-----|-------------|
| **Web Desktop** | `http://192.168.1.5:4200/search` | Version web classique |
| **Mobile Browser** | `http://192.168.1.5:4200/mobile/search` | Version mobile dans navigateur |
| **Mobile Fallback** | `http://192.168.1.5:4200/mobile/fallback` | Page de récupération mobile |
| **API Backend** | `http://192.168.1.5:3001` | Serveur backend |

---

## **📊 Diagnostic Mobile**

### **Console Logs à Vérifier**
```javascript
// Dans Chrome DevTools sur mobile
console.log('📱 Mode mobile actif:', window.location.pathname.startsWith('/mobile'));
console.log('🌐 Connectivité:', navigator.onLine);
console.log('📊 Taille écran:', window.innerWidth + 'x' + window.innerHeight);
```

### **Test de Connectivité API**
```javascript
// Tester l'API depuis la console mobile
fetch('http://192.168.1.5:3001/api/health')
  .then(response => response.json())
  .then(data => console.log('✅ API accessible:', data))
  .catch(error => console.error('❌ API inaccessible:', error));
```

---

## **🎯 Checklist de Test Mobile**

### **Tests de Base**
- [ ] ✅ Page mobile se charge sans erreur
- [ ] ✅ Navigation mobile fonctionne
- [ ] ✅ Pas de messages d'erreur répétitifs
- [ ] ✅ Interface responsive sur mobile
- [ ] ✅ Connexion API fonctionne

### **Tests Avancés**
- [ ] 🔄 Rotation d'écran
- [ ] 📱 Mode hors ligne
- [ ] 🔄 Rechargement de page
- [ ] 🔙 Navigation arrière/avant
- [ ] 📊 Performance de chargement

### **Tests de Connectivité**
- [ ] 📶 WiFi stable
- [ ] 📱 Données mobiles
- [ ] 🔄 Changement de réseau
- [ ] ⏱️ Timeout de requêtes

---

## **🚀 Commandes Utiles**

```bash
# Configuration rapide
npm run setup-mobile          # Configure l'environnement
npm run mobile-dev            # Configure + démarre

# Développement
npm start                     # Serveur de dev
npm run build                 # Build production
npm run test                  # Tests unitaires

# Capacitor
npx cap sync                  # Synchroniser les changements
npx cap run android -l        # Live reload sur Android
npx cap open android          # Ouvrir Android Studio

# Debugging
chrome://inspect/#devices     # DevTools mobile
adb logcat                    # Logs Android
```

---

## **✅ Configuration Actuelle**

- **Frontend** : `http://192.168.1.5:4200`
- **Backend** : `http://192.168.1.5:3001`
- **Mobile Route** : `/mobile/search`
- **Throttling** : ✅ Activé (3 erreurs max / 30s)
- **Live Reload** : ✅ Configuré
- **DevTools** : ✅ Accessible

**Votre application mobile est maintenant prête pour les tests ! 🎉**
