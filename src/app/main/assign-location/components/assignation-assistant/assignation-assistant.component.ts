import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';

import {
  AssignationConfig,
  EtapeAssistant,
  AssistantState,
  TypeLocataire,
  NouveauLocataireConfig,
  LocataireExistantConfig,
  EcritureComptablePreview,
  ResumeEcritures,
  TypePaiementInitial
} from 'src/app/shared/models/assignation-assistant.model';

import { AssignationAssistantService } from 'src/app/shared/services/assignation-assistant.service';
import {
  PropertyModel,
  RoomModel,
  LocataireModel,
  RoomState,
  LocataireState,
  LocataireAction,
  RoomAction
} from 'src/app/shared/store';

@Component({
  selector: 'assignation-assistant',
  templateUrl: './assignation-assistant.component.html',
  styleUrls: ['./assignation-assistant.component.css']
})
export class AssignationAssistantComponent implements OnInit, OnDestroy {
  
  @Input() property: PropertyModel;
  @Input() isVisible: boolean = false;
  @Input() preselectedRoom?: RoomModel;
  @Input() preselectedLocataire?: LocataireModel;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<AssignationConfig>();

  // Sélecteurs NGXS (seront initialisés dans ngOnInit avec le propertyId)
  rooms$: Observable<RoomModel[]>;
  locataires$: Observable<LocataireModel[]>;

  // État de l'assistant
  assistantState: AssistantState = {
    etapeActuelle: EtapeAssistant.SELECTION_TYPE,
    etapesCompletees: [],
    configuration: {},
    erreurs: {},
    isLoading: false,
    canProceed: false
  };

  // Énumérations pour le template
  EtapeAssistant = EtapeAssistant;
  TypeLocataire = TypeLocataire;
  Object = Object; // Pour utiliser Object.keys et Object.values dans le template

  // Formulaires pour chaque étape
  typeForm: FormGroup;
  locataireForm: FormGroup;
  chambreForm: FormGroup;
  configFinanciereForm: FormGroup;

  // Données
  roomsList: RoomModel[] = [];
  locatairesList: LocataireModel[] = [];
  selectedRoom: RoomModel | null = null;

  // Écritures comptables
  ecrituresPrevisionnelles: EcritureComptablePreview[] = [];
  resumeEcritures: ResumeEcritures | null = null;
  
