#!/usr/bin/env node

/**
 * Script pour mettre à jour automatiquement les traductions dans les templates HTML
 */

const fs = require('fs');
const path = require('path');

// Mappings des textes en dur vers les clés de traduction
const translationMappings = {
  // Textes français vers clés
  'Nouveau Locataire': 'MODALS.TENANT.ADD_TITLE',
  'Modifier le Locataire': 'MODALS.TENANT.EDIT_TITLE',
  'Photo de profil': 'MODALS.TENANT.PHOTO_PROFILE',
  'Télécharger une photo': 'MODALS.TENANT.UPLOAD_PHOTO',
  'Supprimer la photo': 'MODALS.TENANT.REMOVE_PHOTO',
  'Informations personnelles': 'MODALS.TENANT.PERSONAL_INFO',
  'Informations de contact': 'MODALS.TENANT.CONTACT_INFO',
  'Informations de bail': 'MODALS.TENANT.LEASE_INFO',
  'Prénom': 'MODALS.TENANT.FIRST_NAME',
  'Nom': 'MODALS.TENANT.LAST_NAME',
  'Email': 'MODALS.TENANT.EMAIL',
  'Téléphone': 'MODALS.TENANT.PHONE',
  'Numéro de carte d\'identité': 'MODALS.TENANT.ID_CARD',
  'Date de naissance': 'MODALS.TENANT.BIRTH_DATE',
  'Nationalité': 'MODALS.TENANT.NATIONALITY',
  'Profession': 'MODALS.TENANT.PROFESSION',
  'Contact d\'urgence': 'MODALS.TENANT.EMERGENCY_CONTACT',
  'Téléphone d\'urgence': 'MODALS.TENANT.EMERGENCY_PHONE',
  'Attribution de chambre': 'MODALS.TENANT.ROOM_ASSIGNMENT',
  'Sélectionner une chambre': 'MODALS.TENANT.SELECT_ROOM',
  'Début du bail': 'MODALS.TENANT.LEASE_START',
  'Fin du bail': 'MODALS.TENANT.LEASE_END',
  'Loyer mensuel': 'MODALS.TENANT.MONTHLY_RENT',
  'Caution': 'MODALS.TENANT.DEPOSIT',
  'Notes': 'MODALS.TENANT.NOTES',
  
  // Paiements
  'Ajouter un paiement': 'MODALS.PAYMENT.ADD_TITLE',
  'Modifier le paiement': 'MODALS.PAYMENT.EDIT_TITLE',
  'Informations de paiement': 'MODALS.PAYMENT.PAYMENT_INFO',
  'Informations contextuelles': 'MODALS.PAYMENT.CONTEXT_INFO',
  'Locataire': 'MODALS.PAYMENT.TENANT',
  'Chambre': 'MODALS.PAYMENT.ROOM',
  'Type de paiement': 'MODALS.PAYMENT.PAYMENT_TYPE',
  'Montant': 'MODALS.PAYMENT.AMOUNT',
  'Date de paiement': 'MODALS.PAYMENT.PAYMENT_DATE',
  'Méthode de paiement': 'MODALS.PAYMENT.PAYMENT_METHOD',
  'Référence': 'MODALS.PAYMENT.REFERENCE',
  'Motif': 'MODALS.PAYMENT.REASON',
  'Loyer mensuel': 'MODALS.PAYMENT.RENT',
  'Espèces': 'MODALS.PAYMENT.CASH',
  'Virement bancaire': 'MODALS.PAYMENT.BANK_TRANSFER',
  'Chèque': 'MODALS.PAYMENT.CHECK',
  'Carte bancaire': 'MODALS.PAYMENT.CARD',
  'Mobile Money': 'MODALS.PAYMENT.MOBILE_MONEY',
  
  // Résiliation de contrat
  'Résilier le contrat': 'MODALS.CONTRACT_TERMINATION.TITLE',
  'Fin de la location': 'MODALS.CONTRACT_TERMINATION.SUBTITLE',
  'Informations du locataire': 'MODALS.CONTRACT_TERMINATION.TENANT_INFO',
  'Informations de la chambre': 'MODALS.CONTRACT_TERMINATION.ROOM_INFO',
  'Détails de la résiliation': 'MODALS.CONTRACT_TERMINATION.TERMINATION_DETAILS',
  'Date de résiliation': 'MODALS.CONTRACT_TERMINATION.TERMINATION_DATE',
  'Motif de résiliation': 'MODALS.CONTRACT_TERMINATION.TERMINATION_REASON',
  'Notes supplémentaires': 'MODALS.CONTRACT_TERMINATION.ADDITIONAL_NOTES',
  'Confirmer la résiliation': 'MODALS.CONTRACT_TERMINATION.CONFIRM_TERMINATION',
  
  // Suppression de paiement
  'Supprimer le paiement': 'MODALS.DELETE_PAYMENT.TITLE',
  'Cette action est irréversible': 'MODALS.DELETE_PAYMENT.SUBTITLE',
  'Êtes-vous sûr de vouloir supprimer ce paiement ?': 'MODALS.DELETE_PAYMENT.MESSAGE',
  'Cette action supprimera définitivement le paiement de l\'historique.': 'MODALS.DELETE_PAYMENT.WARNING',
  'Détails du paiement': 'MODALS.DELETE_PAYMENT.PAYMENT_DETAILS',
  'Oui, supprimer': 'MODALS.DELETE_PAYMENT.CONFIRM_DELETE',
  
  // Boutons communs
  'Enregistrer': 'COMMON.SAVE',
  'Annuler': 'COMMON.CANCEL',
  'Supprimer': 'COMMON.DELETE',
  'Modifier': 'COMMON.EDIT',
  'Ajouter': 'COMMON.ADD',
  'Rechercher': 'COMMON.SEARCH',
  'Chargement...': 'COMMON.LOADING',
  'Fermer': 'COMMON.CLOSE',
  'Retour': 'COMMON.BACK',
  'Suivant': 'COMMON.NEXT',
  'Précédent': 'COMMON.PREVIOUS',
  'Soumettre': 'COMMON.SUBMIT',
  'Réinitialiser': 'COMMON.RESET',
  'Confirmer': 'COMMON.CONFIRM',
  'Oui': 'COMMON.YES',
  'Non': 'COMMON.NO',
  
  // Statuts
  'Disponible': 'STATUS.AVAILABLE',
  'Occupé': 'STATUS.OCCUPIED',
  'Maintenance': 'STATUS.MAINTENANCE',
  'Réservé': 'STATUS.RESERVED',
  'Actif': 'STATUS.ACTIVE',
  'Inactif': 'STATUS.INACTIVE',
  'En attente': 'STATUS.PENDING',
  'Approuvé': 'STATUS.APPROVED',
  'Rejeté': 'STATUS.REJECTED',
  'Terminé': 'STATUS.COMPLETED',
  'Annulé': 'STATUS.CANCELLED'
};

