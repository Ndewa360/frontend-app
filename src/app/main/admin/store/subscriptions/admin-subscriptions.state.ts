import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

// Actions
import { AdminSubscriptionsAction } from './admin-subscriptions.actions';

// Models
import { AdminSubscriptionsStateModel, AdminUserSubscription, SubscriptionStats, SubscriptionFilters } from './admin-subscriptions.model';

// Services
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';

@State<AdminSubscriptionsStateModel>({
  name: 'adminSubscriptions',
  defaults: {
    subscriptions: [],
    stats: null,
    filters: {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    loading: false,
    error: null,
    lastUpdated: null,
    selectedSubscriptions: []
  }
})
@Injectable()
export class AdminSubscriptionsState {

  constructor(
    private adminSubscriptionsService: AdminSubscriptionsService,
    private toastrService: ToastrService,
    private translateService: TranslateService
  ) {}

  // Selectors
  @Selector()
  static selectSubscriptions(state: AdminSubscriptionsStateModel): AdminUserSubscription[] {
    return state.subscriptions;
  }

  @Selector()
  static selectStats(state: AdminSubscriptionsStateModel): SubscriptionStats | null {
    return state.stats;
  }

  @Selector()
  static selectFilters(state: AdminSubscriptionsStateModel): SubscriptionFilters {
    return state.filters;
  }

  @Selector()
  static selectPagination(state: AdminSubscriptionsStateModel) {
    return state.pagination;
  }

  @Selector()
  static selectIsLoading(state: AdminSubscriptionsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminSubscriptionsStateModel): any {
    return state.error;
  }

  @Selector()
  static selectSelectedSubscriptions(state: AdminSubscriptionsStateModel): string[] {
    return state.selectedSubscriptions;
  }

  @Selector()
  static selectLastUpdated(state: AdminSubscriptionsStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions
  @Action(AdminSubscriptionsAction.LoadSubscriptions)
  loadSubscriptions(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.LoadSubscriptions) {
    ctx.patchState({ loading: true, error: null });

    return this.adminSubscriptionsService.getSubscriptions(action.filters).pipe(
      tap((response) => {
        ctx.patchState({
          subscriptions: response.subscriptions,
          pagination: {
            page: action.filters?.page || 1,
            limit: action.filters?.limit || 20,
            total: response.total,
            totalPages: Math.ceil(response.total / (action.filters?.limit || 20))
          },
          loading: false,
          lastUpdated: new Date()
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des souscriptions'
        });
        this.toastrService.error('Erreur lors du chargement des souscriptions');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.LoadStats)
  loadStats(ctx: StateContext<AdminSubscriptionsStateModel>) {
    return this.adminSubscriptionsService.getSubscriptionsStats().pipe(
      tap((stats) => {
        ctx.patchState({ stats });
      }),
      catchError((error) => {
        ctx.patchState({
          error: error.message || 'Erreur lors du chargement des statistiques'
        });
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.SetFilters)
  setFilters(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SetFilters) {
    ctx.patchState({
      filters: { ...action.filters }
    });
  }

  @Action(AdminSubscriptionsAction.ClearFilters)
  clearFilters(ctx: StateContext<AdminSubscriptionsStateModel>) {
    ctx.patchState({
      filters: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    });
  }

  @Action(AdminSubscriptionsAction.ForceUpgradeToPremium)
  forceUpgradeToPremium(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.ForceUpgradeToPremium) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.forceUpgradeToPremium(action.subscriptionId, action.reason).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Upgrade forcé vers Premium avec succès');
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors de l\'upgrade forcé');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.ChangePlan)
  changePlan(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.ChangePlan) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.changePlan(action.subscriptionId, action.targetPlan, action.reason).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success(`Plan changé vers ${action.targetPlan} avec succès`);
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors du changement de plan');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.SuspendAccount)
  suspendAccount(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SuspendAccount) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.suspendAccount(action.subscriptionId, action.reason).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Compte suspendu avec succès');
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors de la suspension du compte');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.ReactivateAccount)
  reactivateAccount(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.ReactivateAccount) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.reactivateAccount(action.subscriptionId).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Compte réactivé avec succès');
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors de la réactivation du compte');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.SendPaymentReminder)
  sendPaymentReminder(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SendPaymentReminder) {
    return this.adminSubscriptionsService.sendPaymentReminder(action.subscriptionId).pipe(
      tap((result) => {
        this.toastrService.success('Rappel de paiement envoyé avec succès');
      }),
      catchError((error) => {
        this.toastrService.error('Erreur lors de l\'envoi du rappel');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.BulkUpgrade)
  bulkUpgrade(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.BulkUpgrade) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.bulkUpgrade(action.subscriptionIds, action.targetPlan, action.reason).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success(`${result.processed} comptes upgradés avec succès`);
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
        ctx.dispatch(new AdminSubscriptionsAction.ClearSelection());
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors de l\'upgrade en masse');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.BulkSuspend)
  bulkSuspend(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.BulkSuspend) {
    ctx.patchState({ loading: true });

    return this.adminSubscriptionsService.bulkSuspend(action.subscriptionIds, action.reason).pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        this.toastrService.success(`${result.processed} comptes suspendus avec succès`);
        // Recharger les données
        ctx.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(ctx.getState().filters));
        ctx.dispatch(new AdminSubscriptionsAction.ClearSelection());
      }),
      catchError((error) => {
        ctx.patchState({ loading: false });
        this.toastrService.error('Erreur lors de la suspension en masse');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.SelectSubscription)
  selectSubscription(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SelectSubscription) {
    const state = ctx.getState();
    const selectedSubscriptions = [...state.selectedSubscriptions];
    
    if (!selectedSubscriptions.includes(action.subscriptionId)) {
      selectedSubscriptions.push(action.subscriptionId);
    }
    
    ctx.patchState({ selectedSubscriptions });
  }

  @Action(AdminSubscriptionsAction.UnselectSubscription)
  unselectSubscription(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.UnselectSubscription) {
    const state = ctx.getState();
    const selectedSubscriptions = state.selectedSubscriptions.filter(id => id !== action.subscriptionId);
    
    ctx.patchState({ selectedSubscriptions });
  }

  @Action(AdminSubscriptionsAction.SelectAllSubscriptions)
  selectAllSubscriptions(ctx: StateContext<AdminSubscriptionsStateModel>) {
    const state = ctx.getState();
    const selectedSubscriptions = state.subscriptions.map(sub => sub._id);
    
    ctx.patchState({ selectedSubscriptions });
  }

  @Action(AdminSubscriptionsAction.ClearSelection)
  clearSelection(ctx: StateContext<AdminSubscriptionsStateModel>) {
    ctx.patchState({ selectedSubscriptions: [] });
  }

  @Action(AdminSubscriptionsAction.ExportSubscriptions)
  exportSubscriptions(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.ExportSubscriptions) {
    return this.adminSubscriptionsService.exportSubscriptions(action.filters, action.format).pipe(
      tap((result) => {
        // Ouvrir le lien de téléchargement
        window.open(result.downloadUrl, '_blank');
        this.toastrService.success('Export généré avec succès');
      }),
      catchError((error) => {
        this.toastrService.error('Erreur lors de l\'export');
        return throwError(error);
      })
    );
  }

  @Action(AdminSubscriptionsAction.RefreshData)
  refreshData(ctx: StateContext<AdminSubscriptionsStateModel>) {
    const state = ctx.getState();
    ctx.dispatch([
      new AdminSubscriptionsAction.LoadSubscriptions(state.filters),
      new AdminSubscriptionsAction.LoadStats()
    ]);
  }

  @Action(AdminSubscriptionsAction.SetLoading)
  setLoading(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminSubscriptionsAction.SetError)
  setError(ctx: StateContext<AdminSubscriptionsStateModel>, action: AdminSubscriptionsAction.SetError) {
    ctx.patchState({ error: action.error });
  }

  @Action(AdminSubscriptionsAction.ClearError)
  clearError(ctx: StateContext<AdminSubscriptionsStateModel>) {
    ctx.patchState({ error: null });
  }
}