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
    initLoadingState: 'NO_LOADED',
  }
})
@Injectable()
export class PremiumAccessState {

  constructor(private premiumAccessService: PremiumAccessService) {}

  // ─── Sélecteurs ────────────────────────────────────────────────────────────

  @Selector()
  static loading(state: PremiumAccessStateModel): boolean { return state.loading; }

  @Selector()
  static error(state: PremiumAccessStateModel): string | null { return state.error; }

  @Selector()
  static currentAccess(state: PremiumAccessStateModel): PremiumAccessModel | null { return state.currentAccess; }

  @Selector()
  static ownerInfo(state: PremiumAccessStateModel): OwnerInfoModel | null { return state.ownerInfo; }

  @Selector()
  static hasActiveAccess(state: PremiumAccessStateModel): boolean { return state.hasActiveAccess; }

  @Selector()
  static accessHistory(state: PremiumAccessStateModel): PremiumAccessModel[] { return state.accessHistory; }

  // ─── Vérifier l'accès actif ────────────────────────────────────────────────
  // Route: GET /premium-access/check/:userId (publique, fonctionne pour anonymes)

  @Action(PremiumAccessAction.CheckActiveAccess)
  checkActiveAccess(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.CheckActiveAccess) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.checkActiveAccess(action.userId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          hasActiveAccess: response.data.hasAccess,
          currentAccess: response.data.access,
          initLoadingState: 'LOADED',
        });
      }),
      catchError(() => {
        // Erreur silencieuse — visiteur inconnu du backend
        ctx.patchState({ loading: false, hasActiveAccess: false, initLoadingState: 'LOADED' });
        return of(null);
      })
    );
  }

  // ─── Obtenir les infos propriétaire ────────────────────────────────────────
  // Connecté  : GET /premium-access/owner-info/:ownerId (JWT)
  // Anonyme   : GET /premium-access/public-owner-info/:ownerId?visitorId=

  @Action(PremiumAccessAction.GetOwnerInfo)
  getOwnerInfo(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.GetOwnerInfo) {
    ctx.patchState({ loading: true, error: null });

    const request$ = action.isAnonymous
      ? this.premiumAccessService.getPublicOwnerInfo(action.ownerId, action.userId)
      : this.premiumAccessService.getOwnerInfo(action.ownerId);

    return request$.pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          ownerInfo: response.data,
          hasActiveAccess: true,
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la récupération des informations du propriétaire',
        });
        return of(null);
      })
    );
  }

  // ─── Historique (utilisateur connecté uniquement) ──────────────────────────
  // Route: GET /premium-access/history (JWT)

  @Action(PremiumAccessAction.GetHistory)
  getUserPremiumHistory(ctx: StateContext<PremiumAccessStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.getUserPremiumHistory().pipe(
      tap((response: any) => {
        ctx.patchState({ loading: false, accessHistory: response.data });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la récupération de l\'historique',
        });
        return of(null);
      })
    );
  }

  // ─── Utilitaires ───────────────────────────────────────────────────────────

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

  @Action(PremiumAccessAction.Reset)
  reset(ctx: StateContext<PremiumAccessStateModel>) {
    ctx.setState({
      loading: false,
      error: null,
      currentAccess: null,
      ownerInfo: null,
      accessHistory: [],
      hasActiveAccess: false,
      initLoadingState: 'NO_LOADED',
    });
  }
}
