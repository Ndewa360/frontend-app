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
    pendingTransactionId: null,
    pendingAccessId: null,
    paymentStatus: 'idle',
    initLoadingState: 'NO_LOADED'
  }
})
@Injectable()
export class PremiumAccessState {

  constructor(private premiumAccessService: PremiumAccessService) {}

  // ─── Sélecteurs ────────────────────────────────────────────────────────────

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

  @Selector()
  static paymentStatus(state: PremiumAccessStateModel): string {
    return state.paymentStatus;
  }

  @Selector()
  static pendingTransactionId(state: PremiumAccessStateModel): string | null {
    return state.pendingTransactionId;
  }

  @Selector()
  static pendingAccessId(state: PremiumAccessStateModel): string | null {
    return state.pendingAccessId;
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

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

  // ─── Initier un paiement Mobile Money ──────────────────────────────────────
  @Action(PremiumAccessAction.InitiatePayment)
  initiatePayment(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.InitiatePayment) {
    ctx.patchState({ loading: true, error: null, paymentStatus: 'idle' });

    return this.premiumAccessService.initiatePremiumPayment(action.payload).pipe(
      tap((response: any) => {
        const data = response.data;
        ctx.patchState({
          loading: false,
          error: null,
          pendingTransactionId: data.transactionId,
          pendingAccessId: data.accessId,
          paymentStatus: data.status === 'success' ? 'success' : 'pending'
        });

        // Si le paiement est déjà confirmé (cas rare), confirmer directement
        if (data.status === 'success' && data.accessId) {
          ctx.dispatch(new PremiumAccessAction.ConfirmAccess(data.accessId));
        }
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de l\'initiation du paiement',
          paymentStatus: 'failed'
        });
        return of(null);
      })
    );
  }

  // ─── Vérifier le statut d'un paiement en cours ─────────────────────────────
  @Action(PremiumAccessAction.CheckPaymentStatus)
  checkPaymentStatus(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.CheckPaymentStatus) {
    return this.premiumAccessService.checkPaymentStatus(action.transactionId).pipe(
      tap((response: any) => {
        const data = response.data;

        if (data.status === 'success') {
          ctx.patchState({ paymentStatus: 'success' });
          // Confirmer l'accès côté backend
          if (data.accessId) {
            ctx.dispatch(new PremiumAccessAction.ConfirmAccess(data.accessId));
          }
        } else if (data.status === 'failed') {
          ctx.patchState({
            paymentStatus: 'failed',
            error: 'Le paiement a été refusé ou annulé.',
            pendingTransactionId: null,
            pendingAccessId: null
          });
        }
        // Si 'pending', on ne fait rien — le composant continue le polling
      }),
      catchError((error: any) => {
        // Ignorer les erreurs de polling réseau, ne pas changer le statut
        return of(null);
      })
    );
  }

  // ─── Confirmer l'accès après paiement réussi ───────────────────────────────
  @Action(PremiumAccessAction.ConfirmAccess)
  confirmPremiumAccess(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.ConfirmAccess) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.confirmPremiumAccess(action.accessId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          hasActiveAccess: true,
          currentAccess: response.data,
          paymentStatus: 'success',
          pendingTransactionId: null,
          pendingAccessId: null
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          loading: false,
          error: error.error?.message || 'Erreur lors de la confirmation de l\'accès'
        });
        return of(null);
      })
    );
  }

  // ─── Vérifier l'accès actif ────────────────────────────────────────────────
  @Action(PremiumAccessAction.CheckActiveAccess)
  checkActiveAccess(ctx: StateContext<PremiumAccessStateModel>, action: PremiumAccessAction.CheckActiveAccess) {
    ctx.patchState({ loading: true, error: null });

    return this.premiumAccessService.checkActiveAccess(action.userId).pipe(
      tap((response: any) => {
        ctx.patchState({
          loading: false,
          error: null,
          hasActiveAccess: response.data.hasAccess,
          currentAccess: response.data.access,
          initLoadingState: 'LOADED'
        });
      }),
      catchError(() => {
        // Erreur silencieuse — visiteur anonyme inconnu du backend
        ctx.patchState({
          loading: false,
          hasActiveAccess: false,
          initLoadingState: 'LOADED'
        });
        return of({ data: { hasAccess: false, access: null } });
      })
    );
  }

  // ─── Obtenir les infos du propriétaire ─────────────────────────────────────
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
        return of(null);
      })
    );
  }

  // ─── Historique ────────────────────────────────────────────────────────────
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

  // ─── Reset ─────────────────────────────────────────────────────────────────
  @Action(PremiumAccessAction.Reset)
  reset(ctx: StateContext<PremiumAccessStateModel>) {
    ctx.setState({
      loading: false,
      error: null,
      currentAccess: null,
      ownerInfo: null,
      accessHistory: [],
      hasActiveAccess: false,
      pendingTransactionId: null,
      pendingAccessId: null,
      paymentStatus: 'idle',
      initLoadingState: 'NO_LOADED'
    });
  }
}