  // Étapes de l'assistant
  etapes = [
    { 
      id: EtapeAssistant.SELECTION_TYPE, 
      label: 'Type d\'assignation', 
      icon: 'user-follow',
      description: 'Choisissez le type de locataire'
    },
    { 
      id: EtapeAssistant.SELECTION_LOCATAIRE, 
      label: 'Locataire', 
      icon: 'user',
      description: 'Sélectionnez le locataire'
    },
    { 
      id: EtapeAssistant.SELECTION_CHAMBRE, 
      label: 'Chambre', 
      icon: 'home',
      description: 'Choisissez la chambre'
    },
    { 
      id: EtapeAssistant.CONFIGURATION_FINANCIERE, 
      label: 'Configuration', 
      icon: 'currency-dollar',
      description: 'Configurez les aspects financiers'
    },
    { 
      id: EtapeAssistant.PREVIEW_ECRITURES, 
      label: 'Aperçu', 
      icon: 'document',
      description: 'Vérifiez les écritures comptables'
    },
    { 
      id: EtapeAssistant.CONFIRMATION, 
      label: 'Confirmation', 
      icon: 'checkmark',
      description: 'Confirmez l\'assignation'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private toastr: ToastrService,
    private assistantService: AssignationAssistantService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeSelectors();
    this.loadData();
    this.setupFormSubscriptions();

    // Pré-sélections si fournies
    if (this.preselectedRoom) {
      this.assistantState.configuration.chambreId = this.preselectedRoom._id;
      this.chambreForm.patchValue({ chambreId: this.preselectedRoom._id });
      this.selectedRoom = this.preselectedRoom;
    }
    if (this.preselectedLocataire) {
      this.assistantState.configuration.locataireId = this.preselectedLocataire._id;
      this.locataireForm.patchValue({ locataireId: this.preselectedLocataire._id });
    }
  }

  private initializeSelectors(): void {
    if (this.property?._id) {
      // S'assurer que les données sont chargées
      this.store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.property._id));
      this.store.dispatch(new LocataireAction.FetchLocatairesByPropertyId(this.property._id));

      // Initialiser les sélecteurs avec le propertyId
      this.rooms$ = this.store.select(RoomState.selectStateRoomByPropertyId(this.property._id));
      this.locataires$ = this.store.select(LocataireState.selectStateFreeLocataireByPropertyId(this.property._id));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Formulaire de sélection du type
    this.typeForm = this.formBuilder.group({
      typeLocataire: [TypeLocataire.NOUVEAU, Validators.required]
    });

    // Formulaire de sélection du locataire
    this.locataireForm = this.formBuilder.group({
      locataireId: [null, Validators.required]
    });

    // Formulaire de sélection de la chambre
    this.chambreForm = this.formBuilder.group({
      chambreId: [null, Validators.required]
    });

    // Écouter les changements de sélection de chambre
    this.chambreForm.get('chambreId')?.valueChanges.subscribe(() => {
      this.updateSelectedRoom();
    });

    // Formulaire de configuration financière
    this.configFinanciereForm = this.formBuilder.group({
      // Champs communs
      dateEntree: [new Date(), Validators.required],
      commentaire: [''],
      
      // Champs pour nouveau locataire
      paiementMontant: [0, [Validators.required, Validators.min(0)]],
      prendreEnCompteCaution: [true], // Switcher pour activer/désactiver la caution

      // Champs pour locataire existant
      situationActuelle: ['A_JOUR'],
      soldeActuel: [0],
      cautionVersee: [0],
      cautionExistanteActive: [true], // Switcher pour caution existante
      transfererHistorique: [true],
      ajustementType: [''],
      ajustementMontant: [0],
      ajustementMotif: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Écouter les changements du type de locataire
    this.typeForm.get('typeLocataire').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.assistantState.configuration.typeAssignation = type;
        this.updateFormValidators();
        this.validateCurrentStep();
      });

    // Écouter les changements des autres formulaires
    this.locataireForm.get('locataireId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(locataireId => {
        this.assistantState.configuration.locataireId = locataireId;
        this.validateCurrentStep();
      });

