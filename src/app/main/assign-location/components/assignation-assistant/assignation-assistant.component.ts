import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
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
  RoomAction,
  LocationAction
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
  selectedLocataire: LocataireModel | null = null;

  // Utilitaires pour le template
  Math = Math;

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

    // Pré-sélections si fournies (avec délai pour s'assurer que les données sont chargées)
    setTimeout(() => {
      this.applyPreselections();
    }, 500);
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

    // Initialiser la configuration avec la valeur par défaut
    this.assistantState.configuration.typeAssignation = TypeLocataire.NOUVEAU;

    // Formulaire de sélection du locataire
    this.locataireForm = this.formBuilder.group({
      locataireId: [null, Validators.required]
    });

    // Formulaire de sélection de la chambre
    this.chambreForm = this.formBuilder.group({
      chambreId: [null, Validators.required]
    });

    // Écouter les changements de sélection de chambre (avec gestion mémoire)
    this.chambreForm.get('chambreId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSelectedRoom();
      });

    // Formulaire de configuration financière
    this.configFinanciereForm = this.formBuilder.group({
      // Champs communs - VIDE par défaut pour forcer la saisie
      dateEntree: [null, Validators.required],
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
      ajustementMotif: [''],
      
      // Nouveau champ pour gérer la date d'entrée inconnue
      dateEntreeConnue: [true] // Par défaut, on suppose que la date est connue
    });

    // Forcer la validation dès l'initialisation
    this.assistantState.canProceed = false;
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

    // Écouter les changements de la case "Date d'entrée connue"
    this.configFinanciereForm.get('dateEntreeConnue')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(dateConnue => {
        this.onDateEntreeConnueChange(dateConnue);
        // Forcer la revalidation immédiate
        setTimeout(() => this.validateCurrentStep(), 50);
      });

    // Écouter les changements des autres formulaires
    this.locataireForm.get('locataireId').valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged() // Éviter les doublons
      )
      .subscribe(locataireId => {
        console.log('🔄 Changement locataire sélectionné:', locataireId);
        this.assistantState.configuration.locataireId = locataireId;
        this.updateSelectedLocataire();
        this.validateCurrentStep();
      });

    this.chambreForm.get('chambreId')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged() // Éviter les doublons
      )
      .subscribe(chambreId => {
        console.log('🔄 Changement chambre sélectionnée:', chambreId);
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
    this.configFinanciereForm.get('dateEntree')?.clearValidators();

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      // Pour un nouveau locataire, le montant perçu est obligatoire
      this.configFinanciereForm.get('paiementMontant')?.setValidators([
        Validators.required,
        Validators.min(0)
      ]);
      // Date d'entrée toujours requise pour nouveau locataire
      this.configFinanciereForm.get('dateEntree')?.setValidators([Validators.required]);
    } else {
      // Pour un locataire existant, on peut avoir un solde négatif (arriérés)
      this.configFinanciereForm.get('soldeActuel')?.setValidators([Validators.required]);
      this.configFinanciereForm.get('cautionVersee')?.setValidators([Validators.min(0)]);
      
      // Date d'entrée conditionnelle selon la case cochée
      const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
      if (dateEntreeConnue) {
        this.configFinanciereForm.get('dateEntree')?.setValidators([Validators.required]);
      }
    }

    // Mettre à jour la validité
    this.configFinanciereForm.get('paiementMontant')?.updateValueAndValidity();
    this.configFinanciereForm.get('soldeActuel')?.updateValueAndValidity();
    this.configFinanciereForm.get('cautionVersee')?.updateValueAndValidity();
    this.configFinanciereForm.get('dateEntree')?.updateValueAndValidity();
  }

  /**
   * Gérer le changement de la case "Date d'entrée connue"
   */
  onDateEntreeConnueChange(dateConnue: boolean): void {
    const typeLocataire = this.typeForm.get('typeLocataire')?.value;
    
    // Pour tous les types de locataires
    if (dateConnue) {
      // Date connue : activer le champ et le rendre obligatoire
      this.configFinanciereForm.get('dateEntree')?.enable();
      this.configFinanciereForm.get('dateEntree')?.setValidators([Validators.required]);
    } else {
      // Date inconnue : seulement pour locataires existants
      if (typeLocataire !== TypeLocataire.NOUVEAU) {
        this.configFinanciereForm.get('dateEntree')?.disable();
        this.configFinanciereForm.get('dateEntree')?.clearValidators();
        this.configFinanciereForm.get('dateEntree')?.setValue(null);
      }
    }
    
    this.configFinanciereForm.get('dateEntree')?.updateValueAndValidity();
    
    // Forcer la revalidation immédiate
    this.assistantState.canProceed = false;
    setTimeout(() => {
      this.validateCurrentStep();
      this.calculerEcrituresComptables();
    }, 50);
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
        console.log('📊 Passage à l\'étape de prévisualisation - Calcul des écritures...');
        setTimeout(() => {
          this.calculerEcrituresComptables();
        }, 100);
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
        console.log("Valid ",isValid,this.locataireForm.valid,this.assistantState.configuration.locataireId)
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
        isValid = true; // Commencer par true et invalider si nécessaire

        // Vérification de la date d'entrée selon le type et la configuration
        const dateEntree = this.configFinanciereForm.get('dateEntree')?.value;
        const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
        const typeLocataire = this.typeForm.get('typeLocataire')?.value;
        
        // Vérification stricte de la date d'entrée
        if (dateEntreeConnue === true && (!dateEntree || dateEntree === '' || dateEntree === null)) {
          isValid = false;
          if (typeLocataire === TypeLocataire.NOUVEAU) {
            errors.push('La date d\'entrée est obligatoire pour un nouveau locataire');
          } else {
            errors.push('La date d\'entrée est obligatoire quand "Je connais la date d\'entrée exacte" est coché');
          }
        }
        
        

        // Vérifications spécifiques selon le type de locataire
        if (typeLocataire === TypeLocataire.NOUVEAU) {
          // Pour nouveau locataire, la case doit toujours être cochée
          if (dateEntreeConnue !== true) {
            isValid = false;
            errors.push('La date d\'entrée est obligatoire pour un nouveau locataire');
          }

          const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value;
          if (montantPercu === null || montantPercu === undefined || montantPercu < 0) {
            isValid = false;
            errors.push('Veuillez saisir le montant effectivement perçu (0 ou plus)');
          }
        } else {
          // Pour locataire existant, vérifier le solde actuel
          const soldeActuel = this.configFinanciereForm.get('soldeActuel')?.value;
          if (soldeActuel === null || soldeActuel === undefined) {
            isValid = false;
            errors.push('Veuillez saisir le solde actuel du locataire');
          }
          
          // Vérification supplémentaire pour la date si case cochée
          if (dateEntreeConnue === true) {
            const dateValue = this.configFinanciereForm.get('dateEntree')?.value;
            if (!dateValue || dateValue === '') {
              isValid = false;
              // errors.push('La date d\'entrée est obligatoire quand "Je connais la date d\'entrée exacte" est coché');
            }
          }
        }

        console.log('🔍 Validation configuration financière:', {
          dateEntree,
          typeLocataire,
          isValid,
          errors
        });
        break;

      case EtapeAssistant.PREVIEW_ECRITURES:
        // Forcer le calcul des écritures si elles ne sont pas encore générées
        if (this.ecrituresPrevisionnelles.length === 0) {
          console.log('🔄 Forçage du calcul des écritures pour la prévisualisation...');
          this.calculerEcrituresComptables();
        }

        // Vérifier que les écritures ont été générées
        isValid = this.ecrituresPrevisionnelles.length > 0;
        if (!isValid) {
          errors.push('Impossible de générer les écritures comptables');
          console.log('❌ Échec de la génération des écritures après forçage');
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
    console.log('✅ Confirmation de l\'assignation...');
    this.assistantState.isLoading = true;

    // Vérifier que toutes les données sont présentes
    if (!this.selectedRoom || !this.selectedLocataire) {
      this.toastr.error('Veuillez sélectionner une chambre et un locataire', 'Erreur');
      this.assistantState.isLoading = false;
      return;
    }

    // Construire la configuration finale pour le backend
    const assignationDTO = this.buildAssignationDTO();

    console.log('📤 Envoi de l\'assignation au backend:', assignationDTO);

    // Appeler le service backend
    this.store.dispatch(new LocationAction.CreateAssignationWithAssistant(assignationDTO))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('✅ Assignation créée avec succès:', result);
          this.assistantState.isLoading = false;
          this.toastr.success('Assignation créée avec succès', 'Succès');

          // Émettre le succès avec la configuration
          const config: AssignationConfig = {
            locataireId: this.selectedLocataire._id,
            chambreId: this.selectedRoom._id,
            propertyId: this.property._id,
            typeAssignation: this.typeForm.get('typeLocataire').value,
            configurationFinanciere: this.buildConfigurationFinanciere(),
            ecrituresPrevisionnelles: this.ecrituresPrevisionnelles,
            dateEffet: this.configFinanciereForm.get('dateEntree').value,
            statut: 'CONFIRME'
          };

          this.onSuccess.emit(config);
        },
        error: (error) => {
          console.error('❌ Erreur lors de l\'assignation:', error);
          this.assistantState.isLoading = false;
          this.toastr.error(
            error?.error?.message || 'Erreur lors de la création de l\'assignation',
            'Erreur'
          );
        }
      });
  }

  /**
   * Construire le DTO pour l'assignation backend
   */
  private buildAssignationDTO(): any {
    const typeAssignation = this.typeForm.get('typeLocataire').value;
    const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
    const dateEffet = dateEntreeConnue ? this.configFinanciereForm.get('dateEntree').value : new Date();

    const baseDTO = {
      locataireId: this.selectedLocataire._id,
      chambreId: this.selectedRoom._id,
      propertyId: this.property._id,
      typeAssignation: typeAssignation,
      dateEffet: dateEffet,
      statut: 'CONFIRME',
      ecrituresPrevisionnelles: this.ecrituresPrevisionnelles || [],
      codeReference: this.generateReferenceCode()
    };

    // Ajouter la configuration spécifique selon le type
    if (typeAssignation === TypeLocataire.NOUVEAU) {
      const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value || 0;
      const cautionActive = this.getActiveCautionAmount();

      baseDTO['configurationNouveauLocataire'] = {
        montantAvance: Math.max(0, montantPercu - cautionActive),
        montantCaution: cautionActive,
        paiementInitial: {
          montant: montantPercu,
          type: this.isCautionActive() ? 'AVANCE_PLUS_CAUTION' : 'AVANCE_SEULE',
          repartition: {
            avance: Math.max(0, montantPercu - cautionActive),
            caution: Math.min(montantPercu, cautionActive)
          }
        },
        dateEntree: dateEffet,
        generateFacture: true,
        commentaire: this.configFinanciereForm.get('commentaire')?.value || ''
      };
    } else {
      // Configuration pour locataire existant - utiliser la même structure que buildConfigurationFinanciere
      const config = this.buildConfigurationFinanciere();
      if (config && 'situationActuelle' in config) {
        baseDTO['configurationLocataireExistant'] = config;
        console.log('📤 Configuration locataire existant envoyée:', config);
      }
    }

    console.log('📤 DTO complet envoyé au backend:', baseDTO);
    return baseDTO;
  }

  /**
   * Générer un code de référence unique
   */
  private generateReferenceCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ASS-${timestamp}-${random}`.toUpperCase();
  }

  private buildConfigurationFinanciere(): NouveauLocataireConfig | LocataireExistantConfig {
    const typeLocataire = this.typeForm.get('typeLocataire')?.value;
    console.log('🏗️ Construction configuration financière pour type:', typeLocataire);

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      const montantPercu = this.configFinanciereForm.get('paiementMontant')?.value || 0;
      const cautionActive = this.getActiveCautionAmount();

      console.log('💰 Données financières nouveau locataire:', {
        montantPercu,
        cautionActive,
        isCautionActive: this.isCautionActive()
      });

      // Déterminer le type de paiement selon l'état du switcher
      let typePaiement = TypePaiementInitial.AVANCE_SEULE;
      if (this.isCautionActive()) {
        typePaiement = TypePaiementInitial.AVANCE_PLUS_CAUTION;
      }

      const repartitionAvance = Math.max(0, montantPercu - cautionActive);
      const repartitionCaution = Math.min(montantPercu, cautionActive);

      console.log('📊 Répartition calculée:', {
        typePaiement,
        repartitionAvance,
        repartitionCaution
      });

      const config: NouveauLocataireConfig = {
        montantAvance: 0, // Pas utilisé dans la nouvelle logique
        montantCaution: cautionActive,
        paiementInitial: {
          montant: montantPercu,
          type: typePaiement,
          repartition: {
            avance: repartitionAvance,
            caution: repartitionCaution
          }
        },
        dateEntree: this.configFinanciereForm.get('dateEntree')?.value || new Date(),
        generateFacture: true,
        commentaire: this.configFinanciereForm.get('commentaire')?.value || ''
      };

      console.log('✅ Configuration nouveau locataire construite:', config);
      return config;
    } else {
      // Pour locataire existant, ne prendre en compte la caution que si le switcher est activé
      const soldeActuel = this.configFinanciereForm.get('soldeActuel')?.value || 0;
      const cautionVersee = this.configFinanciereForm.get('cautionVersee')?.value || 0;
      const cautionActive = this.configFinanciereForm.get('cautionExistanteActive')?.value;
      const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
      const dateEntree = dateEntreeConnue ? this.configFinanciereForm.get('dateEntree')?.value : null;

      console.log('💰 Données financières locataire existant:', {
        soldeActuel,
        cautionVersee,
        cautionActive,
        dateEntreeConnue,
        dateEntree
      });

      // Déterminer la situation actuelle basée sur le solde
      let situationActuelle = this.configFinanciereForm.get('situationActuelle')?.value;
      if (!situationActuelle || situationActuelle === '') {
        if (soldeActuel < 0) {
          situationActuelle = 'EN_RETARD';
        } else if (soldeActuel > 0) {
          situationActuelle = 'EN_AVANCE';
        } else {
          situationActuelle = 'A_JOUR';
        }
      }

      const config: LocataireExistantConfig = {
        situationActuelle: situationActuelle,
        soldeActuel: Number(soldeActuel) || 0,
        cautionVersee: cautionActive ? Number(cautionVersee) || 0 : 0, // Caution selon le switcher
        dateEntree: dateEntreeConnue ? dateEntree : null, // null si date inconnue pour activer le nouvel algorithme
        transfererHistorique: Boolean(this.configFinanciereForm.get('transfererHistorique')?.value),
        commentaire: this.configFinanciereForm.get('commentaire')?.value || ''
      };

      console.log('✅ Configuration locataire existant construite:', config);
      return config;
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
    console.log("🧮 Calcul des écritures comptables...");
    console.log("Configuration actuelle:", this.assistantState.configuration);
    console.log("Valeurs des formulaires:", {
      typeLocataire: this.typeForm.get('typeLocataire')?.value,
      locataireId: this.locataireForm.get('locataireId')?.value,
      chambreId: this.chambreForm.get('chambreId')?.value,
      dateEntree: this.configFinanciereForm.get('dateEntree')?.value
    });

    // Récupérer le type d'assignation directement du formulaire
    const typeAssignation = this.typeForm.get('typeLocataire')?.value;

    // Vérifier que nous avons toutes les données nécessaires
    if (!this.assistantState.configuration.chambreId ||
        !this.assistantState.configuration.locataireId ||
        !typeAssignation) {
      console.log("⚠️ Données manquantes pour le calcul des écritures:", {
        chambreId: this.assistantState.configuration.chambreId,
        locataireId: this.assistantState.configuration.locataireId,
        typeAssignation: typeAssignation,
        typeFromState: this.assistantState.configuration.typeAssignation
      });
      this.ecrituresPrevisionnelles = [];
      this.resumeEcritures = null;
      return;
    }

    // Mettre à jour la configuration avec le type d'assignation
    this.assistantState.configuration.typeAssignation = typeAssignation;

    // Vérifier que les objets sélectionnés sont disponibles
    if (!this.selectedRoom || !this.selectedLocataire) {
      console.log("⚠️ Chambre ou locataire non sélectionné");
      this.ecrituresPrevisionnelles = [];
      this.resumeEcritures = null;
      return;
    }

    // Utiliser la chambre déjà sélectionnée
    const chambre = this.selectedRoom;

    try {
      // Construire la configuration d'assignation
      const configurationFinanciere = this.buildConfigurationFinanciere();

      const config: AssignationConfig = {
        locataireId: this.assistantState.configuration.locataireId,
        chambreId: this.assistantState.configuration.chambreId,
        propertyId: this.property._id,
        typeAssignation: typeAssignation, // Utiliser la valeur récupérée du formulaire
        dateEffet: this.assistantState.configuration.dateEffet || new Date(),
        configurationFinanciere: configurationFinanciere,
        ecrituresPrevisionnelles: [], // Sera rempli par le service
        statut: 'BROUILLON'
      };

      // Vérifications supplémentaires
      if (!config.configurationFinanciere) {
        throw new Error('Configuration financière manquante');
      }

      // Générer les écritures comptables
      console.log('Configuration pour génération écritures:', config);
      console.log('Chambre sélectionnée:', chambre);

      this.ecrituresPrevisionnelles = this.assistantService.genererEcrituresComptables(config, chambre);
      this.resumeEcritures = this.assistantService.genererResumeEcritures(this.ecrituresPrevisionnelles);

    console.log('Écritures comptables calculées:', this.ecrituresPrevisionnelles);
    console.log('Résumé des écritures:', this.resumeEcritures);

    } catch (error) {
      console.error('❌ Erreur lors du calcul des écritures:', error);
      this.ecrituresPrevisionnelles = [];
      this.resumeEcritures = null;

      // Afficher l'erreur à l'utilisateur
      this.toastr.error(
        error.message || 'Impossible de générer les écritures comptables',
        'Erreur de calcul'
      );
    }
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
    console.log('🏠 Chambre sélectionnée mise à jour:', this.selectedRoom);

    // Recalculer les écritures si on a toutes les données
    if (this.selectedRoom && this.assistantState.configuration.locataireId) {
      this.calculerEcrituresComptables();
    }
  }

  // Mettre à jour le locataire sélectionné
  private updateSelectedLocataire(): void {
    const locataireId = this.locataireForm.get('locataireId')?.value;
    this.selectedLocataire = this.locatairesList.find(locataire => locataire._id === locataireId) || null;
    console.log('👤 Locataire sélectionné mis à jour:', this.selectedLocataire);

    // Recalculer les écritures si on a toutes les données
    if (this.selectedLocataire && this.assistantState.configuration.chambreId) {
      this.calculerEcrituresComptables();
    }
  }

  /**
   * Appliquer les pré-sélections
   */
  private applyPreselections(): void {
    console.log('🎯 Application des pré-sélections...');

    // Pré-sélection de la chambre
    if (this.preselectedRoom) {
      console.log('🏠 Pré-sélection chambre:', this.preselectedRoom);

      // Vérifier que la chambre est dans la liste des chambres disponibles
      const roomExists = this.roomsList.find(room => room._id === this.preselectedRoom._id);
      if (roomExists) {
        this.assistantState.configuration.chambreId = this.preselectedRoom._id;
        this.chambreForm.patchValue({ chambreId: this.preselectedRoom._id }, { emitEvent: false });
        this.selectedRoom = this.preselectedRoom;

        // Forcer la mise à jour de l'affichage
        setTimeout(() => {
          this.chambreForm.patchValue({ chambreId: this.preselectedRoom._id }, { emitEvent: true });
        }, 100);
      } else {
        console.warn('⚠️ Chambre pré-sélectionnée non trouvée dans la liste');
      }
    }

    // Pré-sélection du locataire
    if (this.preselectedLocataire) {
      console.log('👤 Pré-sélection locataire:', this.preselectedLocataire);

      // Vérifier que le locataire est dans la liste des locataires disponibles
      const locataireExists = this.locatairesList.find(locataire => locataire._id === this.preselectedLocataire._id);
      if (locataireExists) {
        this.assistantState.configuration.locataireId = this.preselectedLocataire._id;
        this.locataireForm.patchValue({ locataireId: this.preselectedLocataire._id }, { emitEvent: false });
        this.selectedLocataire = this.preselectedLocataire;

        // Forcer la mise à jour de l'affichage
        setTimeout(() => {
          this.locataireForm.patchValue({ locataireId: this.preselectedLocataire._id }, { emitEvent: true });
        }, 100);
      } else {
        console.warn('⚠️ Locataire pré-sélectionné non trouvé dans la liste');
      }
    }

    // Valider l'étape actuelle après les pré-sélections
    setTimeout(() => {
      this.validateCurrentStep();
    }, 200);
  }

  /**
   * Gestionnaire de clic sur une chambre
   */
  onRoomClick(room: RoomModel): void {
    console.log('🏠 Clic sur chambre:', room);

    // Forcer la sélection
    this.chambreForm.patchValue({ chambreId: room._id }, { emitEvent: true });
    this.selectedRoom = room;
    this.assistantState.configuration.chambreId = room._id;

    // Valider l'étape
    setTimeout(() => {
      this.validateCurrentStep();
    }, 100);
  }

  /**
   * Gestionnaire de changement de locataire
   */
  onLocataireChange(event: any): void {
    const locataireId = event.target.value;
    console.log('👤 Changement locataire:', locataireId);

    if (locataireId && locataireId !== 'null') {
      this.selectedLocataire = this.locatairesList.find(l => l._id === locataireId) || null;
      this.assistantState.configuration.locataireId = locataireId;
    } else {
      this.selectedLocataire = null;
      this.assistantState.configuration.locataireId = null;
    }

    // Valider l'étape
    setTimeout(() => {
      this.validateCurrentStep();
    }, 100);
  }

  /**
   * TrackBy functions pour optimiser les performances
   */
  trackByRoomId(_index: number, room: RoomModel): string {
    return room._id;
  }

  trackByLocataireId(_index: number, locataire: LocataireModel): string {
    return locataire._id;
  }

  /**
   * Obtenir le label du type d'assignation
   */
  getTypeAssignationLabel(): string {
    const type = this.typeForm.get('typeLocataire')?.value;
    const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
    
    switch (type) {
      case TypeLocataire.NOUVEAU:
        return 'Nouveau locataire';
      case TypeLocataire.EXISTANT:
        if (dateEntreeConnue) {
          return 'Locataire existant (calcul classique)';
        } else {
          return 'Locataire existant (calcul intelligent)';
        }
      case TypeLocataire.MIGRATION:
        return 'Migration de locataire';
      default:
        return 'Non défini';
    }
  }

  /**
   * Calculer le solde des écritures (Crédits - Débits)
   */
  getSoldeEcritures(): number {
    if (!this.resumeEcritures) {
      return 0;
    }
    return this.resumeEcritures.totalCredits - this.resumeEcritures.totalDebits;
  }

  /**
   * Obtenir le statut financier détaillé
   */
  getStatutFinancier(): { statut: string, classe: string, icone: string, description: string } {
    const solde = this.getSoldeEcritures();
    const dateEntree = this.configFinanciereForm.get('dateEntree')?.value;
    const typeLocataire = this.typeForm.get('typeLocataire')?.value;
    const aujourdhui = new Date();

    if (!dateEntree) {
      return {
        statut: 'Non défini',
        classe: 'indefini',
        icone: 'fa-question-circle',
        description: 'Date d\'entrée non définie'
      };
    }

    const dateEntreeObj = new Date(dateEntree);

    // Pour les locataires existants, calculer le retard en mois
    if (typeLocataire === TypeLocataire.EXISTANT) {
      const moisRetard = this.getMoisRetard();

      if (solde >= 0) {
        return {
          statut: 'À jour',
          classe: 'a-jour',
          icone: 'fa-check-circle',
          description: moisRetard > 0 ? `En avance de ${moisRetard} mois` : 'Paiements à jour'
        };
      } else {
        return {
          statut: 'En retard',
          classe: 'en-retard',
          icone: 'fa-exclamation-triangle',
          description: `En retard de ${Math.abs(moisRetard)} mois`
        };
      }
    }

    // Pour les nouveaux locataires
    // Si la date d'entrée est dans le futur
    if (dateEntreeObj > aujourdhui) {
      if (solde > 0) {
        return {
          statut: 'Pré-payé',
          classe: 'prepaye',
          icone: 'fa-check-double',
          description: 'Locataire en avance de paiement'
        };
      } else {
        return {
          statut: 'En attente',
          classe: 'attente',
          icone: 'fa-clock',
          description: 'En attente d\'entrée'
        };
      }
    }

    // Si la date d'entrée est passée
    if (solde >= 0) {
      return {
        statut: 'À jour',
        classe: 'a-jour',
        icone: 'fa-check-circle',
        description: 'Paiements à jour'
      };
    } else {
      return {
        statut: 'En retard',
        classe: 'en-retard',
        icone: 'fa-exclamation-triangle',
        description: 'Paiements en retard'
      };
    }
  }

  /**
   * Calculer le nombre de mois couverts par l'avance (pour nouveaux locataires)
   */
  getMoisCouverts(): number {
    if (!this.selectedRoom) return 0;

    const typeLocataire = this.typeForm.get('typeLocataire')?.value;

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      const montantPaye = this.configFinanciereForm.get('paiementMontant')?.value || 0;
      const cautionActive = this.getActiveCautionAmount();
      const montantPourLoyer = Math.max(0, montantPaye - cautionActive);

      return Math.floor(montantPourLoyer / this.selectedRoom.price);
    }

    return 0;
  }

  /**
   * Calculer le nombre de mois de retard/avance (pour locataires existants)
   */
  getMoisRetard(): number {
    if (!this.selectedRoom) return 0;

    const typeLocataire = this.typeForm.get('typeLocataire')?.value;

    if (typeLocataire === TypeLocataire.EXISTANT) {
      const soldeActuel = this.configFinanciereForm.get('soldeActuel')?.value || 0;

      // Solde négatif = retard, solde positif = avance
      // Calculer en mois
      return Math.round(soldeActuel / this.selectedRoom.price);
    }

    return 0;
  }

  /**
   * Obtenir le texte descriptif du retard/avance
   */
  getDescriptionRetard(): string {
    const typeLocataire = this.typeForm.get('typeLocataire')?.value;

    if (typeLocataire === TypeLocataire.NOUVEAU) {
      const moisCouverts = this.getMoisCouverts();
      if (moisCouverts > 0) {
        return `${moisCouverts} mois couverts par l'avance`;
      }
      return 'Aucune avance';
    }

    if (typeLocataire === TypeLocataire.EXISTANT) {
      const dateEntreeConnue = this.configFinanciereForm.get('dateEntreeConnue')?.value;
      
      if (dateEntreeConnue) {
        // Calcul classique avec date d'entrée
        const moisRetard = this.getMoisRetard();
        if (moisRetard > 0) {
          return `${moisRetard} mois d'avance (calcul depuis date d'entrée)`;
        } else if (moisRetard < 0) {
          return `${Math.abs(moisRetard)} mois de retard (calcul depuis date d'entrée)`;
        }
        return 'À jour (calcul depuis date d\'entrée)';
      } else {
        // Calcul avec ancrage sur aujourd'hui
        return this.getDescriptionSoldeActuel();
      }
    }

    return '';
  }

  /**
   * Description basée sur le solde actuel (nouvelle approche)
   */
  getDescriptionSoldeActuel(): string {
    if (!this.selectedRoom) return '';
    
    const soldeActuel = this.configFinanciereForm.get('soldeActuel')?.value || 0;
    const prixMensuel = this.selectedRoom.price;
    
    if (prixMensuel === 0) return 'Prix de la chambre non défini';
    
    const moisEcart = Math.round(soldeActuel / prixMensuel);
    
    if (moisEcart === 0) {
      return 'À jour ce mois-ci (ancrage aujourd\'hui)';
    } else if (moisEcart > 0) {
      return `En avance de ${moisEcart} mois (ancrage aujourd'hui - payé jusqu'au ${this.getMonthName(new Date(), moisEcart)})`;
    } else {
      return `En retard de ${Math.abs(moisEcart)} mois (ancrage aujourd'hui - doit depuis ${this.getMonthName(new Date(), moisEcart)})`;
    }
  }

  /**
   * Obtenir le nom du mois avec décalage
   */
  private getMonthName(dateRef: Date, moisDecalage: number): string {
    const date = new Date(dateRef);
    date.setMonth(date.getMonth() + moisDecalage);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // Méthodes utilitaires
  private resetForms(): void {
    this.typeForm.reset();
    this.locataireForm.reset();
    this.chambreForm.reset();
    this.configFinanciereForm.reset();
    this.selectedRoom = null;
    this.selectedLocataire = null;
  }
}
