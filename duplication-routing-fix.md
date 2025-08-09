# Correction du Routing après Duplication de Template

## Problème identifié
Après duplication d'un template, la redirection vers l'éditeur ne fonctionnait pas correctement à cause d'une incohérence dans la structure des données retournées par la modal de duplication.

## Corrections apportées

### 1. Correction de la logique de redirection dans le dashboard
**Fichier**: `contract-templates-dashboard.component.ts`

**Avant**:
```typescript
dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Rediriger vers l'éditeur du nouveau template
    this.router.navigate(['edit', result._id], { relativeTo: this.route });
  }
});
```

**Après**:
```typescript
dialogRef.afterClosed().subscribe(result => {
  if (result && result.success && result.newTemplate) {
    // Rediriger vers l'éditeur du nouveau template
    console.log('🔄 Redirection vers l\'éditeur du template dupliqué:', result.newTemplate._id);
    this.router.navigate(['edit', result.newTemplate._id], { relativeTo: this.route });
  }
});
```

### 2. Correction des données passées à la modal
**Fichier**: `contract-templates-dashboard.component.ts`

**Avant**:
```typescript
data: { sourceTemplate }
```

**Après**:
```typescript
data: { template: sourceTemplate }
```

## Structure des données

### Modal de duplication retourne:
```typescript
{
  success: boolean,
  newTemplate?: ContractTemplateModel
}
```

### Store NGXS met à jour:
- `templates`: Ajoute le nouveau template en début de liste
- `currentTemplate`: Définit le nouveau template comme template courant

## Routing vérifié

### Routes définies dans le module:
```typescript
const routes: Routes = [
  { path: '', component: ContractTemplatesDashboardComponent },
  { path: 'list', component: ContractTemplatesListComponent },
  { path: 'create', component: ContractTemplateEditorComponent },
  { path: 'edit/:id', component: ContractTemplateEditorComponent },  // ✅ Correct
  { path: 'view/:id', component: ContractTemplateViewComponent }
];
```

### URL générée après duplication:
`/app/contract-templates/edit/6896737dba87a1c1bc17cb74` ✅

## Comparaison avec la liste des templates

La liste des templates a une logique plus robuste avec fallback:

1. **Cas principal**: Utilise `result.newTemplate._id` si disponible
2. **Fallback**: Écoute le store pour récupérer le `currentTemplate` si le résultat ne contient pas le nouveau template
3. **Sécurité**: Recharge la liste des templates si aucun nouveau template n'est trouvé

## Tests à effectuer

1. **Dashboard → Duplication**:
   - [ ] Cliquer sur "Dupliquer un modèle"
   - [ ] Sélectionner un template source
   - [ ] Remplir le formulaire de duplication
   - [ ] Vérifier la redirection vers l'éditeur

2. **Liste → Duplication**:
   - [ ] Aller sur la liste des templates
   - [ ] Cliquer sur "Dupliquer" sur un template
   - [ ] Vérifier la redirection vers l'éditeur

3. **Éditeur après duplication**:
   - [ ] Vérifier que le template dupliqué se charge correctement
   - [ ] Vérifier que le nom contient "(Copie)"
   - [ ] Vérifier que le contenu est identique au template source

## Logs de débogage ajoutés

```typescript
console.log('🔄 Redirection vers l\'éditeur du template dupliqué:', result.newTemplate._id);
```

Ces logs permettent de suivre le processus de redirection dans la console du navigateur.
