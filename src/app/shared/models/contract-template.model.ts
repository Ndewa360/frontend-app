// Énumérations
export enum ContractTemplateType {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
  DUPLICATED = 'DUPLICATED'
}

export enum ContractTemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// Interface pour les variables de contrat
export interface ContractVariables {
  // Bailleur
  nomPrenomBailleur: string;
  recidenceBailleur: string;
  emailBailleur: string;
  phoneBailleur: string;
  cniBailleur: string;

  // Locataire
  nomPrenomLocataire: string;
  emailMandataire: string;
  phoneMandataire: string;
  phoneMandataireRef: string;

  // Logement
  addressLogement: string;
  typeLogement: string;
  caracteristicLogement: string;

  // Contrat
  dateContrat: string;
  dureContrat: string;
  montantLocation: number;
  monai: string;
  montantCaution: string;
}

// Interface pour les variables de template (déclarée une seule fois)
export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  category: 'bailleur' | 'locataire' | 'logement' | 'contrat' | 'custom';
}

// Interface principale pour les modèles de contrats (UNIFIÉE)
export interface ContractTemplateModel {
  _id: string;
  name: string;
  description: string;
  type: ContractTemplateType;
  status: ContractTemplateStatus;
  owner?: string;
  templateUrl: string;
  basedOn?: string;
  version: number;
  isDefault: boolean;
  isSystemDefault: boolean;
  usageCount: number;
  customVariables: { [key: string]: string };
  preview: string;
  fileSize: number;
  contentHash: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  // Propriétés calculées côté frontend
  variables?: TemplateVariable[];
  content?: string; // Contenu chargé à la demande
}

// DTOs pour les requêtes
export interface CreateContractTemplateDTO {
  name: string;
  description?: string;
  content: string; // Contenu HTML du template
  type?: ContractTemplateType;
  // status est défini automatiquement par le backend
  basedOn?: string;
}

export interface UpdateContractTemplateDTO {
  name?: string;
  description?: string;
  status?: ContractTemplateStatus;
  templateUrl?: string;
  isDefault?: boolean;
  customVariables?: { [key: string]: string };
  preview?: string;
  fileSize?: number;
  contentHash?: string;
}

// DuplicateContractTemplateDTO déclarée une seule fois
export interface DuplicateContractTemplateDTO {
  sourceTemplateId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  customVariables?: { [key: string]: string };
}

export interface ContractTemplateFilterDTO {
  type?: ContractTemplateType;
  status?: ContractTemplateStatus;
  search?: string;
  isDefault?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UploadTemplateContentDTO {
  content: string;
  customVariables?: { [key: string]: string };
}

export interface PreviewContractTemplateDTO {
  templateId: string;
  sampleData?: { [key: string]: any };
}

export interface AssignTemplateToPropertyDTO {
  templateId: string;
  propertyId: string;
}

// Interface pour les réponses paginées
export interface ContractTemplateListResponse {
  templates: ContractTemplateModel[];
  total: number;
  page: number;
  totalPages: number;
}

// Interface pour les statistiques
export interface ContractTemplateStatsDTO {
  totalTemplates: number;
  activeTemplates: number;
  customTemplates: number;
  defaultTemplates: number;
  totalUsage: number;
  mostUsedTemplate?: ContractTemplateModel;
  recentTemplates: ContractTemplateModel[];
}

// Interface pour l'éditeur de contenu
export interface ContractEditorConfig {
  toolbar: string[];
  height: number;
  plugins: string[];
  menubar: boolean;
  statusbar: boolean;
  branding: boolean;
}

// Interface pour l'état de l'éditeur
export interface TemplateEditorState {
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  currentTemplate: ContractTemplateModel | null;
  content: string;
  variables: TemplateVariable[];
  previewMode: boolean;
  errors: string[];
}

// Interface pour les actions de l'éditeur
export interface TemplateEditorActions {
  loadTemplate: (templateId: string) => void;
  saveTemplate: () => void;
  updateContent: (content: string) => void;
  addVariable: (variable: TemplateVariable) => void;
  removeVariable: (key: string) => void;
  togglePreview: () => void;
  resetEditor: () => void;
}

// Interface pour les options d'export
export interface TemplateExportOptions {
  format: 'html' | 'pdf' | 'docx';
  includeVariables: boolean;
  includeMetadata: boolean;
}

// Interface pour l'historique des versions
export interface TemplateVersion {
  version: number;
  createdAt: Date;
  changes: string;
  author: string;
  templateUrl: string;
}

// Interface pour les permissions
export interface TemplatePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canSetAsDefault: boolean;
  canShare: boolean;
}

// Interface complète avec permissions
export interface ContractTemplateWithPermissions extends ContractTemplateModel {
  permissions: TemplatePermissions;
  versions?: TemplateVersion[];
}
