# Corrections des traductions - Module de facturation

## Problèmes identifiés

### 1. Textes codés en dur dans choise-plan.component.html

Les textes suivants doivent être remplacés par des clés de traduction :

```html
<!-- AVANT -->
<div class="app-productive-heading-06 mb-4">
  Prix & Plan
</div>

<!-- APRÈS -->
<div class="app-productive-heading-06 mb-4">
  {{ 'BILLING.PRICING_TITLE' | translate }}
</div>
```

### 2. Clés manquantes à ajouter dans fr.json

```json
{
  "BILLING": {
    "PRICING_TITLE": "Prix & Plan",
    "PRICING_SUBTITLE": "Ndewa360 la plateforme de gestion de location réinventé en 360.",
    "FREE_PLAN": {
      "TITLE": "GRATUIT",
      "SUBTITLE": "Plan automatique à l'inscription",
      "NAME": "Ndewa360 FREE",
      "DESCRIPTION": "Commencez gratuitement avec les fonctionnalités de base pour gérer votre premier bien immobilier",
      "LIMITS_TITLE": "LIMITES DU PLAN FREE",
      "MAX_PROPERTIES": "Maximum 1 bien immobilier",
      "MAX_UNITS": "Maximum 8 unités locatives",
      "FINANCIAL_MANAGEMENT": "Gestion des finances",
      "CONTRACT_MANAGEMENT": "Gestion des contrats",
      "CURRENT_PLAN": "Plan actuel",
      "BASE_PLAN": "Plan de base"
    },
    "PREMIUM_PLAN": {
      "TITLE": "2%",
      "SUBTITLE": "Upgrade vers Premium",
      "NAME": "Ndewa360 Premium",
      "DESCRIPTION": "Gérez un nombre illimité de biens immobiliers et débloquez toutes les fonctionnalités avancées",
      "FEATURES_TITLE": "FONCTIONNALITES PREMIUM",
      "UNLIMITED_PROPERTIES": "Biens immobiliers illimités",
      "UNLIMITED_UNITS": "Unités locatives illimitées",
      "PAYMENT_NOTIFICATIONS": "Notifications de non paiement",
      "DETAILED_DASHBOARD": "Tableau de bord détaillé",
      "PRIORITY_SUPPORT": "Support prioritaire",
      "ADVANCED_REPORTS": "Rapports avancés",
      "UPGRADE_TO_PREMIUM": "Passer au Premium",
      "UPGRADING": "Upgrade en cours..."
    }
  }
}
```

### 3. Clés manquantes à ajouter dans en.json

```json
{
  "BILLING": {
    "PRICING_TITLE": "Pricing & Plans",
    "PRICING_SUBTITLE": "Ndewa360 the rental management platform reinvented in 360.",
    "FREE_PLAN": {
      "TITLE": "FREE",
      "SUBTITLE": "Automatic plan upon registration",
      "NAME": "Ndewa360 FREE",
      "DESCRIPTION": "Start for free with basic features to manage your first property",
      "LIMITS_TITLE": "FREE PLAN LIMITS",
      "MAX_PROPERTIES": "Maximum 1 property",
      "MAX_UNITS": "Maximum 8 rental units",
      "FINANCIAL_MANAGEMENT": "Financial management",
      "CONTRACT_MANAGEMENT": "Contract management",
      "CURRENT_PLAN": "Current plan",
      "BASE_PLAN": "Base plan"
    },
    "PREMIUM_PLAN": {
      "TITLE": "2%",
      "SUBTITLE": "Upgrade to Premium",
      "NAME": "Ndewa360 Premium",
      "DESCRIPTION": "Manage unlimited properties and unlock all advanced features",
      "FEATURES_TITLE": "PREMIUM FEATURES",
      "UNLIMITED_PROPERTIES": "Unlimited properties",
      "UNLIMITED_UNITS": "Unlimited rental units",
      "PAYMENT_NOTIFICATIONS": "Payment notifications",
      "DETAILED_DASHBOARD": "Detailed dashboard",
      "PRIORITY_SUPPORT": "Priority support",
      "ADVANCED_REPORTS": "Advanced reports",
      "UPGRADE_TO_PREMIUM": "Upgrade to Premium",
      "UPGRADING": "Upgrading..."
    }
  }
}
```

## Actions à effectuer

1. ✅ Ajouter les clés BILLING dans fr.json et en.json
2. ✅ Modifier choise-plan.component.html pour utiliser les traductions
3. ✅ Vérifier que subscription-dashboard.component.html utilise bien les clés SUBSCRIPTION_DASHBOARD
4. ✅ Tester les deux langues pour s'assurer que tout fonctionne

## Statut des traductions

- ✅ SUBSCRIPTION_DASHBOARD : Complet
- ✅ SUBSCRIPTION_MODAL : Complet  
- ❌ BILLING (choise-plan) : Manquant - À ajouter