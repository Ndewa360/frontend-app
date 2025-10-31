# Guide de Traduction - Module Support

Ce guide explique comment utiliser les nouvelles clés de traduction pour le module support/welcome.

## Structure des traductions

Toutes les traductions du module support sont organisées sous la clé `SUPPORT` dans les fichiers `fr.json` et `en.json`.

### 1. Page d'accueil du support (HomeComponent - support/welcome)

**Clés disponibles :**
```typescript
// Titre principal
'SUPPORT.WELCOME.TITLE' // "Bienvenue sur le support de Ndewa360°"

// Messages d'accueil
'SUPPORT.WELCOME.CONGRATULATIONS' // "Félicitations pour avoir commencé..."
'SUPPORT.WELCOME.GLAD_YOU_HERE' // "Nous sommes ravis que vous soyez ici..."
'SUPPORT.WELCOME.RECOMMENDATION' // "Nous vous recommandons de..."

// Sections de la page
'SUPPORT.WELCOME.GETTING_STARTED.TITLE' // "Guide de démarrage"
'SUPPORT.WELCOME.GETTING_STARTED.DESCRIPTION' // "Découvrez la plateforme..."

'SUPPORT.WELCOME.FAQ.TITLE' // "FAQ"
'SUPPORT.WELCOME.FAQ.DESCRIPTION' // "Foire aux questions..."

'SUPPORT.WELCOME.DOCUMENTATION.TITLE' // "Documentation"
'SUPPORT.WELCOME.DOCUMENTATION.DESCRIPTION' // "Parcourir la documentation..."

'SUPPORT.WELCOME.SUPPORT_CONTACT.TITLE' // "Support"
'SUPPORT.WELCOME.SUPPORT_CONTACT.DESCRIPTION' // "Contactez-nous..."

'SUPPORT.WELCOME.CREATE_PROPERTY.TITLE' // "Créer un bien"
'SUPPORT.WELCOME.CREATE_PROPERTY.TITLE_ALT' // "Lancez-vous"
'SUPPORT.WELCOME.CREATE_PROPERTY.DESCRIPTION' // "Créez votre premier bien..."

// Guides et durées
'SUPPORT.WELCOME.GETTING_STARTED.GUIDES.INTRODUCTION' // "Introduction à Ndewa360°"
'SUPPORT.WELCOME.GETTING_STARTED.GUIDES.PROPERTY_MANAGEMENT' // "Gestion de biens"
'SUPPORT.WELCOME.GETTING_STARTED.GUIDES.FINANCIAL_MANAGEMENT' // "Gestion de Finances"
'SUPPORT.WELCOME.GETTING_STARTED.GUIDES.LISTING_MANAGEMENT' // "Gestion des annonces"
'SUPPORT.WELCOME.GETTING_STARTED.GUIDES.BILLING' // "Facturation"

'SUPPORT.WELCOME.GETTING_STARTED.DURATIONS.INTRODUCTION' // "07:34"
'SUPPORT.WELCOME.GETTING_STARTED.DURATIONS.PROPERTY_MANAGEMENT' // "10:14"
// etc...
```

**Exemple d'utilisation dans le template :**
```html
<div class="app-productive-heading-06 mb-8">
  {{ 'SUPPORT.WELCOME.TITLE' | translate }}
</div>

<p class="app-body-long-02 mb-4">
  {{ 'SUPPORT.WELCOME.CONGRATULATIONS' | translate }}<br />
  {{ 'SUPPORT.WELCOME.GLAD_YOU_HERE' | translate }}<br />
</p>

<div class="app-productive-heading-03 mb-4 mt-5">
  {{ 'SUPPORT.WELCOME.GETTING_STARTED.TITLE' | translate }}
</div>
```

### 2. Page FAQ (FaqComponent)

**Clés disponibles :**
```typescript
// Titre et navigation
'SUPPORT.FAQ.TITLE' // "Questions Fréquemment Posées"
'SUPPORT.FAQ.BACK_TO_HOME' // "Retour à l'accueil"

// Groupes de questions
'SUPPORT.FAQ.GROUPS.GENERAL' // "Général"
'SUPPORT.FAQ.GROUPS.OWNERS' // "Pour les propriétaires"
'SUPPORT.FAQ.GROUPS.TENANTS' // "Pour les locataires"
'SUPPORT.FAQ.GROUPS.TECHNICAL_SUPPORT' // "Problèmes techniques / Contact support"

// Questions et réponses (exemples)
'SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.QUESTION' // "Qu'est-ce que Ndewa360 ?"
'SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.ANSWER' // "Ndewa360 est une plateforme..."

'SUPPORT.FAQ.OWNERS.HOW_TO_REGISTER.QUESTION' // "Comment m'inscrire..."
'SUPPORT.FAQ.OWNERS.HOW_TO_REGISTER.ANSWER' // "Vous pouvez vous inscrire..."
```

**Exemple d'utilisation :**
```html
<div class="app-productive-heading-06 mb-8">
  {{ 'SUPPORT.FAQ.TITLE' | translate }}
</div>

<button (click)="goBack()">
  {{ 'SUPPORT.FAQ.BACK_TO_HOME' | translate }}
</button>
```

