# Sélecteur de Template dans le Modal de Contrat

## Fonctionnalité ajoutée

Le modal de visualisation de contrat (`ContractViewerModalComponent`) dispose maintenant d'un **sélecteur de template professionnel** qui permet de :

1. **Voir le template actuellement utilisé** par défaut (celui de la location)
2. **Changer dynamiquement le template** et régénérer le contrat en temps réel
3. **Interface professionnelle** intégrée harmonieusement au modal existant

## Interface utilisateur

### **Sélecteur de template**
- **Position** : Dans le header du modal, à côté des autres actions
- **Apparence** : Bouton élégant avec nom du template et icône dropdown
- **Dropdown** : Liste des templates disponibles avec métadonnées

### **Informations affichées**
Pour chaque template :
- ✅ **Nom** du template
- ✅ **Description** (si disponible)
- ✅ **Type** : Système ou Personnalisé
- ✅ **Badge "Par défaut"** si applicable
- ✅ **Indicateur de sélection** (coche verte)

### **États visuels**
- **Template sélectionné** : Surligné en bleu avec coche
- **Hover** : Effet de survol subtil
- **Loading** : Spinner pendant le chargement des templates
- **Régénération** : Loading state pendant la génération

## Flux fonctionnel

### **1. Initialisation**
```typescript
ngOnInit() {
  this.initializeContractData();
  this.loadAvailableTemplates(); // ✅ Nouveau
}
```

### **2. Chargement des templates**
```typescript
private loadAvailableTemplates() {
  // Récupère tous les templates disponibles
  // Définit le template par défaut basé sur la location
  // Gère les états de loading et d'erreur
}
```

### **3. Changement de template**
```typescript
onTemplateChange(templateId: string) {
  // Vérifie si le template a changé
  // Appelle la régénération avec le nouveau template
  // Met à jour l'interface
}
```

### **4. Régénération du contrat**
```typescript
private regenerateContractWithTemplate(templateId: string) {
  // Appelle l'API avec le template spécifique
  // Met à jour le PDF affiché
  // Met à jour le store
  // Affiche les notifications
}
```

## Architecture technique

### **Frontend**

#### **Composant** : `ContractViewerModalComponent`
```typescript
// Nouvelles propriétés
availableTemplates: ContractTemplate[] = [];
selectedTemplateId: string = '';
isLoadingTemplates = false;
showTemplateSelector = false;

// Nouvelles méthodes
loadAvailableTemplates()
toggleTemplateSelector()
onTemplateChange(templateId: string)
regenerateContractWithTemplate(templateId: string)
getSelectedTemplateName()
```

#### **Service** : `ContractTemplateService`
```typescript
// Nouvelle méthode
generateContractWithTemplate(locationId: string, templateId: string): Observable<any>
```

### **Backend**

#### **Controller** : `ContractController`
```typescript
@Get("generate-with-template/:locationID")
async generateContractWithTemplate(
  @Param("locationID") locationID: string, 
  @Query("templateId") templateId: string
)
```

#### **Service** : `ContractService`
```typescript
async generateContractWithTemplate(locationID: string, templateId: string) {
  // Modifie temporairement le template de la location
  // Génère le contrat avec le nouveau template
  // Restaure l'ancien template
}
```

## Styles CSS

### **Design professionnel**
- **Glassmorphism** : Effets de transparence et blur
- **Animations fluides** : Transitions et transformations
- **Responsive** : Adaptation mobile
- **Cohérence** : Intégration parfaite au modal existant

### **Composants stylés**
```scss
.template-selector-btn          // Bouton principal
.template-dropdown             // Container du dropdown
.template-dropdown-header      // En-tête du dropdown
.template-list                 // Liste des templates
.template-item                 // Item individuel
.template-info                 // Informations du template
.template-meta                 // Métadonnées (type, défaut)
```

## Gestion des états

### **États du sélecteur**
- `isLoadingTemplates` : Chargement des templates
- `showTemplateSelector` : Affichage du dropdown
- `selectedTemplateId` : Template actuellement sélectionné

### **États du contrat**
- `isLoading` : Régénération en cours
- `hasError` : Erreur de génération
- `contractPdfSrc` : PDF généré

## Sécurité et robustesse

### **Gestion d'erreurs**
- ✅ **Fallback** : Retour au template original en cas d'erreur
- ✅ **Notifications** : Messages d'erreur utilisateur
- ✅ **Logs** : Traçabilité complète des actions

### **Validation**
- ✅ **Templates disponibles** : Seuls les templates actifs sont affichés
- ✅ **Permissions** : Respect des droits d'accès
- ✅ **États cohérents** : Synchronisation interface/données

## Expérience utilisateur

### **Workflow typique**
1. **Ouverture** du modal → Template par défaut affiché
2. **Clic** sur le sélecteur → Dropdown avec templates disponibles
3. **Sélection** d'un nouveau template → Régénération automatique
4. **Visualisation** du nouveau contrat → Mise à jour en temps réel
5. **Actions** : Téléchargement, impression, email avec le nouveau template

### **Avantages**
- ✅ **Flexibilité** : Changement de template sans fermer le modal
- ✅ **Temps réel** : Régénération instantanée
- ✅ **Visuel** : Aperçu immédiat du résultat
- ✅ **Professionnel** : Interface élégante et intuitive
- ✅ **Efficacité** : Pas besoin de revenir aux paramètres du bien

## Tests à effectuer

### **Fonctionnalités de base**
- [ ] Ouverture du modal → Template par défaut sélectionné
- [ ] Clic sur sélecteur → Dropdown s'affiche
- [ ] Changement de template → Contrat régénéré
- [ ] Clic extérieur → Dropdown se ferme

### **Gestion d'erreurs**
- [ ] Template inexistant → Fallback vers défaut
- [ ] Erreur réseau → Message d'erreur affiché
- [ ] Template corrompu → Gestion gracieuse

### **Interface**
- [ ] Responsive → Adaptation mobile
- [ ] Animations → Transitions fluides
- [ ] États visuels → Loading, sélection, hover

### **Intégration**
- [ ] Store mis à jour → Contrat sauvegardé
- [ ] Actions modal → Téléchargement, impression fonctionnent
- [ ] Notifications → Messages appropriés

La fonctionnalité est maintenant complète et prête à être testée !
