import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { tap, catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

import { ContractTemplateAction } from "./contract-template.actions";
import { ContractTemplateService } from "../../services/contract-template.service";
import {
    ContractTemplateModel,
    ContractTemplateFilterDTO,
    CreateContractTemplateDTO,
    ContractTemplateStatsDTO,
    UpdateContractTemplateDTO,
    DuplicateContractTemplateDTO,
    UploadTemplateContentDTO
} from "../../models/contract-template.model";
import { ContractTemplateStateModel } from "./contract-template.model";

@State<ContractTemplateStateModel>({
    name: "contractTemplates",
    defaults: {
        // Data
        templates: [],
        defaultTemplate: null,
        currentTemplate: null,
        recentTemplates: [],
        statistics: null,
        
        // UI State
        loading: false,
        loadingTemplate: false,
        loadingStatistics: false,
        error: null,
        
        // Filters and pagination
        filters: {},
        pagination: {
            total: 0,
            page: 1,
            totalPages: 0
        },
        
        // Init state
        initLoadingState: 'NO_LOADED'
    }
})
@Injectable()
export class ContractTemplateState {
    constructor(
        private contractTemplateService: ContractTemplateService,
        private toastrService: ToastrService,
        private translateService: TranslateService
    ) {}

    // ===== SELECTORS =====

    @Selector()
    static selectStateLoading(state: ContractTemplateStateModel) {
        return state.loading;
    }

    @Selector()
    static selectStateLoadingTemplate(state: ContractTemplateStateModel) {
        return state.loadingTemplate;
    }

    @Selector()
    static selectStateLoadingStatistics(state: ContractTemplateStateModel) {
        return state.loadingStatistics;
    }

    @Selector()
    static selectStateTemplates(state: ContractTemplateStateModel) {
        return state.templates;
    }

    @Selector()
    static selectStateDefaultTemplate(state: ContractTemplateStateModel) {
        return state.defaultTemplate;
    }

    @Selector()
    static selectAllTemplates(state: ContractTemplateStateModel) {
        // Les templates du backend incluent déjà les templates système
        // Pas besoin d'ajouter le defaultTemplate séparément
        return state.templates;
    }

    @Selector()
    static selectStateCurrentTemplate(state: ContractTemplateStateModel) {
        return state.currentTemplate;
    }

    @Selector()
    static selectStateRecentTemplates(state: ContractTemplateStateModel) {
        return state.recentTemplates;
    }

    @Selector()
    static selectStateStatistics(state: ContractTemplateStateModel) {
        return state.statistics;
    }

    @Selector()
    static selectStateError(state: ContractTemplateStateModel) {
        return state.error;
    }

    @Selector()
    static selectStateFilters(state: ContractTemplateStateModel) {
        return state.filters;
    }

    @Selector()
    static selectStatePagination(state: ContractTemplateStateModel) {
        return state.pagination;
    }

    @Selector()
    static selectStateInitLoading(state: ContractTemplateStateModel) {
        return state.initLoadingState;
    }

    // Dynamic selectors
    static selectStateTemplate(templateId: string) {
        return createSelector([ContractTemplateState], (state: ContractTemplateStateModel) => {
            return state.templates.find(template => template._id === templateId) || null;
        });
    }

    static selectStateTemplatesByType(type: string) {
        return createSelector([ContractTemplateState], (state: ContractTemplateStateModel) => {
            return state.templates.filter(template => template.type === type);
        });
    }

    static selectStateTemplatesByStatus(status: string) {
        return createSelector([ContractTemplateState], (state: ContractTemplateStateModel) => {
            return state.templates.filter(template => template.status === status);
        });
    }

    // ===== ACTIONS =====

    @Action(ContractTemplateAction.FetchTemplates)
    fetchTemplates(ctx: StateContext<ContractTemplateStateModel>, { filters }: ContractTemplateAction.FetchTemplates) {
        const state = ctx.getState();
        
        ctx.patchState({
            loading: true,
            error: null,
            initLoadingState: 'LOADING'
        });

        return this.contractTemplateService.getTemplates(filters).pipe(
            tap(response => {
                ctx.patchState({
                    loading: false,
                    templates: response.templates,
                    pagination: {
                        total: response.total,
                        page: response.page,
                        totalPages: response.totalPages
                    },
                    initLoadingState: 'LOADED'
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors du chargement des modèles',
                    initLoadingState: 'LOADED'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_LOAD_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.FetchTemplate)
    fetchTemplate(ctx: StateContext<ContractTemplateStateModel>, { templateId }: ContractTemplateAction.FetchTemplate) {
        ctx.patchState({
            loadingTemplate: true,
            error: null
        });

        return this.contractTemplateService.getTemplateById(templateId).pipe(
            tap(template => {
                ctx.patchState({
                    loadingTemplate: false,
                    currentTemplate: template
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loadingTemplate: false,
                    error: 'Erreur lors du chargement du modèle'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_FETCH_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.FetchRecentTemplates)
    fetchRecentTemplates(ctx: StateContext<ContractTemplateStateModel>, { limit }: ContractTemplateAction.FetchRecentTemplates) {
        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.getTemplates({
            limit,
            sortBy: 'lastUsedAt',
            sortOrder: 'desc'
        }).pipe(
            tap(response => {
                ctx.patchState({
                    loading: false,
                    recentTemplates: response.templates
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors du chargement des modèles récents'
                });
                console.error('Erreur lors du chargement des modèles récents:', error);
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.FetchTemplateStatistics)
    fetchTemplateStatistics(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.patchState({
            loadingStatistics: true,
            error: null
        });

        return this.contractTemplateService.getTemplateStats().pipe(
            tap(statistics => {
                ctx.patchState({
                    loadingStatistics: false,
                    statistics: statistics
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loadingStatistics: false,
                    error: 'Erreur lors du chargement des statistiques'
                });
                console.error('Erreur lors du chargement des statistiques:', error);
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.CreateTemplate)
    createTemplate(ctx: StateContext<ContractTemplateStateModel>, { createDto }: ContractTemplateAction.CreateTemplate) {
        const state = ctx.getState();

        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.createTemplate(createDto).pipe(
            tap(newTemplate => {
                ctx.patchState({
                    loading: false,
                    templates: [...state.templates, newTemplate],
                    currentTemplate: newTemplate
                });
                this.toastrService.success(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_CREATED_SUCCESS'), 'Succès');
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la création du modèle'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_CREATE_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.UpdateTemplate)
    updateTemplate(ctx: StateContext<ContractTemplateStateModel>, { templateId, updateDto }: ContractTemplateAction.UpdateTemplate) {
        const state = ctx.getState();

        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.updateTemplate(templateId, updateDto).pipe(
            tap(updatedTemplate => {
                const updatedTemplates = state.templates.map(t =>
                    t._id === templateId ? updatedTemplate : t
                );

                ctx.patchState({
                    loading: false,
                    templates: updatedTemplates,
                    currentTemplate: state.currentTemplate?._id === templateId ? updatedTemplate : state.currentTemplate
                });
                this.toastrService.success(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_UPDATED_SUCCESS'), 'Succès');
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la mise à jour du modèle'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_UPDATE_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.DeleteTemplate)
    deleteTemplate(ctx: StateContext<ContractTemplateStateModel>, { templateId }: ContractTemplateAction.DeleteTemplate) {
        const state = ctx.getState();

        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.deleteTemplate(templateId).pipe(
            tap(() => {
                const filteredTemplates = state.templates.filter(t => t._id !== templateId);

                ctx.patchState({
                    loading: false,
                    templates: filteredTemplates,
                    currentTemplate: state.currentTemplate?._id === templateId ? null : state.currentTemplate
                });
                this.toastrService.success(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_DELETED_SUCCESS'), 'Succès');
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la suppression du modèle'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_DELETE_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }



    @Action(ContractTemplateAction.SetCurrentTemplate)
    setCurrentTemplate(ctx: StateContext<ContractTemplateStateModel>, { template }: ContractTemplateAction.SetCurrentTemplate) {
        ctx.patchState({
            currentTemplate: template
        });
    }

    @Action(ContractTemplateAction.ClearCurrentTemplate)
    clearCurrentTemplate(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.patchState({
            currentTemplate: null
        });
    }

    @Action(ContractTemplateAction.SetFilters)
    setFilters(ctx: StateContext<ContractTemplateStateModel>, { filters }: ContractTemplateAction.SetFilters) {
        ctx.patchState({
            filters: filters
        });
    }

    @Action(ContractTemplateAction.ClearFilters)
    clearFilters(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.patchState({
            filters: {}
        });
    }

    @Action(ContractTemplateAction.SetError)
    setError(ctx: StateContext<ContractTemplateStateModel>, { error }: ContractTemplateAction.SetError) {
        ctx.patchState({
            error: error
        });
    }

    @Action(ContractTemplateAction.DuplicateTemplate)
    duplicateTemplate(ctx: StateContext<ContractTemplateStateModel>, { duplicateDto }: ContractTemplateAction.DuplicateTemplate) {
        const state = ctx.getState();

        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.duplicateTemplate(duplicateDto).pipe(
            tap(newTemplate => {
                ctx.patchState({
                    loading: false,
                    templates: [newTemplate, ...state.templates],
                    currentTemplate: newTemplate
                });
                this.toastrService.success(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_DUPLICATED_SUCCESS'), 'Succès');
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la duplication du modèle'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_DUPLICATE_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.LoadDefaultTemplate)
    loadDefaultTemplate(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.getDefaultTemplate().pipe(
            tap(defaultTemplate => {
                ctx.patchState({
                    loading: false,
                    defaultTemplate: defaultTemplate,
                    currentTemplate: defaultTemplate // Stocker aussi comme template courant
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors du chargement du modèle par défaut'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_DEFAULT_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.ReindexUserTemplates)
    reindexUserTemplates(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.reindexUserTemplates().pipe(
            tap(result => {
                ctx.patchState({
                    loading: false
                });

                // Afficher le résultat de la réindexation
                const message = `Réindexation terminée: ${result.indexed} nouveaux templates, ${result.updated} mis à jour`;
                this.toastrService.success(message, 'Réindexation');

                if (result.errors.length > 0) {
                    console.warn('Erreurs lors de la réindexation:', result.errors);
                    this.toastrService.warning(`${result.errors.length} erreurs rencontrées`, 'Attention');
                }

                // Recharger la liste des templates
                ctx.dispatch(new ContractTemplateAction.FetchTemplates({}));
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la réindexation'
                });
                this.toastrService.error('Erreur lors de la réindexation des templates', 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.UpdateTemplateContent)
    updateTemplateContent(ctx: StateContext<ContractTemplateStateModel>, { templateId, uploadDto }: ContractTemplateAction.UpdateTemplateContent) {
        const state = ctx.getState();

        ctx.patchState({
            loading: true,
            error: null
        });

        return this.contractTemplateService.uploadTemplateContent(templateId, uploadDto).pipe(
            tap(updatedTemplate => {
                const updatedTemplates = state.templates.map(template =>
                    template._id === templateId ? updatedTemplate : template
                );

                ctx.patchState({
                    loading: false,
                    templates: updatedTemplates,
                    currentTemplate: updatedTemplate
                });
                this.toastrService.success(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_CONTENT_UPDATED_SUCCESS'), 'Succès');
            }),
            catchError(error => {
                ctx.patchState({
                    loading: false,
                    error: 'Erreur lors de la mise à jour du contenu'
                });
                this.toastrService.error(this.translateService.instant('NOTIFICATIONS.CONTRACT_TEMPLATE_CONTENT_UPDATE_ERROR'), 'Erreur');
                return throwError(error);
            })
        );
    }

    @Action(ContractTemplateAction.ResetState)
    resetState(ctx: StateContext<ContractTemplateStateModel>) {
        ctx.setState({
            templates: [],
            defaultTemplate: null,
            currentTemplate: null,
            recentTemplates: [],
            statistics: null,
            loading: false,
            loadingTemplate: false,
            loadingStatistics: false,
            error: null,
            filters: {},
            pagination: {
                total: 0,
                page: 1,
                totalPages: 0
            },
            initLoadingState: 'NO_LOADED'
        });
    }
}
