import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PropertyManagerAction } from './property-manager.actions';
import { PropertyManagerApiService } from './property-manager.service';
import { ManagedPropertyItem, PropertyManagerAssignment } from './property-manager.model';

export class PropertyManagerStateModel {
  managedProperties: ManagedPropertyItem[];
  propertyManagers: PropertyManagerAssignment[];
  loading: boolean;
  loadingManagers: boolean;
}

@State<PropertyManagerStateModel>({
  name: 'propertyManager',
  defaults: {
    managedProperties: [],
    propertyManagers: [],
    loading: false,
    loadingManagers: false,
  },
})
@Injectable()
export class PropertyManagerState {
  constructor(
    private api: PropertyManagerApiService,
    private toastr: ToastrService,
  ) {}

  @Selector()
  static selectManagedProperties(state: PropertyManagerStateModel) {
    return state.managedProperties;
  }

  @Selector()
  static selectPropertyManagers(state: PropertyManagerStateModel) {
    return state.propertyManagers;
  }

  @Selector()
  static selectLoading(state: PropertyManagerStateModel) {
    return state.loading;
  }

  @Selector()
  static selectLoadingManagers(state: PropertyManagerStateModel) {
    return state.loadingManagers;
  }

  @Action(PropertyManagerAction.SetManagedProperties)
  setManagedProperties(ctx: StateContext<PropertyManagerStateModel>, { managedProperties }: PropertyManagerAction.SetManagedProperties) {
    ctx.patchState({ managedProperties });
    return of(true);
  }

  @Action(PropertyManagerAction.LoadMyAssignments)
  loadMyAssignments(ctx: StateContext<PropertyManagerStateModel>) {
    ctx.patchState({ loading: true });
    return this.api.getMyAssignments().pipe(
      tap(result => {
        ctx.patchState({ managedProperties: result.data || [], loading: false });
      }),
      catchError(error => {
        ctx.patchState({ loading: false });
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.CreateAndAssign)
  createAndAssign(ctx: StateContext<PropertyManagerStateModel>, { payload }: PropertyManagerAction.CreateAndAssign) {
    ctx.patchState({ loading: true });
    return this.api.createAndAssign(payload).pipe(
      tap(() => {
        ctx.patchState({ loading: false });
        this.toastr.success('Gérant créé et assigné avec succès', 'Ndewa360°');
      }),
      catchError(error => {
        ctx.patchState({ loading: false });
        const msg = error?.error?.message?.[0] || 'Une erreur est survenue';
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.AssignExisting)
  assignExisting(ctx: StateContext<PropertyManagerStateModel>, { payload }: PropertyManagerAction.AssignExisting) {
    ctx.patchState({ loading: true });
    return this.api.assignExisting(payload).pipe(
      tap(() => {
        ctx.patchState({ loading: false });
        this.toastr.success('Gérant assigné avec succès', 'Ndewa360°');
      }),
      catchError(error => {
        ctx.patchState({ loading: false });
        const msg = error?.error?.message?.[0] || 'Une erreur est survenue';
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.LoadManagersForProperty)
  loadManagersForProperty(ctx: StateContext<PropertyManagerStateModel>, { propertyId }: PropertyManagerAction.LoadManagersForProperty) {
    ctx.patchState({ loadingManagers: true });
    return this.api.getManagersForProperty(propertyId).pipe(
      tap(result => {
        ctx.patchState({ propertyManagers: result.data || [], loadingManagers: false });
      }),
      catchError(error => {
        ctx.patchState({ loadingManagers: false });
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.UpdatePermissions)
  updatePermissions(ctx: StateContext<PropertyManagerStateModel>, { assignmentId, permissions }: PropertyManagerAction.UpdatePermissions) {
    return this.api.updatePermissions(assignmentId, permissions).pipe(
      tap(result => {
        const state = ctx.getState();
        const updated = state.propertyManagers.map(m =>
          m._id === assignmentId ? { ...m, permissions: permissions as any } : m,
        );
        ctx.patchState({ propertyManagers: updated });
        this.toastr.success('Permissions mises à jour', 'Ndewa360°');
      }),
      catchError(error => {
        const msg = error?.error?.message?.[0] || 'Une erreur est survenue';
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.RevokeManager)
  revokeManager(ctx: StateContext<PropertyManagerStateModel>, { assignmentId }: PropertyManagerAction.RevokeManager) {
    return this.api.revokeManager(assignmentId).pipe(
      tap(() => {
        const state = ctx.getState();
        const updated = state.propertyManagers.filter(m => m._id !== assignmentId);
        ctx.patchState({ propertyManagers: updated });
        this.toastr.success('Gérant révoqué avec succès', 'Ndewa360°');
      }),
      catchError(error => {
        const msg = error?.error?.message?.[0] || 'Une erreur est survenue';
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(() => error);
      }),
    );
  }

  @Action(PropertyManagerAction.Reset)
  reset(ctx: StateContext<PropertyManagerStateModel>) {
    ctx.setState({ managedProperties: [], propertyManagers: [], loading: false, loadingManagers: false });
    return of(true);
  }
}
