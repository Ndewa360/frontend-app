# Correction de l'Erreur SCSS - Import des Variables

## 🚨 **Erreur Identifiée**

```
Undefined variable.
     ╷
1166 │     background: rgba($default_app_color, 0.05);
     │                      ^^^^^^^^^^^^^^^^^^
     ╵
```

**Cause** : La variable `$default_app_color` n'était pas importée dans le fichier SCSS du composant `unit-detail-dialog`.

## 🔧 **Solution Appliquée**

### **Import Ajouté**
```scss
// === IMPORT DES VARIABLES ===
@import '../../../../../@youpez/styles/scss/theme/app.variables.scss';
```

**Chemin d'import** :
- Depuis : `src/app/main/search/components/unit-detail-dialog/unit-detail-dialog.component.scss`
- Vers : `src/@youpez/styles/scss/theme/app.variables.scss`
- Chemin relatif : `../../../../../@youpez/styles/scss/theme/app.variables.scss`

### **Variables Maintenant Disponibles**
Après l'import, ces variables sont disponibles :
- ✅ `$default_app_color` - Couleur principale de l'app
- ✅ Toutes les autres variables du thème
- ✅ Mixins et fonctions SCSS du design system

## 🎯 **Vérification**

### **Avant (❌ Erreur)**
```scss
.section-heading {
  background: rgba($default_app_color, 0.05); // ❌ Undefined variable
}
```

### **Après (✅ Fonctionnel)**
```scss
@import '../../../../../@youpez/styles/scss/theme/app.variables.scss';

.section-heading {
  background: rgba($default_app_color, 0.05); // ✅ Variable définie
}
```

## 📁 **Structure des Fichiers**

```
src/
├── @youpez/
│   └── styles/
│       └── scss/
│           └── theme/
│               └── app.variables.scss  ← Variables source
└── app/
    └── main/
        └── search/
            └── components/
                └── unit-detail-dialog/
                    └── unit-detail-dialog.component.scss  ← Import ajouté
```

## ✅ **Résolution**

L'erreur de compilation SCSS est maintenant résolue. Le composant peut utiliser toutes les variables du design system :

- `$default_app_color` pour la couleur principale
- `var(--theme-app*)` pour les variables CSS
- Tous les autres éléments du design system

**La compilation devrait maintenant fonctionner correctement !** 🎉
