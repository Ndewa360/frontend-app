// Énumérations pour les types de modèles
export enum ContractTemplateType {
  DEFAULT = 'DEFAULT',           // Modèle par défaut du système
  CUSTOM = 'CUSTOM',            // Modèle personnalisé par l'utilisateur
  DUPLICATED = 'DUPLICATED'     // Modèle dupliqué depuis un autre
}

// Énumérations pour les statuts
export enum ContractTemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// Interface pour les variables du modèle
export interface ContractTemplateVariable {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  category?: string;
}

// Interface principale pour les modèles de contrats
export interface ContractTemplateModel {
  _id: string;
  name: string;
  description?: string;
  content: string;
  type: ContractTemplateType;
  status: ContractTemplateStatus;
  isDefault: boolean;
  isSystemDefault: boolean;
  usageCount: number;
  variables: ContractTemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  clientId: string;
}

// DTO pour la création d'un modèle
export interface CreateContractTemplateDto {
  name: string;
  description?: string;
  content: string;
  type?: ContractTemplateType;
  status?: ContractTemplateStatus;
  isDefault?: boolean;
  variables?: ContractTemplateVariable[];
}

// DTO pour la mise à jour d'un modèle
export interface UpdateContractTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  status?: ContractTemplateStatus;
  isDefault?: boolean;
  variables?: ContractTemplateVariable[];
}

// Interface pour les filtres de recherche
export interface ContractTemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: ContractTemplateType;
  status?: ContractTemplateStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface pour les statistiques
export interface ContractTemplateStatistics {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  archivedTemplates: number;
  customTemplates: number;
  defaultTemplates: number;
  duplicatedTemplates: number;
  totalUsage: number;
  monthlyUsage: number;
  templateGrowth: number;
  usageGrowth: number;
}

// Interface pour la réponse paginée
export interface PaginatedContractTemplates {
  templates: ContractTemplateModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface pour la duplication
export interface DuplicateContractTemplateDto {
  name: string;
  description?: string;
}

// Interface pour l'export
export interface ExportContractTemplateDto {
  format: 'pdf' | 'docx' | 'html';
  includeVariables?: boolean;
}

// Interface pour l'import
export interface ImportContractTemplateDto {
  file: File;
  name?: string;
  description?: string;
}
