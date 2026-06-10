import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AssignationConfig,
  EcritureComptablePreview,
  NouveauLocataireConfig,
  LocataireExistantConfig,
  TypeLocataire,
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

  constructor(private http: HttpClient) { }

  // ─── Génération des écritures (miroir exact de l'algo backend) ───────────

  genererEcrituresComptables(config: AssignationConfig, chambre: RoomModel): EcritureComptablePreview[] {
    if (!config || !config.configurationFinanciere || !chambre) {
      throw new Error('Configuration ou chambre manquante');
    }

    switch (config.typeAssignation) {
      case TypeLocataire.NOUVEAU:
        return this.genererEcrituresNouveauLocataire(
          config.configurationFinanciere as NouveauLocataireConfig,
          chambre,
          new Date(config.dateEffet)
        );
      case TypeLocataire.EXISTANT:
      case TypeLocataire.MIGRATION:
        return this.genererEcrituresLocataireExistant(
          config.configurationFinanciere as LocataireExistantConfig,
          chambre,
          new Date(config.dateEffet)
        );
      default:
        throw new Error(`Type d'assignation non supporte: ${config.typeAssignation}`);
    }
  }

  // ─── Nouveau locataire ────────────────────────────────────────────────────
  // Miroir de AssignationCalculatorService.calculateEcrituresNouveauLocataire

  private genererEcrituresNouveauLocataire(
    config: NouveauLocataireConfig,
    chambre: RoomModel,
    dateEffet: Date
  ): EcritureComptablePreview[] {
    const ecritures: EcritureComptablePreview[] = [];
    const aujourdhui     = new Date();
    const montantPaye    = config.paiementInitial.montant;
    const montantCaution = chambre.shouldPayCaution ? (chambre.cautionPrice || 0) : 0;
    const montantPourLoyer = Math.max(0, montantPaye - montantCaution);

    // Mois dus depuis la date d'effet (approximation anniversaire cote frontend)
    const moisDus      = this.calculerMoisDus(dateEffet, aujourdhui);
    const montantDu    = moisDus * chambre.price;

    // DEBIT : dette de loyer depuis l'entree
    if (montantDu > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_AVANCE,
        libelle: `Dette loyer (${moisDus} mois depuis l'entree)`,
        montant: montantDu,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Loyer du depuis ${dateEffet.toLocaleDateString()} - Chambre ${chambre.code}`
      });
    }

    // CREDIT : paiement initial (part loyer)
    if (montantPourLoyer > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_AVANCE,
        libelle: 'Paiement initial - Avance de loyer',
        montant: montantPourLoyer,
        sens: 'CREDIT',
        compte: '512000',
        description: `Paiement initial de ${montantPourLoyer} FCFA - Chambre ${chambre.code}`
      });
    }

    // Caution
    if (chambre.shouldPayCaution && chambre.cautionPrice > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_CAUTION,
        libelle: 'Dette caution',
        montant: chambre.cautionPrice,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Caution requise - Chambre ${chambre.code}`
      });

      if (montantPaye >= montantCaution && montantCaution > 0) {
        ecritures.push({
          type: TypeEcritureComptable.PAIEMENT_CAUTION,
          libelle: 'Paiement caution',
          montant: montantCaution,
          sens: 'CREDIT',
          compte: '512000',
          description: `Caution payee - Chambre ${chambre.code}`
        });
      }
    }

    return ecritures;
  }

  // ─── Locataire existant ───────────────────────────────────────────────────
  // Miroir de AssignationCalculatorService.calculateEcrituresLocataireExistant
  //
  // Regle date d'entree inconnue :
  //   solde < 0 (arrieres)  -> remonter de ceil(|solde|/loyer) mois dans le passe
  //   solde >= 0            -> date d'effet

  private genererEcrituresLocataireExistant(
    config: LocataireExistantConfig,
    chambre: RoomModel,
    dateEffet: Date
  ): EcritureComptablePreview[] {
    const ecritures: EcritureComptablePreview[] = [];
    const aujourdhui    = new Date();
    const soldeActuel   = config.soldeActuel   || 0;
    // cautionVersee = 0 ou room.cautionPrice selon la case cochee
    const cautionVersee = config.cautionVersee || 0;
    const dateEntree    = config.dateEntree ? new Date(config.dateEntree) : null;

    // Determination de la date d'entree effective
    let dateEntreeCalculee: Date;
    if (dateEntree) {
      dateEntreeCalculee = dateEntree;
    } else if (soldeActuel < 0) {
      // Arrieres : remonter du nombre de mois d'arrieres
      const moisArriere = chambre.price > 0 ? Math.ceil(Math.abs(soldeActuel) / chambre.price) : 1;
      dateEntreeCalculee = new Date(
        aujourdhui.getFullYear(),
        aujourdhui.getMonth() - moisArriere,
        aujourdhui.getDate()
      );
    } else {
      dateEntreeCalculee = dateEffet;
    }

    const moisEcoules    = this.calculerMoisDus(dateEntreeCalculee, aujourdhui);
    const montantDuTotal = moisEcoules * chambre.price;

    // DEBIT : dette de loyer
    if (montantDuTotal > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_AVANCE,
        libelle: `Dette loyer (${moisEcoules} mois ecoules)`,
        montant: montantDuTotal,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Loyer du depuis ${dateEntreeCalculee.toLocaleDateString()} - Chambre ${chambre.code}`
      });
    }

    // CREDIT : paiements effectues
    const montantPaye = montantDuTotal + soldeActuel;
    if (montantPaye > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_AVANCE,
        libelle: 'Paiements effectues',
        montant: montantPaye,
        sens: 'CREDIT',
        compte: '512000',
        description: `Paiements cumules - Chambre ${chambre.code}`
      });
    } else if (montantDuTotal > 0) {
      ecritures.push({
        type: TypeEcritureComptable.PAIEMENT_AVANCE,
        libelle: 'Aucun paiement enregistre',
        montant: 0,
        sens: 'CREDIT',
        compte: '512000',
        description: `Aucun paiement recu - Chambre ${chambre.code} (solde: ${soldeActuel} FCFA)`
      });
    }

    // Caution
    if (chambre.shouldPayCaution && chambre.cautionPrice > 0) {
      ecritures.push({
        type: TypeEcritureComptable.DETTE_CAUTION,
        libelle: 'Dette caution',
        montant: chambre.cautionPrice,
        sens: 'DEBIT',
        compte: 'DETTE_LOCATAIRE',
        description: `Caution requise - Chambre ${chambre.code}`
      });

      if (cautionVersee > 0) {
        ecritures.push({
          type: TypeEcritureComptable.PAIEMENT_CAUTION,
          libelle: 'Caution versee',
          montant: cautionVersee,
          sens: 'CREDIT',
          compte: '165000',
          description: `Caution existante - Chambre ${chambre.code}`
        });
      }
    }

    return ecritures;
  }

  // ─── Calcul mois dus (regle anniversaire simplifiee cote frontend) ────────
  // Compte le nombre d'anniversaires de dateEntree passés avant upToDate.
  // Offset 0 : le 1er mois est du des la date d'entree elle-meme.

  private calculerMoisDus(dateEntree: Date, upToDate: Date): number {
    if (!dateEntree || !upToDate || dateEntree > upToDate) return 0;
    let count = 0;
    const maxMois =
      (upToDate.getFullYear() - dateEntree.getFullYear()) * 12 +
      (upToDate.getMonth() - dateEntree.getMonth()) + 2;
    for (let offset = 0; offset <= maxMois; offset++) {
      const targetMonth = dateEntree.getMonth() + offset;
      const lastDay = new Date(dateEntree.getFullYear(), targetMonth + 1, 0).getDate();
      const day = Math.min(dateEntree.getDate(), lastDay);
      const ann = new Date(dateEntree.getFullYear(), targetMonth, day, 0, 0, 0, 0);
      if (ann > upToDate) break;
      count++;
    }
    return count;
  }

  // ─── Resume des ecritures ─────────────────────────────────────────────────

  genererResumeEcritures(ecritures: EcritureComptablePreview[]): ResumeEcritures {
    const totalDebits  = ecritures.filter(e => e.sens === 'DEBIT') .reduce((s, e) => s + e.montant, 0);
    const totalCredits = ecritures.filter(e => e.sens === 'CREDIT').reduce((s, e) => s + e.montant, 0);
    return {
      totalDebits,
      totalCredits,
      equilibre: Math.abs(totalDebits - totalCredits) < 0.01,
      ecritures
    };
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  validerEtape(etape: string, data: any): ValidationEtape {
    const validation: ValidationEtape = { isValid: true, erreurs: [], avertissements: [] };
    switch (etape) {
      case 'SELECTION_LOCATAIRE':
        if (!data.locataireId) { validation.erreurs.push('Vous devez selectionner un locataire'); validation.isValid = false; }
        break;
      case 'SELECTION_CHAMBRE':
        if (!data.chambreId) { validation.erreurs.push('Vous devez selectionner une chambre'); validation.isValid = false; }
        break;
    }
    return validation;
  }

  calculerResumePaiement(config: AssignationConfig): ResumePaiement {
    let montantAvance = 0, montantCaution = 0, montantPaye = 0;
    if (config.typeAssignation === TypeLocataire.NOUVEAU) {
      const c = config.configurationFinanciere as NouveauLocataireConfig;
      montantAvance  = c.montantAvance;
      montantCaution = c.montantCaution;
      montantPaye    = c.paiementInitial.montant;
    } else {
      const c = config.configurationFinanciere as LocataireExistantConfig;
      montantPaye = c.soldeActuel > 0 ? c.soldeActuel : 0;
    }
    const montantTotal = montantAvance + montantCaution;
    const montantDu    = montantTotal - montantPaye;
    return { montantTotal, montantAvance, montantCaution, montantDu, montantPaye };
  }

  getHistoriqueFinancier(locataireId: string): Observable<HistoriqueFinancier> {
    return this.http.get<HistoriqueFinancier>(`/api/locataires/${locataireId}/historique-financier`).pipe(
      catchError(() => of({ soldeActuel: 0, paiementsEnRetard: 0, avancePaiement: 0, cautionVersee: 0 }))
    );
  }

  verifierCompatibilite(locataire: LocataireModel, chambre: RoomModel): Observable<ValidationEtape> {
    const validation: ValidationEtape = { isValid: true, erreurs: [], avertissements: [] };
    if (!chambre.isFree) { validation.erreurs.push('Cette chambre est deja occupee'); validation.isValid = false; }
    if (locataire.room)  { validation.avertissements.push('Ce locataire est deja assigne a une autre chambre'); }
    return of(validation);
  }

  genererCodeReference(): string {
    const ts  = Date.now().toString(36);
    const rnd = Math.random().toString(36).substr(2, 5);
    return `ASS-${ts}-${rnd}`.toUpperCase();
  }
}