**Pour remplacer les données hardcodées dans le TypeScript :**
```typescript
// Au lieu de :
public faq = [
  {
    groupName: 'Général',
    children: [
      {
        title: 'Qu'est-ce que Ndewa360 ?',
        content: 'Ndewa360 est une plateforme...'
      }
    ]
  }
];

// Utiliser :
public faq = [
  {
    groupName: this.translate.instant('SUPPORT.FAQ.GROUPS.GENERAL'),
    children: [
      {
        title: this.translate.instant('SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.QUESTION'),
        content: this.translate.instant('SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.ANSWER')
      }
    ]
  }
];
```

### 3. Formulaire de contact (SupportComponent)

**Clés disponibles :**
```typescript
// Titre et description
'SUPPORT.CONTACT_FORM.TITLE' // "Formulaire de Demande d'Assistance"
'SUPPORT.CONTACT_FORM.BACK_TO_HOME' // "Retour à l'accueil"
'SUPPORT.CONTACT_FORM.DESCRIPTION' // "Remplissez ce formulaire..."

// Champs du formulaire
'SUPPORT.CONTACT_FORM.FORM.EMAIL.LABEL' // "Adresse email"
'SUPPORT.CONTACT_FORM.FORM.EMAIL.INVALID' // "Email invalide"
'SUPPORT.CONTACT_FORM.FORM.FULL_NAME.LABEL' // "Nom complet"
'SUPPORT.CONTACT_FORM.FORM.FULL_NAME.PLACEHOLDER' // "Votre nom complet"
'SUPPORT.CONTACT_FORM.FORM.PHONE.LABEL' // "Tél"
'SUPPORT.CONTACT_FORM.FORM.PHONE.HELPER' // "Ex: +237 6xx xx xx xx"
'SUPPORT.CONTACT_FORM.FORM.SUBJECT.LABEL' // "Sujet"
'SUPPORT.CONTACT_FORM.FORM.MESSAGE.LABEL' // "Décrivez votre problème"
'SUPPORT.CONTACT_FORM.FORM.SUBMIT' // "Envoyer"
```

**Exemple d'utilisation :**
```html
<div class="app-productive-heading-06 mb-8">
  {{ 'SUPPORT.CONTACT_FORM.TITLE' | translate }}
</div>

<ibm-label [invalidText]="'SUPPORT.CONTACT_FORM.FORM.EMAIL.INVALID' | translate">
  {{ 'SUPPORT.CONTACT_FORM.FORM.EMAIL.LABEL' | translate }}
  <span class="text-red-600">{{ 'SUPPORT.CONTACT_FORM.FORM.EMAIL.REQUIRED' | translate }}</span>
</ibm-label>
```

### 4. Guide de démarrage (GettingStartedComponent)

**Clés disponibles :**
```typescript
// Titre et navigation
'SUPPORT.GETTING_STARTED.TITLE' // "Guide de démarrage"
'SUPPORT.GETTING_STARTED.BACK_TO_HOME' // "Retour à l'accueil"
'SUPPORT.GETTING_STARTED.DESCRIPTION' // "Découvrez la plate-forme..."

// Vidéos et contenus
'SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TITLE' // "Introduction à Ndewa360"
'SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TOPIC' // "tutoriels vidéo"
'SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.PAGE' // "Présentation général"
'SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.INFO' // "Présentation général..."

// Étapes pour chaque vidéo
'SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.STEPS' // Array d'étapes

// Labels
'SUPPORT.GETTING_STARTED.LABELS.SUBJECT' // "SUJET"
'SUPPORT.GETTING_STARTED.LABELS.VIDEO' // "VIDEO"
'SUPPORT.GETTING_STARTED.LABELS.DESCRIPTION' // "Description"
'SUPPORT.GETTING_STARTED.LABELS.PAGE' // "page"
'SUPPORT.GETTING_STARTED.LABELS.DETAILS' // "Détails"
```

**Pour remplacer les données hardcodées :**
```typescript
// Au lieu de :
public videos = [
  {
    title: 'Introduction à Ndewa360',
    topic: 'tutoriels vidéo',
    page: 'Présentation général',
    info: 'Présentation général de l\'application.'
  }
];

// Utiliser :
public videos = [
  {
    title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TITLE'),
    topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TOPIC'),
    page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.PAGE'),
    info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.INFO')
  }
];
```

## Instructions d'implémentation

### 1. Importer TranslateService
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(
  private translate: TranslateService,
  // autres services...
) {}
```

### 2. Remplacer les textes hardcodés
- Dans les templates HTML : utiliser le pipe `| translate`
- Dans les composants TypeScript : utiliser `this.translate.instant('CLE')`

### 3. Gérer les changements de langue
```typescript
ngOnInit() {
  // S'abonner aux changements de langue pour mettre à jour les données
  this.translate.onLangChange.subscribe(() => {
    this.updateTranslatedData();
  });
}

private updateTranslatedData() {
  // Mettre à jour les données traduites
  this.faq = this.buildFaqData();
  this.videos = this.buildVideosData();
}
```

### 4. Tester les traductions
1. Vérifier que tous les textes s'affichent correctement en français
2. Changer la langue vers l'anglais et vérifier les traductions
3. S'assurer que les changements de langue sont réactifs

## Notes importantes

- Toutes les clés de traduction sont préfixées par `SUPPORT.`
- Les textes avec du HTML (liens, balises) sont conservés dans les traductions
- Les durées des vidéos restent identiques dans les deux langues
- Les URLs des vidéos YouTube ne changent pas selon la langue

## Prochaines étapes

1. Modifier les composants pour utiliser les nouvelles clés de traduction
2. Tester l'affichage dans les deux langues
3. Ajuster les traductions si nécessaire
4. Documenter les changements pour l'équipe