    this.chambreForm.get('chambreId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(chambreId => {
        this.assistantState.configuration.chambreId = chambreId;
        this.updateSelectedRoom();
        this.validateCurrentStep();
      });

    this.configFinanciereForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Mettre à jour la date d'effet
        const dateEntree = this.configFinanciereForm.get('dateEntree')?.value;
        if (dateEntree) {
          this.assistantState.configuration.dateEffet = dateEntree;
        }

        this.validateCurrentStep();
        this.calculerEcrituresComptables();
      });

    // Écouter spécifiquement les changements des switchers de caution
    this.configFinanciereForm.get('prendreEnCompteCaution')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerEcrituresComptables();
      });

    this.configFinanciereForm.get('cautionExistanteActive')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.calculerEcrituresComptables();
      });
  }

  private loadData(): void {
    if (!this.property || !this.rooms$ || !this.locataires$) return;

    // Charger les chambres libres
    this.rooms$.pipe(takeUntil(this.destroy$))
      .subscribe(rooms => {
        this.roomsList = rooms ? rooms.filter(room => room.isFree) : [];
        console.log('Chambres libres chargées:', this.roomsList);
      });

    // Charger les locataires libres
    this.locataires$.pipe(takeUntil(this.destroy$))
      .subscribe(locataires => {
        this.locatairesList = locataires || [];
        console.log('Locataires libres chargés:', this.locatairesList);
      });
  }

  private updateFormValidators(): void {
    const typeLocataire = this.typeForm.get('typeLocataire').value;

    // Réinitialiser tous les validateurs
    this.configFinanciereForm.get('paiementMontant')?.clearValidators();
    this.configFinanciereForm.get('soldeActuel')?.clearValidators();
    this.configFinanciereForm.get('cautionVersee')?.clearValidators();

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      // Pour un nouveau locataire, le montant perçu est obligatoire
      this.configFinanciereForm.get('paiementMontant')?.setValidators([
        Validators.required,
        Validators.min(0)
      ]);
    } else {
      // Pour un locataire existant, on peut avoir un solde négatif (arriérés)
      this.configFinanciereForm.get('soldeActuel')?.setValidators([Validators.required]);
      this.configFinanciereForm.get('cautionVersee')?.setValidators([Validators.min(0)]);
    }

    // Mettre à jour la validité
    this.configFinanciereForm.get('paiementMontant')?.updateValueAndValidity();
    this.configFinanciereForm.get('soldeActuel')?.updateValueAndValidity();
    this.configFinanciereForm.get('cautionVersee')?.updateValueAndValidity();
  }

  // Navigation entre les étapes
  allerEtapeSuivante(): void {
    if (!this.assistantState.canProceed) return;

    const etapeActuelle = this.assistantState.etapeActuelle;
    const indexActuel = this.etapes.findIndex(e => e.id === etapeActuelle);
    
    if (indexActuel < this.etapes.length - 1) {
      // Marquer l'étape actuelle comme complétée
      if (!this.assistantState.etapesCompletees.includes(etapeActuelle)) {
        this.assistantState.etapesCompletees.push(etapeActuelle);
      }
      
      // Passer à l'étape suivante
      this.assistantState.etapeActuelle = this.etapes[indexActuel + 1].id;

      // Si on passe à l'étape de prévisualisation, calculer les écritures
      if (this.assistantState.etapeActuelle === EtapeAssistant.PREVIEW_ECRITURES) {
        this.calculerEcrituresComptables();
      }

      this.validateCurrentStep();
    }
  }

  allerEtapePrecedente(): void {
    const indexActuel = this.etapes.findIndex(e => e.id === this.assistantState.etapeActuelle);
    
    if (indexActuel > 0) {
      this.assistantState.etapeActuelle = this.etapes[indexActuel - 1].id;
      this.validateCurrentStep();
    }
  }

  allerEtape(etape: EtapeAssistant): void {
    // Permettre de revenir aux étapes déjà complétées
    if (this.assistantState.etapesCompletees.includes(etape)) {
      this.assistantState.etapeActuelle = etape;
      this.validateCurrentStep();
    }
  }

  private validateCurrentStep(): void {
    let isValid = false;
    let errors: string[] = [];

    switch (this.assistantState.etapeActuelle) {
      case EtapeAssistant.SELECTION_TYPE:
        isValid = this.typeForm.valid;
        if (!isValid) {
          errors.push('Veuillez sélectionner un type d\'assignation');
        }
        break;

      case EtapeAssistant.SELECTION_LOCATAIRE:
        isValid = this.locataireForm.valid && this.locatairesList.length > 0;
        if (!this.locataireForm.valid) {
          errors.push('Veuillez sélectionner un locataire');
        }
        if (this.locatairesList.length === 0) {
          errors.push('Aucun locataire disponible. Créez d\'abord un locataire.');
        }
        break;

      case EtapeAssistant.SELECTION_CHAMBRE:
        isValid = this.chambreForm.valid && this.roomsList.length > 0;
        if (!this.chambreForm.valid) {
          errors.push('Veuillez sélectionner une chambre');
        }
        if (this.roomsList.length === 0) {
          errors.push('Aucune chambre libre disponible');
        }
        break;

      case EtapeAssistant.CONFIGURATION_FINANCIERE:
        isValid = this.configFinanciereForm.valid;
        if (!isValid) {
          const typeLocataire = this.typeForm.get('typeLocataire')?.value;
          if (typeLocataire === TypeLocataire.NOUVEAU) {
            const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value;
            if (!montantPercu || montantPercu < 0) {
              errors.push('Veuillez saisir le montant effectivement perçu');
            }
          } else {
            if (!this.configFinanciereForm.get('soldeActuel')?.valid) {
              errors.push('Veuillez saisir le solde actuel du locataire');
            }
          }
        }
        break;

      case EtapeAssistant.PREVIEW_ECRITURES:
        // Vérifier que les écritures ont été générées
        isValid = this.ecrituresPrevisionnelles.length > 0;
        if (!isValid) {
          errors.push('Impossible de générer les écritures comptables');
        }
        break;

      case EtapeAssistant.CONFIRMATION:
        isValid = true;
        break;
    }

    this.assistantState.canProceed = isValid;
    // Convertir le tableau d'erreurs en objet pour correspondre à l'interface
    this.assistantState.erreurs = errors.reduce((acc, error, index) => {
      acc[`error_${index}`] = error;
      return acc;
    }, {} as { [key: string]: string });
  }

  // Actions
  fermerAssistant(): void {
    this.onClose.emit();
  }

  confirmerAssignation(): void {
    // TODO: Implémenter la logique de confirmation
    this.assistantState.isLoading = true;
    
    // Construire la configuration finale
    const config: AssignationConfig = {
      locataireId: this.locataireForm.get('locataireId').value,
      chambreId: this.chambreForm.get('chambreId').value,
      propertyId: this.property._id,
      typeAssignation: this.typeForm.get('typeLocataire').value,
      configurationFinanciere: this.buildConfigurationFinanciere(),
      ecrituresPrevisionnelles: [],
      dateEffet: this.configFinanciereForm.get('dateEntree').value,
      statut: 'CONFIRME'
    };

    // Émettre le succès
    setTimeout(() => {
      this.assistantState.isLoading = false;
      this.onSuccess.emit(config);
      this.toastr.success('Assignation créée avec succès', 'Succès');
    }, 1000);
  }

  private buildConfigurationFinanciere(): NouveauLocataireConfig | LocataireExistantConfig {
    const typeLocataire = this.typeForm.get('typeLocataire').value;

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value || 0;
      const cautionActive = this.getActiveCautionAmount();

      // Déterminer le type de paiement selon l'état du switcher
      let typePaiement = TypePaiementInitial.AVANCE_SEULE;
      if (this.isCautionActive()) {
        typePaiement = TypePaiementInitial.AVANCE_PLUS_CAUTION;
      }

      return {
        montantAvance: 0, // Pas utilisé dans la nouvelle logique
        montantCaution: cautionActive,
        paiementInitial: {
          montant: montantPercu,
          type: typePaiement,
          repartition: {
            avance: Math.max(0, montantPercu - cautionActive),
            caution: Math.min(montantPercu, cautionActive)
          }
        },
        dateEntree: this.configFinanciereForm.get('dateEntree')?.value || new Date(),
        generateFacture: true,
        commentaire: this.configFinanciereForm.get('commentaire')?.value || ''
      } as NouveauLocataireConfig;
    } else {
      // Pour locataire existant, ne prendre en compte la caution que si le switcher est activé
      const cautionVersee = this.configFinanciereForm.get('cautionVersee')?.value || 0;
      const cautionActive = this.configFinanciereForm.get('cautionExistanteActive')?.value;

      return {
        situationActuelle: this.configFinanciereForm.get('situationActuelle')?.value || '',
        soldeActuel: this.configFinanciereForm.get('soldeActuel')?.value || 0,
        cautionVersee: cautionActive ? cautionVersee : 0, // Caution selon le switcher
        dateEntree: this.configFinanciereForm.get('dateEntree')?.value || new Date(),
        transfererHistorique: this.configFinanciereForm.get('transfererHistorique')?.value || true,
        commentaire: this.configFinanciereForm.get('commentaire')?.value || ''
      } as LocataireExistantConfig;
    }
  }

  // Utilitaires pour le template
  isEtapeActive(etape: EtapeAssistant): boolean {
    return this.assistantState.etapeActuelle === etape;
  }

  isEtapeCompletee(etape: EtapeAssistant): boolean {
    return this.assistantState.etapesCompletees.includes(etape);
  }

  getEtapeIndex(etape: EtapeAssistant): number {
    return this.etapes.findIndex(e => e.id === etape) + 1;
  }

  /**
   * Calculer les écritures comptables prévisionnelles
   */
  private calculerEcrituresComptables(): void {
    // Vérifier que nous avons toutes les données nécessaires
    if (!this.assistantState.configuration.chambreId ||
        !this.assistantState.configuration.locataireId ||
        !this.assistantState.configuration.typeAssignation) {
      this.ecrituresPrevisionnelles = [];
      this.resumeEcritures = null;
      return;
    }

    // Récupérer la chambre sélectionnée
    const chambre = this.roomsList.find(r => r._id === this.assistantState.configuration.chambreId);
    if (!chambre) {
      this.ecrituresPrevisionnelles = [];
      this.resumeEcritures = null;
      return;
    }

    // Construire la configuration d'assignation
    const config: AssignationConfig = {
      locataireId: this.assistantState.configuration.locataireId,
      chambreId: this.assistantState.configuration.chambreId,
      propertyId: this.property._id,
      typeAssignation: this.assistantState.configuration.typeAssignation,
      dateEffet: this.assistantState.configuration.dateEffet || new Date(),
      configurationFinanciere: this.buildConfigurationFinanciere(),
      ecrituresPrevisionnelles: [], // Sera rempli par le service
      statut: 'BROUILLON'
    };

    // Générer les écritures comptables
    console.log('Configuration pour génération écritures:', config);
    console.log('Chambre sélectionnée:', chambre);

    this.ecrituresPrevisionnelles = this.assistantService.genererEcrituresComptables(config, chambre);
    this.resumeEcritures = this.assistantService.genererResumeEcritures(this.ecrituresPrevisionnelles);

    console.log('Écritures comptables calculées:', this.ecrituresPrevisionnelles);
    console.log('Résumé des écritures:', this.resumeEcritures);
  }

  // Calculer le montant restant après déduction de la caution
  calculateRemainingAmount(): number {
    const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value || 0;
    const cautionActive = this.getActiveCautionAmount();
    return Math.max(0, montantPercu - cautionActive);
  }

  // Vérifier si la caution est active
  isCautionActive(): boolean {
    const typeLocataire = this.typeForm.get('typeLocataire')?.value;

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      return this.configFinanciereForm.get('prendreEnCompteCaution')?.value &&
             this.selectedRoom?.cautionPrice > 0;
    } else {
      return this.configFinanciereForm.get('cautionExistanteActive')?.value &&
             this.configFinanciereForm.get('cautionVersee')?.value > 0;
    }
  }

  // Obtenir le montant de la caution active
  getActiveCautionAmount(): number {
    if (!this.isCautionActive()) {
      return 0;
    }

    const typeLocataire = this.typeForm.get('typeLocataire')?.value;

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      return this.selectedRoom?.cautionPrice || 0;
    } else {
      return this.configFinanciereForm.get('cautionVersee')?.value || 0;
    }
  }

  // Mettre à jour la chambre sélectionnée
  private updateSelectedRoom(): void {
    const roomId = this.chambreForm.get('chambreId')?.value;
    this.selectedRoom = this.roomsList.find(room => room._id === roomId) || null;
  }

  // Méthodes utilitaires
  private resetForms(): void {
    this.typeForm.reset();
    this.locataireForm.reset();
    this.chambreForm.reset();
    this.configFinanciereForm.reset();
    this.selectedRoom = null;
  }
}
