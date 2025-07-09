import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionLimitAction } from './subscription-limit.action';
import { SubscriptionLimitStateModel, SubscriptionStatus, PropertyCreationCheck, MonthlyCalculation } from './subscription-limit.model';
import { SubscriptionLimitService } from '../../services/subscription-limit.service';

@State<SubscriptionLimitStateModel>({
  name: 'subscriptionLimit',
  defaults: {
    subscriptionStatus: null,
    canCreateProperty: true,
    needsUpgrade: false,
    monthlyAmount: 0,
    lastCalculationMonth: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class SubscriptionLimitState {

  constructor(
    private subscriptionLimitService: SubscriptionLimitService,
    private toastrService: ToastrService
  ) {}

  @Selector()
  static selectSubscriptionStatus(state: SubscriptionLimitStateModel): SubscriptionStatus | null {
    return state.subscriptionStatus;
  }

  @Selector()
  static selectCanCreateProperty(state: SubscriptionLimitStateModel): boolean {
    return state.canCreateProperty;
  }

  @Selector()
  static selectNeedsUpgrade(state: SubscriptionLimitStateModel): boolean {
    return state.needsUpgrade;
  }

  @Selector()
  static selectMonthlyAmount(state: SubscriptionLimitStateModel): number {
    return state.monthlyAmount;
  }

  @Selector()
  static selectLoading(state: SubscriptionLimitStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: SubscriptionLimitStateModel): string | null {
    return state.error;
  }

  @Selector()
  static selectIsFreePlan(state: SubscriptionLimitStateModel): boolean {
    return state.subscriptionStatus?.plan === 'free';
  }

  @Selector()
  static selectIsPremiumPlan(state: SubscriptionLimitStateModel): boolean {
    return state.subscriptionStatus?.plan === 'premium';
  }

  @Selector()
  static selectAccountSuspended(state: SubscriptionLimitStateModel): boolean {
    return state.subscriptionStatus?.accountStatus === 'suspended';
  }

  @Action(SubscriptionLimitAction.CheckCanCreateProperty)
  checkCanCreateProperty(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.canCreateProperty().pipe(
      tap((response) => {
        ctx.patchState({
          canCreateProperty: response.data.canCreate,
          needsUpgrade: response.data.needsUpgrade,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la vérification'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.GetSubscriptionStatus)
  getSubscriptionStatus(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.getSubscriptionStatus().pipe(
      tap((response) => {
        ctx.patchState({
          subscriptionStatus: response.data,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement du statut'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.UpgradeToPremium)
  upgradeToPremium(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.upgradeToPremium().pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Félicitations ! Vous êtes maintenant sur le forfait Premium.', 'Upgrade réussi');
        
        // Recharger le statut après upgrade
        ctx.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de l\'upgrade'
        });
        this.toastrService.error('Une erreur est survenue lors de l\'upgrade.', 'Erreur');
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.ReactivateAccount)
  reactivateAccount(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.reactivateAccount().pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Votre compte a été réactivé avec succès.', 'Compte réactivé');
        
        // Recharger le statut après réactivation
        ctx.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la réactivation'
        });
        this.toastrService.error('Une erreur est survenue lors de la réactivation.', 'Erreur');
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.CalculateMonthlyAmount)
  calculateMonthlyAmount(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.calculateMonthlyAmount().pipe(
      tap((response) => {
        ctx.patchState({
          monthlyAmount: response.data.amount,
          lastCalculationMonth: response.data.month,
          loading: false
        });
        this.toastrService.info(`Montant mensuel estimé: ${response.data.amount} FCFA`, 'Calcul terminé');
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du calcul'
        });
        this.toastrService.error('Erreur lors du calcul du montant mensuel.', 'Erreur');
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.ValidatePropertyCreation)
  validatePropertyCreation(ctx: StateContext<SubscriptionLimitStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionLimitService.validatePropertyCreation().pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        return response;
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Validation échouée'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionLimitAction.SetSubscriptionStatus)
  setSubscriptionStatus(ctx: StateContext<SubscriptionLimitStateModel>, action: SubscriptionLimitAction.SetSubscriptionStatus) {
    ctx.patchState({
      subscriptionStatus: action.status
    });
  }

  @Action(SubscriptionLimitAction.SetCanCreateProperty)
  setCanCreateProperty(ctx: StateContext<SubscriptionLimitStateModel>, action: SubscriptionLimitAction.SetCanCreateProperty) {
    ctx.patchState({
      canCreateProperty: action.canCreate,
      needsUpgrade: action.needsUpgrade
    });
  }

  @Action(SubscriptionLimitAction.SetMonthlyAmount)
  setMonthlyAmount(ctx: StateContext<SubscriptionLimitStateModel>, action: SubscriptionLimitAction.SetMonthlyAmount) {
    ctx.patchState({
      monthlyAmount: action.amount,
      lastCalculationMonth: action.month
    });
  }

  @Action(SubscriptionLimitAction.SetLoading)
  setLoading(ctx: StateContext<SubscriptionLimitStateModel>, action: SubscriptionLimitAction.SetLoading) {
    ctx.patchState({
      loading: action.loading
    });
  }

  @Action(SubscriptionLimitAction.SetError)
  setError(ctx: StateContext<SubscriptionLimitStateModel>, action: SubscriptionLimitAction.SetError) {
    ctx.patchState({
      error: action.error
    });
  }
}
