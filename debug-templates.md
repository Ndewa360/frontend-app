# Debug Templates - Corrections apportées

## Problème 1: Duplication des templates
**Cause**: Le backend renvoie déjà le template système dans la liste, mais le sélecteur `selectAllTemplates` ajoutait encore le `defaultTemplate` du state.

**Solution**: 
- Modifié le sélecteur `selectAllTemplates` pour retourner uniquement `state.templates`
- Supprimé l'appel explicite à `LoadDefaultTemplate` dans le composant liste

## Problème 2: Page non scrollable
**Cause**: CSS avec `min-height: 100vh` et `min-height: calc(100vh - 200px)` qui forçaient une hauteur fixe

**Solution**:
- Commenté `min-height: 100vh` dans `.contract-templates-list`
- Commenté `min-height: calc(100vh - 200px)` dans `.main-content`

## Vérifications à faire:

1. **Backend**: Vérifier que `getTemplates()` renvoie bien le template système
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/contract-templates
   ```

2. **Frontend**: Vérifier que la liste affiche un seul template
   - Aller sur http://localhost:4200/app/contract-templates/list
   - Vérifier qu'il n'y a qu'un seul template affiché
   - Vérifier que la page est scrollable

3. **Store**: Vérifier que le sélecteur ne duplique plus
   - Ouvrir les DevTools Angular
   - Vérifier l'état du store ContractTemplateState
   - `templates` devrait contenir le template système
   - `defaultTemplate` peut être null ou contenir le même template

## Tests à effectuer:

- [ ] Liste des templates affiche 1 seul template
- [ ] Page est scrollable
- [ ] Filtres fonctionnent correctement
- [ ] Recherche fonctionne
- [ ] Création de nouveau template fonctionne
- [ ] Visualisation du template par défaut fonctionne
- [ ] Duplication de template fonctionne

## Logs à surveiller:

Backend:
```
✅ Templates récupérés: { userTemplates: 0, systemTemplates: 1, total: 1, page: 1, limit: 12 }
```

Frontend (Console):
- Pas d'erreurs de duplication
- Store state cohérent
