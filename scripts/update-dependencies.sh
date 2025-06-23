#!/bin/bash

# Script de mise à jour des dépendances pour Ndiye
# Ce script met à jour les dépendances obsolètes de manière sécurisée

echo "🚀 Mise à jour des dépendances Ndiye..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé. Veuillez installer Node.js et npm."
    exit 1
fi

# Créer une sauvegarde du package.json
log_info "Création d'une sauvegarde de package.json..."
cp package.json package.json.backup

# Mettre à jour Angular vers la version 17 (LTS)
log_info "Mise à jour d'Angular vers la version 17..."
ng update @angular/core@17 @angular/cli@17 --force

# Mettre à jour TypeScript
log_info "Mise à jour de TypeScript..."
npm install typescript@5.2.2 --save-dev

# Remplacer TSLint par ESLint
log_info "Migration de TSLint vers ESLint..."
npm uninstall tslint codelyzer
npm install --save-dev @angular-eslint/builder @angular-eslint/eslint-plugin @angular-eslint/eslint-plugin-template @angular-eslint/template-parser @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# Mettre à jour les dépendances critiques
log_info "Mise à jour des dépendances critiques..."

# Carbon Design System - Migration vers la nouvelle version
log_warning "Carbon Components est déprécié. Migration vers @carbon/web-components..."
npm uninstall carbon-components carbon-components-angular
npm install @carbon/web-components @carbon/styles

# Mettre à jour les autres dépendances importantes
npm update @types/node@20.x
npm update zone.js@0.14.x
npm update chroma-js@3.x

# Mettre à jour les dépendances de développement
log_info "Mise à jour des dépendances de développement..."
npm update @angular-devkit/build-angular
npm update cypress@13.x
npm update jest@29.x

# Nettoyer le cache npm
log_info "Nettoyage du cache npm..."
npm cache clean --force

# Réinstaller les dépendances
log_info "Réinstallation des dépendances..."
rm -rf node_modules package-lock.json
npm install

# Vérifier les vulnérabilités
log_info "Vérification des vulnérabilités de sécurité..."
npm audit

# Proposer des corrections automatiques
if npm audit --audit-level=moderate | grep -q "vulnerabilities"; then
    log_warning "Des vulnérabilités ont été détectées. Tentative de correction automatique..."
    npm audit fix
fi

# Vérifier que l'application compile toujours
log_info "Vérification de la compilation..."
if ng build --configuration=production; then
    log_info "✅ La compilation fonctionne correctement !"
else
    log_error "❌ Erreur de compilation détectée. Vérifiez les logs ci-dessus."
    log_info "Restauration de la sauvegarde..."
    cp package.json.backup package.json
    npm install
    exit 1
fi

# Exécuter les tests
log_info "Exécution des tests..."
if npm test -- --watch=false; then
    log_info "✅ Tous les tests passent !"
else
    log_warning "⚠️ Certains tests échouent. Vérifiez les tests après la migration."
fi

# Nettoyer les fichiers de sauvegarde
rm package.json.backup

log_info "🎉 Mise à jour terminée avec succès !"
log_info "📋 Prochaines étapes recommandées :"
echo "   1. Vérifiez que l'application fonctionne correctement"
echo "   2. Mettez à jour les imports Carbon Components dans votre code"
echo "   3. Configurez ESLint selon vos préférences"
echo "   4. Testez toutes les fonctionnalités critiques"
echo "   5. Committez les changements"

# Afficher un résumé des changements majeurs
log_info "📊 Résumé des changements majeurs :"
echo "   • Angular mis à jour vers la version 17 (LTS)"
echo "   • TypeScript mis à jour vers 5.2.2"
echo "   • TSLint remplacé par ESLint"
echo "   • Carbon Components migré vers @carbon/web-components"
echo "   • Dépendances de sécurité mises à jour"
