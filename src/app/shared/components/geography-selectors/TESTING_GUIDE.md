# 🧪 GUIDE DE TEST - SÉLECTEURS GÉOGRAPHIQUES AMÉLIORÉS

## 🎯 **OBJECTIF**
Vérifier que les améliorations apportées aux sélecteurs de pays et ville fonctionnent correctement dans la création de propriété.

## 📍 **OÙ TESTER**
- **Page** : Création de propriété
- **URL** : `/properties/add` ou via le bouton "Ajouter une propriété"
- **Section** : Formulaire de localisation (Pays + Ville)

## ✅ **TESTS À EFFECTUER**

### **1. Test de Sélection de Pays**
**Objectif** : Vérifier que le dropdown pays ne se ferme plus prématurément

**Étapes** :
1. Cliquer sur le champ "Sélectionner un pays"
2. Le dropdown s'ouvre avec la liste des pays
3. **Survoler lentement** plusieurs pays avec la souris
4. **Attendre 2-3 secondes** sur un pays sans cliquer
5. Le dropdown doit **rester ouvert**
6. Cliquer sur un pays pour le sélectionner

**Résultat attendu** :
- ✅ Le dropdown reste ouvert pendant le survol
- ✅ La sélection fonctionne correctement
- ✅ Le pays sélectionné s'affiche dans le champ

### **2. Test de Synchronisation Pays-Villes**
**Objectif** : Vérifier que la liste des villes se met à jour automatiquement

**Étapes** :
1. Sélectionner un pays (ex: France)
2. Cliquer sur le champ "Sélectionner une ville"
3. Vérifier que seules les villes du pays sélectionné apparaissent
4. Retourner au champ pays et sélectionner un autre pays (ex: Sénégal)
5. Cliquer à nouveau sur le champ ville

**Résultat attendu** :
- ✅ Après sélection du premier pays : villes françaises uniquement
- ✅ Après changement de pays : villes sénégalaises uniquement
- ✅ Mise à jour automatique sans action manuelle

### **3. Test de Réinitialisation de Ville**
**Objectif** : Vérifier que la ville se réinitialise quand on change de pays

**Étapes** :
1. Sélectionner un pays (ex: France)
2. Sélectionner une ville (ex: Paris)
3. Vérifier que les deux champs sont remplis
4. Changer le pays (ex: sélectionner Sénégal)
5. Observer le champ ville

**Résultat attendu** :
- ✅ Après changement de pays : le champ ville se vide automatiquement
- ✅ Le placeholder "Sélectionner une ville" réapparaît
- ✅ La liste des villes correspond au nouveau pays

### **4. Test d'Interaction avec les Inputs**
**Objectif** : Vérifier que les inputs réagissent correctement aux clics

**Étapes** :
1. Cliquer directement sur l'input pays (pas sur la flèche)
2. Le dropdown doit s'ouvrir
3. Cliquer à l'extérieur pour fermer
4. Répéter avec l'input ville
5. Tester avec le clavier (Tab pour naviguer, Entrée pour ouvrir)

**Résultat attendu** :
- ✅ Clic sur input ouvre le dropdown
- ✅ Clic extérieur ferme le dropdown
- ✅ Navigation clavier fonctionnelle

### **5. Test de Recherche dans les Dropdowns**
**Objectif** : Vérifier que la recherche fonctionne correctement

**Étapes** :
1. Ouvrir le dropdown pays
2. Taper dans le champ de recherche (ex: "Fra")
3. Vérifier que seuls les pays correspondants apparaissent
4. Effacer la recherche
5. Répéter avec les villes

**Résultat attendu** :
- ✅ Filtrage en temps réel pendant la saisie
- ✅ Résultats pertinents affichés
- ✅ Retour à la liste complète après effacement

### **6. Test de Validation du Formulaire**
**Objectif** : Vérifier que la validation fonctionne avec les nouveaux composants

**Étapes** :
1. Laisser les champs pays et ville vides
2. Essayer de soumettre le formulaire
3. Vérifier les messages d'erreur
4. Remplir seulement le pays
5. Essayer de soumettre à nouveau
6. Remplir la ville et soumettre

**Résultat attendu** :
- ✅ Erreur si pays vide : "La localisation est obligatoire"
- ✅ Erreur si ville vide mais pays rempli
- ✅ Validation OK si les deux sont remplis

## 🐛 **PROBLÈMES À SURVEILLER**

### **Problèmes Résolus** (ne devraient plus se produire)
- ❌ Dropdown se ferme avant de pouvoir cliquer
- ❌ Liste des villes ne se met pas à jour après changement de pays
- ❌ Ville reste sélectionnée après changement de pays
- ❌ Input ne réagit pas au clic

### **Nouveaux Problèmes Potentiels**
- ⚠️ Délai de fermeture trop long (dropdown reste ouvert trop longtemps)
- ⚠️ Performance dégradée avec beaucoup de villes
- ⚠️ Problèmes de mémoire avec les observables

## 📊 **CRITÈRES DE SUCCÈS**

### **Fonctionnalité** (80% minimum)
- [ ] Sélection de pays fonctionne sans fermeture prématurée
- [ ] Liste des villes se met à jour automatiquement
- [ ] Ville se réinitialise lors du changement de pays
- [ ] Recherche fonctionne dans les deux dropdowns
- [ ] Validation du formulaire opérationnelle

### **Performance** (Acceptable)
- [ ] Ouverture des dropdowns < 200ms
- [ ] Filtrage de la recherche < 100ms
- [ ] Pas de lag visible lors des interactions

### **UX** (Excellente)
- [ ] Interface intuitive et responsive
- [ ] Feedback visuel approprié
- [ ] Pas de comportements inattendus
- [ ] Messages d'erreur clairs

## 🔧 **EN CAS DE PROBLÈME**

### **Dropdown se ferme encore prématurément**
1. Vérifier que `isDropdownHovered` est bien géré
2. Augmenter le délai dans `onInputBlur()` (actuellement 300ms)
3. Vérifier les événements `mouseenter` et `mouseleave`

### **Villes ne se mettent pas à jour**
1. Vérifier que `ngOnChanges` est bien appelé
2. Contrôler que `countryFilter` change bien de référence
3. Vérifier les logs de la console pour les erreurs

### **Performance dégradée**
1. Vérifier qu'il n'y a pas de fuites mémoire dans les observables
2. Contrôler que `takeUntil(this.destroy$)` est bien utilisé
3. Optimiser le filtrage si nécessaire

## 📝 **RAPPORT DE TEST**

Après avoir effectué tous les tests, remplir ce rapport :

**Date** : ___________
**Testeur** : ___________
**Version** : ___________

**Résultats** :
- [ ] ✅ Tous les tests passent
- [ ] ⚠️ Quelques problèmes mineurs
- [ ] ❌ Problèmes majeurs détectés

**Commentaires** :
_________________________________
_________________________________
_________________________________

**Actions à prendre** :
_________________________________
_________________________________
_________________________________

---

## 🎉 **VALIDATION FINALE**

Si tous les tests passent, les sélecteurs géographiques sont prêts pour la production ! 

Les utilisateurs peuvent maintenant créer leurs propriétés avec une expérience de sélection de localisation fluide et intuitive. 🌍🏠
