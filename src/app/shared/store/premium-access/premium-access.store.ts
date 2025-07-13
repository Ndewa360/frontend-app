import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PremiumAccessService } from '../../services/premium-access/premium-access.service';
import { PremiumAccessAction } from './premium-access.actions';
import { PremiumAccessStateModel, PremiumAccessModel, OwnerInfoModel } from './premium-access.model';

@State<PremiumAccessStateModel>({
  name: 'premiumAccess',
  defaults: {
    loading: false,
    error: null,
    currentAccess: null,
    ownerInfo: null,
    accessHistory: [],
    hasActiveAccess: false,
    initLoadingState: 'NO_LOADED'
  }
})
@Injectable()
export class PremiumAccessState {

  constructor(private premiumAccessService: PremiumAccessService) {}

  // Sélecteurs
  @Selector()
  static loading(state: PremiumAccessStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: PremiumAccessStateModel): string | null {
    return state.error;
  }

  @Selector()
  static currentAccess(state: PremiumAccessStateModel): PremiumAccessModel | null {
    return state.currentAccess;
  }

  @Selector()
  static ownerInfo(state: PremiumAccessStateModel): OwnerInfoModel | null {
    return state.ownerInfo;
  }

  @Selector()
  static hasActiveAccess(state: PremiumAccessStateModel): boolean {
    return state.hasActiveAccess;
  }

  @Selector()
  static accessHistory(state: PremiumAccessStateModel): PremiumAccessModel[] {
    return state.accessHistory;
  }

  // Actions
  @Action(PremiumAccessAction.SetLoading)
  setLoading(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(PremiumAccessAction.SetError)
  setError(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.SetError) {
    ctx.patchState({ error: action.error, loading: false });
  }

  @Action(PremiumAccessAction.ClearError)
  clearError(ctx: StateContext<PremiumAccessStateModel>) {
    ctx.patchState({ error: null });
  }

  @Action(PremiumAccessAction.CreateSession)
  createPremiumAccessSession(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.CreateSession) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.createPremiumAccessSession(action.payload).pipe(
      tap((response: any) => {
        ctx.patchState({ loading: false, error: null });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la création de la session de paiement'
        });
        return of(error);
      })
    );
  }

  @Action(PremiumAccessAction.CheckActiveAccess)
  checkActiveAccess(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.CheckActiveAccess) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.checkActiveAccess(action.userId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          hasActiveAccess: response.data.hasAccess,
          currentAccess: response.data.access
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la vérification de l\'accès'
        });
        return of({ data: { hasAccess: false, access: null } });
      })
    );
  }

  @Action(PremiumAccessAction.GetOwnerInfo)
  getOwnerInfo(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.GetOwnerInfo) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.getOwnerInfo(action.userId, action.ownerId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          ownerInfo: response.data,
          hasActiveAccess: true
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la récupération des informations du propriétaire'
        });
        return of(error);
      })
    );
  }

  @Action(PremiumAccessAction.GetHistory)
  getUserPremiumHistory(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.GetHistory) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.getUserPremiumHistory(action.userId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          accessHistory: response.data
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la récupération de l\'historique'
        });
        return of([]);
      })
    );
  }

  @Action(PremiumAccessAction.ConfirmAccess)
  confirmPremiumAccess(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.ConfirmAccess) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.confirmPremiumAccess(action.sessionId, action.paymentIntentId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          hasActiveAccess: true,
          currentAccess: response.data
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la confirmation du paiement'
        });
        return of(error);
      })
    );
  }

  @Action(PremiumAccessAction.Reset)
  reset(ctx: StateContext<PremiumAccessStateModel>) {
    ctx.setState({
      loading: false,
      error: null,
      currentAccess: null,
      ownerInfo: null,
      accessHistory: [],
      hasActiveAccess: false,
      initLoadingState: 'NO_LOADED'
    });
  }
}
