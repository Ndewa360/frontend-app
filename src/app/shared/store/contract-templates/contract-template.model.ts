import {
    ContractTemplateModel,
    CreateContractTemplateDTO,
    ContractTemplateStatsDTO,
    ContractTemplateType,
    ContractTemplateStatus
} from "../../models/contract-template.model";

// Re-export pour utilisation dans le store
export {
    ContractTemplateModel,
    CreateContractTemplateDTO,
    ContractTemplateStatsDTO,
    ContractTemplateType,
    ContractTemplateStatus
};

// Énumérations importées depuis les modèles partagés

// ContractTemplateModel est importé depuis ../../models/contract-template.model

export interface TemplateVariable {
    name: string;
    code: string;
    label: string;
    description: string;
    category: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
    defaultValue?: any;
}

export interface TemplateMetadata {
    version: string;
    lastModifiedBy: string;
    tags: string[];
    category: string;
    language: string;
}

// DTOs importés depuis les modèles partagés

export interface TemplateStatistics {
    totalTemplates: number;
    activeTemplates: number;
    customTemplates: number;
    defaultTemplates: number;
    monthlyUsage: number;
    totalUsage: number;
    templateGrowth: number;
    usageGrowth: number;
}

export interface TemplateFilters {
    search?: string;
    type?: ContractTemplateType;
    status?: ContractTemplateStatus;
    propertyId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface TemplateListResponse {
    templates: ContractTemplateModel[];
    total: number;
    page: number;
    totalPages: number;
}

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
    filters: TemplateFilters;
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
                name: 'tenant_name',
                code: '{{TENANT_NAME}}',
                label: 'Nom du locataire',
                description: 'Nom complet du locataire',
                category: 'tenant',
                type: 'text',
                required: true
            },
            {
                name: 'tenant_email',
                code: '{{TENANT_EMAIL}}',
                label: 'Email du locataire',
                description: 'Adresse email du locataire',
                category: 'tenant',
                type: 'text',
                required: false
            },
            {
                name: 'tenant_phone',
                code: '{{TENANT_PHONE}}',
                label: 'Téléphone du locataire',
                description: 'Numéro de téléphone du locataire',
                category: 'tenant',
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
                name: 'property_name',
                code: '{{PROPERTY_NAME}}',
                label: 'Nom de la propriété',
                description: 'Nom de la propriété',
                category: 'property',
                type: 'text',
                required: true
            },
            {
                name: 'property_address',
                code: '{{PROPERTY_ADDRESS}}',
                label: 'Adresse de la propriété',
                description: 'Adresse complète de la propriété',
                category: 'property',
                type: 'text',
                required: true
            }
        ]
    },
    {
        name: 'rental',
        label: 'Location',
        icon: 'fa-home',
        variables: [
            {
                name: 'rental_amount',
                code: '{{RENTAL_AMOUNT}}',
                label: 'Montant du loyer',
                description: 'Montant mensuel du loyer',
                category: 'rental',
                type: 'number',
                required: true
            },
            {
                name: 'rental_deposit',
                code: '{{RENTAL_DEPOSIT}}',
                label: 'Caution',
                description: 'Montant de la caution',
                category: 'rental',
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
                name: 'contract_date',
                code: '{{CONTRACT_DATE}}',
                label: 'Date du contrat',
                description: 'Date de signature du contrat',
                category: 'dates',
                type: 'date',
                required: true
            },
            {
                name: 'start_date',
                code: '{{START_DATE}}',
                label: 'Date de début',
                description: 'Date de début de la location',
                category: 'dates',
                type: 'date',
                required: true
            },
            {
                name: 'end_date',
                code: '{{END_DATE}}',
                label: 'Date de fin',
                description: 'Date de fin de la location',
                category: 'dates',
                type: 'date',
                required: false
            }
        ]
    }
];
