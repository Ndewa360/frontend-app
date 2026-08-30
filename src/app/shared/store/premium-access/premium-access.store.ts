import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PremiumAccessService } from '../../services/premium-access/premium-access.service';
import { PremiumAccessAction } from './premium-access.actions';
import { PremiumAccessStateModel, OwnerInfoModel } from './premium-access.model';

const defaults: PremiumAccessStateModel = {
  loading: false,
  error: null,
  activeOwnerIds: [],
  ownerInfoMap: {},
  accessHistory: [],
  checkLoadingMap: {},
};

@State<PremiumAccessStateModel>({
  name: 'premiumAccess',
  defaults,
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
  static activeOwnerIds(state: PremiumAccessStateModel): string[] { return state.activeOwnerIds; }

  @Selector()
  static ownerInfoMap(state: PremiumAccessStateModel): Record<string, OwnerInfoModel> { return state.ownerInfoMap; }

  @Selector()
  static accessHistory(state: PremiumAccessStateModel) { return state.accessHistory; }

  /** Sélecteur paramétré : hasAccessForOwner(ownerId) */
  static hasAccessForOwner(ownerId: string) {
    return (state: { premiumAccess: PremiumAccessStateModel }) =>
      state.premiumAccess.activeOwnerIds.includes(ownerId);
  }

  /** Sélecteur paramétré : ownerInfoFor(ownerId) */
  static ownerInfoFor(ownerId: string) {
    return (state: { premiumAccess: PremiumAccessStateModel }) =>
      state.premiumAccess.ownerInfoMap[ownerId] ?? null;
  }

  /** Sélecteur paramétré : checkLoadingFor(ownerId) */
  static checkLoadingFor(ownerId: string) {
    return (state: { premiumAccess: PremiumAccessStateModel }) =>
      state.premiumAccess.checkLoadingMap[ownerId] ?? 'NO_LOADED';
  }

  // ─── Vérifier l'accès pour un propriétaire précis ─────────────────────────

  @Action(PremiumAccessAction.CheckAccessForOwner)
  checkAccessForOwner(
    ctx: StateContext<PremiumAccessStateModel>,
    action: PremiumAccessAction.CheckAccessForOwner,
  ) {
    const state = ctx.getState();

    // Déjà en cours de chargement pour cet owner → ne pas relancer
    if (state.checkLoadingMap[action.ownerId] === 'LOADING') return;

    ctx.patchState({
      loading: true,
      error: null,
      checkLoadingMap: { ...state.checkLoadingMap, [action.ownerId]: 'LOADING' },
    });

    const request$ = action.isAnonymous
      ? this.premiumAccessService.checkAccessForOwner(action.userId, action.ownerId)
      : this.premiumAccessService.checkAccessForOwner(action.userId, action.ownerId);

    return request$.pipe(
      tap((response: any) => {
        const current = ctx.getState();
        const hasAccess: boolean = response.data.hasAccess;

        // Mettre à jour la liste des activeOwnerIds
        let activeOwnerIds = [...current.activeOwnerIds];
        if (hasAccess && !activeOwnerIds.includes(action.ownerId)) {
          activeOwnerIds = [...activeOwnerIds, action.ownerId];
        } else if (!hasAccess) {
          activeOwnerIds = activeOwnerIds.filter(id => id !== action.ownerId);
        }

        ctx.patchState({
          loading: false,
          activeOwnerIds,
          checkLoadingMap: { ...current.checkLoadingMap, [action.ownerId]: 'LOADED' },
        });
      }),
      catchError(() => {
        const current = ctx.getState();
        // Accès refusé ou erreur → retirer de la liste
        ctx.patchState({
          loading: false,
          activeOwnerIds: current.activeOwnerIds.filter(id => id !== action.ownerId),
          checkLoadingMap: { ...current.checkLoadingMap, [action.ownerId]: 'LOADED' },
        });
        return of(null);
      }),
    );
  }

  // ─── Obtenir les infos propriétaire ────────────────────────────────────────

  @Action(PremiumAccessAction.GetOwnerInfo)
  getOwnerInfo(
    ctx: StateContext<PremiumAccessStateModel>,
    action: PremiumAccessAction.GetOwnerInfo,
  ) {
    ctx.patchState({ loading: true, error: null });

    const request$ = action.isAnonymous
      ? this.premiumAccessService.getPublicOwnerInfo(action.ownerId, action.userId)
      : this.premiumAccessService.getOwnerInfo(action.ownerId);

    return request$.pipe(
      tap((response: any) => {
        const current = ctx.getState();
        const ownerInfo: OwnerInfoModel = response.data;

        // Mettre à jour le cache et confirmer l'accès actif
        let activeOwnerIds = [...current.activeOwnerIds];
        if (!activeOwnerIds.includes(action.ownerId)) {
          activeOwnerIds = [...activeOwnerIds, action.ownerId];
        }

        ctx.patchState({
          loading: false,
          activeOwnerIds,
          ownerInfoMap: { ...current.ownerInfoMap, [action.ownerId]: ownerInfo },
          checkLoadingMap: { ...current.checkLoadingMap, [action.ownerId]: 'LOADED' },
        });
      }),
      catchError((error: any) => {
        const current = ctx.getState();
        // Accès expiré ou inexistant → retirer de la liste active
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Accès requis pour voir les informations de ce propriétaire',
          activeOwnerIds: current.activeOwnerIds.filter(id => id !== action.ownerId),
        });
        return of(null);
      }),
    );
  }

  // ─── Vider le cache d'un propriétaire ─────────────────────────────────────

  @Action(PremiumAccessAction.ClearOwnerCache)
  clearOwnerCache(
    ctx: StateContext<PremiumAccessStateModel>,
    action: PremiumAccessAction.ClearOwnerCache,
  ) {
    const current = ctx.getState();
    const ownerInfoMap = { ...current.ownerInfoMap };
    delete ownerInfoMap[action.ownerId];

    ctx.patchState({
      activeOwnerIds: current.activeOwnerIds.filter(id => id !== action.ownerId),
      ownerInfoMap,
      checkLoadingMap: { ...current.checkLoadingMap, [action.ownerId]: 'NO_LOADED' },
    });
  }

  // ─── Historique ────────────────────────────────────────────────────────────

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
      }),
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
    ctx.setState(defaults);
  }
}
