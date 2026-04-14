import {
    ContractTemplateModel,
    CreateContractTemplateDTO,
    ContractTemplateStatsDTO,
    ContractTemplateType,
    ContractTemplateStatus,
    ContractTemplateFilterDTO,
    TemplateVariable
} from "../../models/contract-template.model";

// Re-export pour utilisation dans le store
export {
    ContractTemplateModel,
    CreateContractTemplateDTO,
    ContractTemplateStatsDTO,
    ContractTemplateType,
    ContractTemplateStatus,
    ContractTemplateFilterDTO,
    TemplateVariable
};

// Énumérations importées depuis les modèles partagés

// ContractTemplateModel est importé depuis ../../models/contract-template.model

// TemplateVariable est déjà exporté ci-dessus

export interface TemplateMetadata {
    version: string;
    lastModifiedBy: string;
    tags: string[];
    category: string;
    language: string;
}

// DTOs importés depuis les modèles partagés

// Utiliser ContractTemplateStatsDTO depuis les modèles partagés (déjà exporté)
export { ContractTemplateStatsDTO as TemplateStatistics } from "../../models/contract-template.model";

// Utiliser ContractTemplateFilterDTO depuis les modèles partagés (déjà exporté)
export { ContractTemplateFilterDTO as TemplateFilters } from "../../models/contract-template.model";

// Utiliser ContractTemplateListResponse depuis les modèles partagés
export { ContractTemplateListResponse as TemplateListResponse } from "../../models/contract-template.model";

// Interface pour l'état du store NGXS
export interface ContractTemplateStateModel {
    // Data
    templates: ContractTemplateModel[];
    defaultTemplate: ContractTemplateModel | null;
    currentTemplate: ContractTemplateModel | null;
    recentTemplates: ContractTemplateModel[];
    statistics: ContractTemplateStatsDTO | null;

    // UI State
    loading: boolean;
    loadingTemplate: boolean;
    loadingStatistics: boolean;
    error: string | null;

    // Filters and pagination
    filters: ContractTemplateFilterDTO;
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };

    // Init state
    initLoadingState: 'NO_LOADED' | 'LOADING' | 'LOADED';
}

// Variable categories for the editor
export interface VariableCategory {
    name: string;
    label: string;
    icon: string;
    variables: TemplateVariable[];
}

export const DEFAULT_TEMPLATE_VARIABLES: VariableCategory[] = [
    {
        name: 'tenant',
        label: 'Locataire',
        icon: 'fa-user',
        variables: [
            {
                key: 'TENANT_NAME',
                label: 'Nom du locataire',
                description: 'Nom complet du locataire',
                category: 'locataire',
                type: 'text',
                required: true
            },
            {
                key: 'TENANT_FIRSTNAME',
                label: 'Prénom du locataire',
                description: 'Prénom du locataire',
                category: 'locataire',
                type: 'text',
                required: false
            },
            {
                key: 'TENANT_ADDRESS',
                label: 'Adresse du locataire',
                description: 'Adresse complète du locataire',
                category: 'locataire',
                type: 'text',
                required: false
            },
            {
                key: 'TENANT_PHONE',
                label: 'Téléphone du locataire',
                description: 'Numéro de téléphone du locataire',
                category: 'locataire',
                type: 'text',
                required: false
            },
            {
                key: 'TENANT_EMAIL',
                label: 'Email du locataire',
                description: 'Adresse email du locataire',
                category: 'locataire',
                type: 'text',
                required: false
            }
        ]
    },
    {
        name: 'owner',
        label: 'Propriétaire',
        icon: 'fa-user-tie',
        variables: [
            {
                key: 'OWNER_NAME',
                label: 'Nom du propriétaire',
                description: 'Nom de famille du propriétaire',
                category: 'bailleur',
                type: 'text',
                required: true
            },
            {
                key: 'OWNER_FIRSTNAME',
                label: 'Prénom du propriétaire',
                description: 'Prénom du propriétaire',
                category: 'bailleur',
                type: 'text',
                required: false
            },
            {
                key: 'OWNER_ADDRESS',
                label: 'Adresse du propriétaire',
                description: 'Adresse complète du propriétaire',
                category: 'bailleur',
                type: 'text',
                required: false
            },
            {
                key: 'OWNER_PHONE',
                label: 'Téléphone du propriétaire',
                description: 'Numéro de téléphone du propriétaire',
                category: 'bailleur',
                type: 'text',
                required: false
            },
            {
                key: 'OWNER_EMAIL',
                label: 'Email du propriétaire',
                description: 'Adresse email du propriétaire',
                category: 'bailleur',
                type: 'text',
                required: false
            }
        ]
    },
    {
        name: 'property',
        label: 'Propriété',
        icon: 'fa-building',
        variables: [
            {
                key: 'PROPERTY_ADDRESS',
                label: 'Adresse de la propriété',
                description: 'Adresse complète de la propriété',
                category: 'logement',
                type: 'text',
                required: true
            },
            {
                key: 'PROPERTY_TYPE',
                label: 'Type de bien',
                description: 'Type de bien (appartement, maison, etc.)',
                category: 'logement',
                type: 'text',
                required: false
            },
            {
                key: 'PROPERTY_SURFACE',
                label: 'Surface',
                description: 'Surface du bien en m²',
                category: 'logement',
                type: 'number',
                required: false
            },
            {
                key: 'PROPERTY_ROOMS',
                label: 'Nombre de pièces',
                description: 'Nombre de pièces du bien',
                category: 'logement',
                type: 'number',
                required: false
            }
        ]
    },
    {
        name: 'rental',
        label: 'Location',
        icon: 'fa-home',
        variables: [
            {
                key: 'MONTHLY_RENT',
                label: 'Loyer mensuel',
                description: 'Montant mensuel du loyer',
                category: 'contrat',
                type: 'number',
                required: true
            },
            {
                key: 'CHARGES',
                label: 'Charges',
                description: 'Montant des charges mensuelles',
                category: 'contrat',
                type: 'number',
                required: false
            },
            {
                key: 'SECURITY_DEPOSIT',
                label: 'Dépôt de garantie',
                description: 'Montant du dépôt de garantie',
                category: 'contrat',
                type: 'number',
                required: false
            }
        ]
    },
    {
        name: 'dates',
        label: 'Dates',
        icon: 'fa-calendar',
        variables: [
            {
                key: 'CURRENT_DATE',
                label: 'Date du jour',
                description: 'Date actuelle',
                category: 'contrat',
                type: 'date',
                required: false
            },
            {
                key: 'START_DATE',
                label: 'Date de début',
                description: 'Date de début de la location',
                category: 'contrat',
                type: 'date',
                required: true
            },
            {
                key: 'END_DATE',
                label: 'Date de fin',
                description: 'Date de fin de la location',
                category: 'contrat',
                type: 'date',
                required: false
            },
            {
                key: 'SIGNATURE_DATE',
                label: 'Date de signature',
                description: 'Date de signature du contrat',
                category: 'contrat',
                type: 'date',
                required: false
            }
        ]
    }
];