// Fonction pour mettre à jour un fichier HTML
function updateHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Remplacer les textes en dur par les pipes de traduction
    for (const [frenchText, translationKey] of Object.entries(translationMappings)) {
      // Patterns pour différents contextes
      const patterns = [
        // Texte simple entre guillemets
        new RegExp(`"${frenchText}"`, 'g'),
        // Texte dans des éléments HTML
        new RegExp(`>${frenchText}<`, 'g'),
        // Texte dans des attributs
        new RegExp(`="${frenchText}"`, 'g'),
        // Texte avec interpolation
        new RegExp(`{{\\s*'${frenchText}'\\s*}}`, 'g')
      ];
      
      patterns.forEach(pattern => {
        const replacement = pattern.source.includes('>') && pattern.source.includes('<') 
          ? `>{{ '${translationKey}' | translate }}<`
          : pattern.source.includes('{{')
          ? `{{ '${translationKey}' | translate }}`
          : `"{{ '${translationKey}' | translate }}"`;
          
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          updated = true;
        }
      });
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Mis à jour: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les dossiers
function updateDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalUpdated = 0;
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalUpdated += updateDirectory(fullPath);
    } else if (item.endsWith('.html')) {
      if (updateHtmlFile(fullPath)) {
        totalUpdated++;
      }
    }
  });
  
  return totalUpdated;
}

// Exécution du script
console.log('🌍 Mise à jour automatique des traductions...');
console.log('================================================');

const modalsPath = path.join(__dirname, '../src/app/main/properties/components');
const totalUpdated = updateDirectory(modalsPath);

console.log('================================================');
console.log(`✅ Mise à jour terminée: ${totalUpdated} fichiers modifiés`);
console.log('');
console.log('📝 Prochaines étapes:');
console.log('1. Vérifiez les fichiers modifiés');
console.log('2. Testez les modals dans l\'application');
console.log('3. Ajustez manuellement si nécessaire');
