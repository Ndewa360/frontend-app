# Améliorations de la Duplication de Templates

## Corrections apportées

### 1. URL de redirection corrigée

**Problème** : Après duplication, la redirection utilisait une URL relative qui ne fonctionnait pas correctement.

**Solution** :
- **Dashboard** : `this.router.navigate(['/app/contract-templates/edit', result.newTemplate._id])`
- **Liste** : `this.router.navigate(['/app/contract-templates/edit', result.newTemplate._id])`

**Résultat** : URL correcte `/app/contract-templates/edit/68967860f31c5d0bf287febd`

### 2. Fermeture de modal améliorée

**Améliorations** :
- Ajout d'un délai de 100ms pour s'assurer que le store est mis à jour
- Logs de débogage pour suivre le processus
- Gestion d'erreur améliorée

```typescript
setTimeout(() => {
  this.loading = false;
  const newTemplate = this.store.selectSnapshot(ContractTemplateState.selectStateCurrentTemplate);
  console.log('✅ Template dupliqué, fermeture de la modal:', newTemplate?._id);
  this.dialogRef.close({ success: true, newTemplate });
}, 100);
```

### 3. Affichage des designs/images dans l'éditeur

**Problème** : Les styles CSS et images des templates n'étaient pas correctement affichés dans TinyMCE.

**Solutions implémentées** :

#### A. Configuration TinyMCE améliorée
```typescript
// Préserver les styles existants
verify_html: false,
cleanup: false,
cleanup_on_startup: false,
trim_span_elements: false,
remove_redundant_brs: false,

// Permettre tous les éléments et attributs
valid_elements: "*[*]",
valid_children: "+body[style],+div[style]",
extended_valid_elements: "style[type],link[href|rel]",
```

#### B. Configuration des images
```typescript
// Images externes autorisées
image_domains: ["storage.googleapis.com", "localhost"],
relative_urls: false,
remove_script_host: false,
convert_urls: false,

// Classes CSS pour images
image_class_list: [
  { title: 'Logo', value: 'logo' },
  { title: 'Image responsive', value: 'img-responsive' },
  { title: 'Image centrée', value: 'img-center' }
]
```

#### C. Styles CSS préservés
```css
/* Styles de base pour l'éditeur - ne pas écraser les styles du template */
body {
  max-width: none !important;
  margin: 0 !important;
  padding: 20px !important;
}

/* Styles pour les images */
.logo { max-height: 100px; width: auto; }
.img-responsive { max-width: 100%; height: auto; }
.img-center { display: block; margin: 0 auto; }
```

#### D. Configuration de paste améliorée
```typescript
// Préserver les styles lors du collage
paste_as_text: false,
paste_auto_cleanup_on_paste: false,
paste_remove_styles_if_webkit: false,
paste_retain_style_properties: "all",
```

## Fonctionnalités supportées

### ✅ Styles CSS
- Styles intégrés dans `<style>` tags
- Styles inline sur les éléments
- Classes CSS personnalisées
- Préservation des styles existants

### ✅ Images
- Images depuis Google Cloud Storage
- Images avec classes CSS (logo, responsive, centrée)
- Images avec attributs personnalisés
- Support des images externes

### ✅ Éléments HTML
- Tous les éléments HTML autorisés
- Attributs personnalisés préservés
- Structure HTML complexe supportée

## Tests à effectuer

### 1. Duplication avec redirection
- [ ] Dupliquer un template depuis le dashboard
- [ ] Vérifier la redirection vers `/app/contract-templates/edit/[ID]`
- [ ] Vérifier que la modal se ferme automatiquement

### 2. Affichage des styles
- [ ] Ouvrir un template avec des styles CSS
- [ ] Vérifier que les styles s'affichent dans l'éditeur
- [ ] Modifier le contenu et vérifier que les styles sont préservés

### 3. Gestion des images
- [ ] Insérer une image dans un template
- [ ] Vérifier l'affichage dans l'éditeur
- [ ] Tester les classes CSS pour images

## Notes techniques

- **TinyMCE** : Configuration optimisée pour préserver le contenu HTML complet
- **Google Cloud Storage** : Support des images hébergées sur GCS
- **Styles CSS** : Préservation complète des styles existants
- **Navigation** : URLs absolues pour éviter les problèmes de routing
