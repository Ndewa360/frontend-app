// Modèles pour l'assistant d'assignation de locataire

export enum TypeLocataire {
  NOUVEAU = 'NOUVEAU',
  EXISTANT = 'EXISTANT',
  MIGRATION = 'MIGRATION'
}

export enum SituationFinanciere {
  A_JOUR = 'A_JOUR',
  EN_AVANCE = 'EN_AVANCE',
  EN_RETARD = 'EN_RETARD',
  AUCUN_PAIEMENT = 'AUCUN_PAIEMENT'
}

export enum TypePaiementInitial {
  AVANCE_SEULE = 'AVANCE_SEULE',
  CAUTION_SEULE = 'CAUTION_SEULE',
  AVANCE_PLUS_CAUTION = 'AVANCE_PLUS_CAUTION',
  PARTIEL = 'PARTIEL',
  AUCUN = 'AUCUN'
}

export enum TypeEcritureComptable {
  PAIEMENT_AVANCE = 'PAIEMENT_AVANCE',
  PAIEMENT_CAUTION = 'PAIEMENT_CAUTION',
  DETTE_AVANCE = 'DETTE_AVANCE',
  DETTE_CAUTION = 'DETTE_CAUTION',
  REGULARISATION = 'REGULARISATION',
  REPORT_SOLDE = 'REPORT_SOLDE'
}

// Configuration pour nouveau locataire
export interface NouveauLocataireConfig {
  montantAvance: number;
  montantCaution: number;
  paiementInitial: {
    montant: number;
    type: TypePaiementInitial;
    repartition?: {
      avance: number;
      caution: number;
    };
  };
  dateEntree: Date;
  generateFacture: boolean;
  commentaire?: string;
}

// Configuration pour locataire existant
export interface LocataireExistantConfig {
  situationActuelle: SituationFinanciere;
  soldeActuel: number;
  cautionVersee: number;
  dateEntree: Date;
  transfererHistorique: boolean;
  ajustements?: {
    type: 'REGULARISATION' | 'REPORT_SOLDE';
    montant: number;
    motif: string;
  };
  commentaire?: string;
}

// Écriture comptable prévisionnelle
export interface EcritureComptablePreview {
  type: TypeEcritureComptable;
  libelle: string;
  montant: number;
  sens: 'DEBIT' | 'CREDIT';
  compte: string;
  description: string;
}

// Résumé des écritures comptables
export interface ResumeEcritures {
  totalDebits: number;
  totalCredits: number;
  equilibre: boolean;
  ecritures: EcritureComptablePreview[];
}

// Configuration complète d'assignation
export interface AssignationConfig {
  // Informations de base
  locataireId: string;
  chambreId: string;
  propertyId: string;
  typeAssignation: TypeLocataire;
  
  // Configuration financière selon le type
  configurationFinanciere: NouveauLocataireConfig | LocataireExistantConfig;
  
  // Écritures comptables prévisionnelles
  ecrituresPrevisionnelles: EcritureComptablePreview[];
  
  // Métadonnées
  dateEffet: Date;
  statut: 'BROUILLON' | 'CONFIRME';
  createdBy?: string;
  commentaireGeneral?: string;
}

// Étapes de l'assistant
export enum EtapeAssistant {
  SELECTION_TYPE = 'SELECTION_TYPE',
  SELECTION_LOCATAIRE = 'SELECTION_LOCATAIRE',
  SELECTION_CHAMBRE = 'SELECTION_CHAMBRE',
  CONFIGURATION_FINANCIERE = 'CONFIGURATION_FINANCIERE',
  PREVIEW_ECRITURES = 'PREVIEW_ECRITURES',
  CONFIRMATION = 'CONFIRMATION'
}

// État de l'assistant
export interface AssistantState {
  etapeActuelle: EtapeAssistant;
  etapesCompletees: EtapeAssistant[];
  configuration: Partial<AssignationConfig>;
  erreurs: { [key: string]: string };
  isLoading: boolean;
  canProceed: boolean;
}

// Options pour les sélecteurs
export interface OptionSelector {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  metadata?: any;
}

// Résumé de l'assignation
export interface ResumePaiement {
  montantTotal: number;
  montantAvance: number;
  montantCaution: number;
  montantDu: number;
  montantPaye: number;
  prochainePaiement?: {
    montant: number;
    dateEcheance: Date;
    type: string;
  };
}

// Validation des étapes
export interface ValidationEtape {
  isValid: boolean;
  erreurs: string[];
  avertissements: string[];
}

// Historique financier du locataire
export interface HistoriqueFinancier {
  soldeActuel: number;
  dernierPaiement?: {
    montant: number;
    date: Date;
    type: string;
  };
  paiementsEnRetard: number;
  avancePaiement: number;
  cautionVersee: number;
}
