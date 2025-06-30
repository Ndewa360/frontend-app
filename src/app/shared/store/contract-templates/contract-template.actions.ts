import {
    ContractTemplateModel,
    TemplateFilters,
    CreateContractTemplateDTO
} from "./contract-template.model";

export namespace ContractTemplateAction {
    // Fetch all templates
    export class FetchTemplates {
        static readonly type = '[ContractTemplate] Fetch Templates';
        constructor(public filters?: TemplateFilters) {}
    }

    // Fetch template by ID
    export class FetchTemplate {
        static readonly type = '[ContractTemplate] Fetch Template';
        constructor(public templateId: string) {}
    }

    // Fetch recent templates
    export class FetchRecentTemplates {
        static readonly type = '[ContractTemplate] Fetch Recent Templates';
        constructor(public limit: number = 6) {}
    }

    // Fetch template statistics
    export class FetchTemplateStatistics {
        static readonly type = '[ContractTemplate] Fetch Template Statistics';
        constructor() {}
    }

    // Create template
    export class CreateTemplate {
        static readonly type = '[ContractTemplate] Create Template';
        constructor(public createDto: CreateContractTemplateDTO) {}
    }

    // Update template
    export class UpdateTemplate {
        static readonly type = '[ContractTemplate] Update Template';
        constructor(public templateId: string, public template: Partial<ContractTemplateModel>) {}
    }

    // Delete template
    export class DeleteTemplate {
        static readonly type = '[ContractTemplate] Delete Template';
        constructor(public templateId: string) {}
    }

    // Duplicate template
    export class DuplicateTemplate {
        static readonly type = '[ContractTemplate] Duplicate Template';
        constructor(public duplicateDto: { sourceTemplateId: string; name: string; description?: string }) {}
    }

    // Set template as default
    export class SetTemplateAsDefault {
        static readonly type = '[ContractTemplate] Set Template As Default';
        constructor(public templateId: string) {}
    }

    // Toggle template status
    export class ToggleTemplateStatus {
        static readonly type = '[ContractTemplate] Toggle Template Status';
        constructor(public templateId: string) {}
    }

    // Set current template (for editing)
    export class SetCurrentTemplate {
        static readonly type = '[ContractTemplate] Set Current Template';
        constructor(public template: ContractTemplateModel | null) {}
    }

    // Update template content
    export class UpdateTemplateContent {
        static readonly type = '[ContractTemplate] Update Template Content';
        constructor(public templateId: string, public content: string) {}
    }

    // Set loading state
    export class SetLoading {
        static readonly type = '[ContractTemplate] Set Loading';
        constructor(public loading: boolean) {}
    }

    // Set error state
    export class SetError {
        static readonly type = '[ContractTemplate] Set Error';
        constructor(public error: string | null) {}
    }

    // Reset state
    export class ResetState {
        static readonly type = '[ContractTemplate] Reset State';
        constructor() {}
    }

    // Clear current template
    export class ClearCurrentTemplate {
        static readonly type = '[ContractTemplate] Clear Current Template';
        constructor() {}
    }

    // Set filters
    export class SetFilters {
        static readonly type = '[ContractTemplate] Set Filters';
        constructor(public filters: TemplateFilters) {}
    }

    // Load default template
    export class LoadDefaultTemplate {
        static readonly type = '[ContractTemplate] Load Default Template';
    }

    // Reindex user templates
    export class ReindexUserTemplates {
        static readonly type = '[ContractTemplate] Reindex User Templates';
    }

    // Clear filters
    export class ClearFilters {
        static readonly type = '[ContractTemplate] Clear Filters';
        constructor() {}
    }
}
