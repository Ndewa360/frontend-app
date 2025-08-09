# Corrections Complètes de l'Éditeur de Templates

## Problèmes corrigés

### 1. ✅ Structure de scroll restaurée

**Problème** : La page entière était scrollable au lieu d'avoir des sections scrollables individuellement.

**Solution** :
- Restauré `height: 100vh` et `overflow: hidden` sur `.contract-template-editor`
- Restauré `height: 100%` et `overflow: hidden` sur `.editor-main` et `.editor-area`
- La barre de statut horizontale en bas est préservée
- Seul le menu de gauche et la zone d'édition TinyMCE ont leur propre scroll

### 2. ✅ Gestion correcte des modifications non sauvegardées

**Problème** : Le bouton retour demandait toujours la sauvegarde même sans modifications.

**Solution** :
```typescript
// Nouvelles variables pour stocker les valeurs originales
private originalTemplateName = '';
private originalTemplateDescription = '';
private originalTemplateContent = '';

// Méthode pour sauvegarder les valeurs originales
private saveOriginalValues(): void {
  this.originalTemplateName = this.templateName;
  this.originalTemplateDescription = this.templateDescription;
  this.originalTemplateContent = this.templateContent;
  this.hasUnsavedChanges = false;
}

// Détection correcte des changements
hasChanges(): boolean {
  if (!this.isEditMode) {
    // Nouveau template
    return this.templateName !== 'Nouveau modèle de contrat' ||
           this.templateDescription !== '' ||
           this.templateContent !== '<p>Commencez à rédiger votre modèle de contrat...</p>';
  }

  // Mode édition - comparer avec les valeurs originales
  return this.templateName !== this.originalTemplateName ||
         this.templateDescription !== this.originalTemplateDescription ||
         this.templateContent !== this.originalTemplateContent;
}
```

**Moments de sauvegarde des valeurs originales** :
- Après chargement du template
- Après sauvegarde réussie
- Après création réussie

### 3. ✅ Affichage des styles dans l'éditeur et la prévisualisation

**Problème** : Les styles CSS des templates ne s'affichaient pas dans TinyMCE.

**Solution** :
```typescript
private updateEditorContent(): void {
  // ... code existant ...
  
  // Mettre à jour les styles CSS de l'éditeur
  const newContentStyle = this.getContentStyle();
  if (editor.dom && editor.dom.doc) {
    // Supprimer les anciens styles personnalisés
    const existingStyle = editor.dom.doc.getElementById('custom-template-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Ajouter les nouveaux styles
    const styleElement = editor.dom.doc.createElement('style');
    styleElement.id = 'custom-template-styles';
    styleElement.textContent = this.extractedStyles || '';
    editor.dom.doc.head.appendChild(styleElement);
  }
}
```

**Système de styles** :
- `extractStylesFromHtml()` : Extrait les styles du HTML complet
- `getContentStyle()` : Combine styles de base + styles extraits pour TinyMCE
- `getPreviewStyles()` : Retourne les styles pour la prévisualisation
- Injection dynamique des styles dans TinyMCE après chargement

### 4. ✅ Suppression du nettoyage destructeur de styles

**Problème** : Une fonction supprimait tous les styles inline.

**Solution** :
```typescript
// SUPPRIMÉ : Code qui détruisait les styles
// const cleanContent = content.replace(/style="[^"]*"/g, '');

// REMPLACÉ PAR :
// Les styles sont maintenant préservés - pas de nettoyage automatique
```

## Architecture des styles

### Flux des styles dans l'éditeur :

1. **Chargement** : `extractStylesFromHtml()` sépare styles et contenu
2. **Stockage** : `this.extractedStyles` contient les styles CSS
3. **TinyMCE** : `getContentStyle()` combine styles de base + styles extraits
4. **Injection** : `updateEditorContent()` injecte les styles dans TinyMCE
5. **Prévisualisation** : `getPreviewStyles()` retourne les styles pour l'aperçu

### Méthodes clés :

- `extractStylesFromHtml(html)` → `{ styles, bodyContent }`
- `getContentStyle()` → CSS complet pour TinyMCE
- `getPreviewStyles()` → CSS pour prévisualisation
- `combineContentWithStyles(body, styles)` → HTML complet pour export

## Tests à effectuer

### ✅ Structure de scroll
- [ ] Page principale non scrollable
- [ ] Menu de gauche scrollable indépendamment
- [ ] Zone TinyMCE scrollable indépendamment
- [ ] Barre de statut fixe en bas visible

### ✅ Gestion des modifications
- [ ] Ouvrir template → cliquer retour → pas de modal
- [ ] Modifier template → cliquer retour → modal s'affiche
- [ ] Sauvegarder → cliquer retour → pas de modal
- [ ] Nouveau template vide → cliquer retour → pas de modal

### ✅ Affichage des styles
- [ ] Template avec styles CSS → styles visibles dans TinyMCE
- [ ] Template avec styles CSS → styles visibles dans prévisualisation
- [ ] Modification du contenu → styles préservés
- [ ] Sauvegarde → styles préservés dans le fichier final

### ✅ Fonctionnalités générales
- [ ] Chargement de template existant
- [ ] Création de nouveau template
- [ ] Sauvegarde de modifications
- [ ] Prévisualisation en temps réel
- [ ] Export/impression avec styles

## Notes techniques

- **TinyMCE** : Injection dynamique de styles via DOM manipulation
- **Préservation** : Styles inline et balises `<style>` préservés
- **Séparation** : Contenu et styles gérés séparément pour flexibilité
- **Synchronisation** : Styles synchronisés entre éditeur et prévisualisation
