import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AssignationConfig,
  EcritureComptablePreview,
  NouveauLocataireConfig,
  LocataireExistantConfig,
  TypeLocataire,
  TypePaiementInitial,
  TypeEcritureComptable,
  ValidationEtape,
  ResumePaiement,
  HistoriqueFinancier,
  ResumeEcritures
} from '../models/assignation-assistant.model';
import { LocataireModel, RoomModel } from '../store';

@Injectable({
  providedIn: 'root'
})
export class AssignationAssistantService {

  constructor() { }

  /**
   * Calcule les écritures comptables prévisionnelles pour un nouveau locataire
   */
  calculerEcrituresNouveauLocataire(config: NouveauLocataireConfig): EcritureComptablePreview[] {
    const ecritures: EcritureComptablePreview[] = [];
    const { montantAvance, montantCaution, paiementInitial } = config;

    // Créer les dettes initiales
    if (montantAvance > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_AVANCE,
        libelle: 'Dette avance de loyer',
        montant: montantAvance,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Dette initiale pour l'avance de loyer`
      });
    }

    if (montantCaution > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_CAUTION,
        libelle: 'Dette caution',
        montant: montantCaution,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Dette initiale pour la caution`
      });
    }

    // Traiter le paiement initial s'il existe
    if (paiementInitial.montant > 0) {
      switch (paiementInitial.type) {
        case TypePaiementInitial.AVANCE_SEULE:
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_AVANCE,
            libelle: 'Paiement avance de loyer',
            montant: paiementInitial.montant,
            sens: 'CREDIT',
            compte: 'CAISSE',
            description: 'Paiement de l\'avance de loyer'
          });
          break;

        case TypePaiementInitial.CAUTION_SEULE:
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_CAUTION,
            libelle: 'Paiement caution',
            montant: paiementInitial.montant,
            sens: 'CREDIT',
            compte: 'CAISSE',
            description: 'Paiement de la caution'
          });
          break;

        case TypePaiementInitial.AVANCE_PLUS_CAUTION:
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_AVANCE,
            libelle: 'Paiement avance de loyer',
            montant: montantAvance,
            sens: 'CREDIT',
            compte: 'CAISSE',
            description: 'Paiement de l\'avance de loyer'
          });
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_CAUTION,
            libelle: 'Paiement caution',
            montant: montantCaution,
            sens: 'CREDIT',
            compte: 'CAISSE',
            description: 'Paiement de la caution'
          });
          break;

        case TypePaiementInitial.PARTIEL:
          if (paiementInitial.repartition) {
            if (paiementInitial.repartition.avance > 0) {
              ecritures.push({
                type: TypeEcritureComptable.PAIEMENT_AVANCE,
                libelle: 'Paiement partiel avance',
                montant: paiementInitial.repartition.avance,
                sens: 'CREDIT',
                compte: 'CAISSE',
                description: 'Paiement partiel de l\'avance'
              });
            }
            if (paiementInitial.repartition.caution > 0) {
              ecritures.push({
                type: TypeEcritureComptable.PAIEMENT_CAUTION,
                libelle: 'Paiement partiel caution',
                montant: paiementInitial.repartition.caution,
                sens: 'CREDIT',
                compte: 'CAISSE',
                description: 'Paiement partiel de la caution'
              });
            }
          }
          break;
      }
    }

    return ecritures;
  }

  /**
   * Calcule les écritures comptables pour un locataire existant
   */
  calculerEcrituresLocataireExistant(config: LocataireExistantConfig): EcritureComptablePreview[] {
    const ecritures: EcritureComptablePreview[] = [];

    // Report du solde existant
    if (config.soldeActuel !== 0) {
      ecritures.push({
        type: TypeEcritureComptable.REPORT_SOLDE,
        libelle: config.soldeActuel > 0 ? 'Report solde créditeur' : 'Report solde débiteur',
        montant: Math.abs(config.soldeActuel),
        sens: config.soldeActuel > 0 ? 'CREDIT' : 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Report du solde existant: ${config.soldeActuel} FCFA`
      });
    }

    // Ajustements si nécessaires
    if (config.ajustements) {
      ecritures.push({
        type: TypeEcritureComptable.REGULARISATION,
        libelle: `Régularisation: ${config.ajustements.motif}`,
        montant: config.ajustements.montant,
        sens: config.ajustements.type === 'REGULARISATION' ? 'CREDIT' : 'DEBIT',
        compte: 'REGULARISATION',
        description: config.ajustements.motif
      });
    }

    return ecritures;
  }

  /**
   * Valide une étape de l'assistant
   */
  validerEtape(etape: string, data: any): ValidationEtape {
    const validation: ValidationEtape = {
      isValid: true,
      erreurs: [],
      avertissements: []
    };

    switch (etape) {
      case 'SELECTION_LOCATAIRE':
        if (!data.locataireId) {
          validation.erreurs.push('Vous devez sélectionner un locataire');
          validation.isValid = false;
        }
        break;

      case 'SELECTION_CHAMBRE':
        if (!data.chambreId) {
          validation.erreurs.push('Vous devez sélectionner une chambre');
          validation.isValid = false;
        }
        break;

      case 'CONFIGURATION_FINANCIERE':
        if (data.typeLocataire === TypeLocataire.NOUVEAU) {
          const config = data as NouveauLocataireConfig;
          if (config.montantAvance <= 0) {
            validation.erreurs.push('Le montant de l\'avance doit être supérieur à 0');
            validation.isValid = false;
          }
          if (config.paiementInitial.montant > (config.montantAvance + config.montantCaution)) {
            validation.erreurs.push('Le paiement initial ne peut pas dépasser le total avance + caution');
            validation.isValid = false;
          }
        }
        break;
    }

    return validation;
  }

  /**
   * Calcule le résumé des paiements
   */
  calculerResumePaiement(config: AssignationConfig): ResumePaiement {
    let montantTotal = 0;
    let montantAvance = 0;
    let montantCaution = 0;
    let montantPaye = 0;

    if (config.typeAssignation === TypeLocataire.NOUVEAU) {
      const nouvelleConfig = config.configurationFinanciere as NouveauLocataireConfig;
      montantAvance = nouvelleConfig.montantAvance;
      montantCaution = nouvelleConfig.montantCaution;
      montantPaye = nouvelleConfig.paiementInitial.montant;
    } else {
      const existantConfig = config.configurationFinanciere as LocataireExistantConfig;
      montantPaye = existantConfig.soldeActuel > 0 ? existantConfig.soldeActuel : 0;
    }

    montantTotal = montantAvance + montantCaution;
    const montantDu = montantTotal - montantPaye;

    return {
      montantTotal,
      montantAvance,
      montantCaution,
      montantDu,
      montantPaye,
      prochainePaiement: montantDu > 0 ? {
        montant: montantDu,
        dateEcheance: new Date(),
        type: 'Solde restant'
      } : undefined
    };
  }

  /**
   * Récupère l'historique financier d'un locataire
   */
  getHistoriqueFinancier(locataireId: string): Observable<HistoriqueFinancier> {
    // TODO: Implémenter l'appel API réel
    return of({
      soldeActuel: 0,
      dernierPaiement: undefined,
      paiementsEnRetard: 0,
      avancePaiement: 0,
      cautionVersee: 0
    });
  }

  /**
   * Vérifie si un locataire peut être assigné à une chambre
   */
  verifierCompatibilite(locataire: LocataireModel, chambre: RoomModel): Observable<ValidationEtape> {
    const validation: ValidationEtape = {
      isValid: true,
      erreurs: [],
      avertissements: []
    };

    // Vérifier si la chambre est libre
    if (!chambre.isFree) {
      validation.erreurs.push('Cette chambre est déjà occupée');
      validation.isValid = false;
    }

    // Vérifier si le locataire n'est pas déjà assigné
    if (locataire.room) {
      validation.avertissements.push('Ce locataire est déjà assigné à une autre chambre');
    }

    return of(validation);
  }

  /**
   * Génère un code de référence pour l'assignation
   */
  genererCodeReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ASS-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Générer les écritures comptables prévisionnelles
   */
  genererEcrituresComptables(config: AssignationConfig, chambre: RoomModel): EcritureComptablePreview[] {
    console.log('🧮 Génération écritures comptables - Début:', { config, chambre });

    try {
      const ecritures: EcritureComptablePreview[] = [];

      // Vérifications de base
      if (!config) {
        throw new Error('Configuration d\'assignation manquante');
      }

      if (!config.configurationFinanciere) {
        throw new Error('Configuration financière manquante');
      }

      if (!chambre) {
        throw new Error('Chambre manquante');
      }

      console.log('📋 Type d\'assignation:', config.typeAssignation);
      console.log('💰 Configuration financière:', config.configurationFinanciere);

      switch (config.typeAssignation) {
        case TypeLocataire.NOUVEAU:
          console.log('👤 Traitement nouveau locataire...');
          ecritures.push(...this.genererEcrituresNouveauLocataire(config.configurationFinanciere as NouveauLocataireConfig, chambre));
          break;
        case TypeLocataire.EXISTANT:
          console.log('👤 Traitement locataire existant...');
          ecritures.push(...this.genererEcrituresLocataireExistant(config.configurationFinanciere as LocataireExistantConfig, chambre));
          break;
        case TypeLocataire.MIGRATION:
          console.log('👤 Traitement migration...');
          ecritures.push(...this.genererEcrituresMigration(config.configurationFinanciere as LocataireExistantConfig, chambre));
          break;
        default:
          throw new Error(`Type d'assignation non supporté: ${config.typeAssignation}`);
      }

      console.log('✅ Écritures générées avec succès:', ecritures);
      return ecritures;

    } catch (error) {
      console.error('❌ Erreur lors de la génération des écritures:', error);
      throw new Error(`Impossible de générer les écritures comptables: ${error.message}`);
    }
  }

  /**
   * Générer un résumé des écritures comptables
   */
  genererResumeEcritures(ecritures: EcritureComptablePreview[]): ResumeEcritures {
    const totalDebits = ecritures
      .filter(e => e.sens === 'DEBIT')
      .reduce((sum, e) => sum + e.montant, 0);

    const totalCredits = ecritures
      .filter(e => e.sens === 'CREDIT')
      .reduce((sum, e) => sum + e.montant, 0);

    return {
      totalDebits,
      totalCredits,
      equilibre: Math.abs(totalDebits - totalCredits) < 0.01, // Tolérance pour les arrondis
      ecritures
    };
  }

  /**
   * Écritures pour un nouveau locataire
   */
  private genererEcrituresNouveauLocataire(config: NouveauLocataireConfig, chambre: RoomModel): EcritureComptablePreview[] {
    console.log('🆕 Génération écritures nouveau locataire:', { config, chambre });

    const ecritures: EcritureComptablePreview[] = [];

    // Vérifications de sécurité
    if (!config) {
      console.error('❌ Configuration manquante pour nouveau locataire');
      throw new Error('Configuration manquante pour nouveau locataire');
    }

    if (!config.paiementInitial) {
      console.error('❌ Paiement initial manquant dans la configuration:', config);
      throw new Error('Paiement initial manquant dans la configuration');
    }

    if (!chambre) {
      console.error('❌ Chambre manquante');
      throw new Error('Chambre manquante pour la génération des écritures');
    }

    console.log('💰 Paiement initial:', config.paiementInitial);

    // Calculer l'état financier selon la date d'entrée et les paiements
    const dateEntree = new Date(config.dateEntree);
    const aujourdhui = new Date();
    const montantPaye = config.paiementInitial.montant;

    // Calculer combien de mois sont couverts par le paiement (hors caution)
    const montantCaution = chambre.shouldPayCaution ? chambre.cautionPrice : 0;
    const montantPourLoyer = Math.max(0, montantPaye - montantCaution);
    const moisCouverts = Math.floor(montantPourLoyer / chambre.price);

    console.log('📊 Calcul financier:', {
      dateEntree,
      aujourdhui,
      montantPaye,
      montantCaution,
      montantPourLoyer,
      moisCouverts,
      prixMensuel: chambre.price
    });

    // Pour un nouveau locataire, on crée seulement une transaction de paiement
    // Les calculs de dette/crédit se feront automatiquement par le système de location
    if (montantPourLoyer > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_AVANCE,
        libelle: `Paiement initial - Avance de loyer`,
        montant: montantPourLoyer,
        sens: 'CREDIT',
        compte: '512000', // Banque
        description: `Paiement initial de ${montantPourLoyer} FCFA - Chambre ${chambre.code}`
      });
    }

    // Gestion de la caution (seulement si payée)
    if (chambre.shouldPayCaution && chambre.cautionPrice > 0 && montantPaye >= montantCaution && montantCaution > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_CAUTION,
        libelle: 'Paiement caution',
        montant: montantCaution,
        sens: 'CREDIT',
        compte: '512000', // Banque
        description: `Caution payée - Chambre ${chambre.code}`
      });
    }

    // Paiement initial s'il y en a un
    if (config.paiementInitial.montant > 0) {
      switch (config.paiementInitial.type) {
        case TypePaiementInitial.AVANCE_SEULE:
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_AVANCE,
            libelle: 'Paiement avance de loyer',
            montant: config.paiementInitial.montant,
            sens: 'DEBIT',
            compte: '512000', // Banque
            description: `Avance de loyer - Chambre ${chambre.code}`
          });
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_AVANCE,
            libelle: 'Avance de loyer reçue',
            montant: config.paiementInitial.montant,
            sens: 'CREDIT',
            compte: '467000', // Avances reçues
            description: `Avance de loyer - Chambre ${chambre.code}`
          });
          break;

        case TypePaiementInitial.CAUTION_SEULE:
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_CAUTION,
            libelle: 'Paiement caution',
            montant: config.paiementInitial.montant,
            sens: 'DEBIT',
            compte: '512000', // Banque
            description: `Caution - Chambre ${chambre.code}`
          });
          ecritures.push({
            type: TypeEcritureComptable.PAIEMENT_CAUTION,
            libelle: 'Caution reçue',
            montant: config.paiementInitial.montant,
            sens: 'CREDIT',
            compte: '165000', // Dépôts et cautionnements
            description: `Caution - Chambre ${chambre.code}`
          });
          break;

        case TypePaiementInitial.AVANCE_PLUS_CAUTION:
          // Écriture pour la caution
          if (config.paiementInitial.repartition?.caution > 0) {
            ecritures.push({
              type: TypeEcritureComptable.PAIEMENT_CAUTION,
              libelle: 'Paiement caution',
              montant: config.paiementInitial.repartition.caution,
              sens: 'DEBIT',
              compte: '512000', // Banque
              description: `Caution - Chambre ${chambre.code}`
            });
            ecritures.push({
              type: TypeEcritureComptable.PAIEMENT_CAUTION,
              libelle: 'Caution reçue',
              montant: config.paiementInitial.repartition.caution,
              sens: 'CREDIT',
              compte: '165000', // Dépôts et cautionnements
              description: `Caution - Chambre ${chambre.code}`
            });
          }

          // Écriture pour l'avance (reste après caution)
          if (config.paiementInitial.repartition?.avance > 0) {
            ecritures.push({
              type: TypeEcritureComptable.PAIEMENT_AVANCE,
              libelle: 'Paiement avance de loyer',
              montant: config.paiementInitial.repartition.avance,
              sens: 'DEBIT',
              compte: '512000', // Banque
              description: `Avance de loyer - Chambre ${chambre.code}`
            });
            ecritures.push({
              type: TypeEcritureComptable.PAIEMENT_AVANCE,
              libelle: 'Avance de loyer reçue',
              montant: config.paiementInitial.repartition.avance,
              sens: 'CREDIT',
              compte: '467000', // Avances reçues
              description: `Avance de loyer - Chambre ${chambre.code}`
            });
          }
          break;
      }
    }

    return ecritures;
  }

  /**
   * Écritures pour un locataire existant
   */
  private genererEcrituresLocataireExistant(config: LocataireExistantConfig, chambre: RoomModel): EcritureComptablePreview[] {
    console.log('🔄 Génération écritures locataire existant:', { config, chambre });

    const ecritures: EcritureComptablePreview[] = [];
    const dateEntree = new Date(config.dateEntree);
    const aujourdhui = new Date();

    // Calculer le nombre de mois écoulés depuis l'entrée
    const moisEcoules = Math.ceil((aujourdhui.getTime() - dateEntree.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const montantDuTotal = moisEcoules * chambre.price;

    console.log('📊 Calcul locataire existant:', {
      dateEntree,
      aujourdhui,
      moisEcoules,
      prixMensuel: chambre.price,
      montantDuTotal,
      soldeActuel: config.soldeActuel
    });

    // Dette totale pour les mois écoulés
    ecritures.push({
      type: TypeEcritureComptable.DETTE_AVANCE,
      libelle: `Dette loyer (${moisEcoules} mois écoulés)`,
      montant: montantDuTotal,
      sens: 'DEBIT',
      compte: 'DETTE_LOCATAIRE',
      description: `Loyer dû depuis ${dateEntree.toLocaleDateString()} - Chambre ${chambre.code}`
    });

    // Paiements effectués (calculés à partir du solde)
    const montantPaye = montantDuTotal + config.soldeActuel; // Si solde négatif, moins de paiements
    if (montantPaye > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_AVANCE,
        libelle: 'Paiements effectués',
        montant: montantPaye,
        sens: 'CREDIT',
        compte: '512000',
        description: `Paiements cumulés - Chambre ${chambre.code}`
      });
    }

    // Gestion de la caution
    if (chambre.shouldPayCaution && chambre.cautionPrice > 0) {
      // Dette de caution
      ecritures.push({
        type: TypeEcritureComptable.DETTE_CAUTION,
        libelle: 'Dette caution',
        montant: chambre.cautionPrice,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Caution requise - Chambre ${chambre.code}`
      });

      // Caution versée si configurée
      if (config.cautionVersee > 0) {
        ecritures.push({
          type: TypeEcritureComptable.PAIEMENT_CAUTION,
          libelle: 'Caution versée',
          montant: config.cautionVersee,
          sens: 'CREDIT',
          compte: '165000',
          description: `Caution existante - Chambre ${chambre.code}`
        });
      }
    }

    console.log('✅ Écritures locataire existant générées:', ecritures);
    return ecritures;
  }

  /**
   * Écritures pour une migration
   */
  private genererEcrituresMigration(config: LocataireExistantConfig, chambre: RoomModel): EcritureComptablePreview[] {
    // Pour une migration, on utilise la même logique que pour un locataire existant
    const ecritures = this.genererEcrituresLocataireExistant(config, chambre);

    // Modifier les libellés pour indiquer qu'il s'agit d'une migration
    ecritures.forEach(ecriture => {
      ecriture.description = ecriture.description.replace('Chambre', 'Migration vers chambre');
    });

    return ecritures;
  }
}