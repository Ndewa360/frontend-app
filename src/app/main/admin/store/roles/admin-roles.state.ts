import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminRolesStateModel, AdminRole, AdminPermission, RoleStats, PermissionsMatrix } from './admin-roles.model';

// Actions
import { AdminRolesAction } from './admin-roles.actions';

// Services
import { AdminRolesService } from '../../services/admin-roles.service';

@State<AdminRolesStateModel>({
  name: 'adminRoles',
  defaults: {
    roles: [],
    permissions: [],
    selectedRole: null,
    stats: null,
    permissionsMatrix: null,
    roleUsers: {},
    filters: {
      sortBy: 'name',
      sortOrder: 'asc'
    },
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminRolesState {

  constructor(private adminRolesService: AdminRolesService) {}

  // Selectors
  @Selector()
  static selectRoles(state: AdminRolesStateModel): AdminRole[] {
    return state.roles;
  }

  @Selector()
  static selectPermissions(state: AdminRolesStateModel): AdminPermission[] {
    return state.permissions;
  }

  @Selector()
  static selectSelectedRole(state: AdminRolesStateModel): AdminRole | null {
    return state.selectedRole;
  }

  @Selector()
  static selectStats(state: AdminRolesStateModel): RoleStats | null {
    return state.stats;
  }

  @Selector()
  static selectPermissionsMatrix(state: AdminRolesStateModel): PermissionsMatrix | null {
    return state.permissionsMatrix;
  }

  @Selector()
  static selectRoleUsers(state: AdminRolesStateModel) {
    return state.roleUsers;
  }

  @Selector()
  static selectFilters(state: AdminRolesStateModel) {
    return state.filters;
  }

  @Selector()
  static selectIsLoading(state: AdminRolesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminRolesStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminRolesStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  @Action(AdminRolesAction.LoadRoles)
  loadRoles(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoles) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminRolesService.getRoles(action.filters).pipe(
      tap(roles => {
        ctx.dispatch(new AdminRolesAction.LoadRolesSuccess(roles));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadRolesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadRolesSuccess)
  loadRolesSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRolesSuccess) {
    ctx.patchState({
      roles: action.roles,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminRolesAction.LoadRolesFailure)
  loadRolesFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRolesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminRolesAction.LoadPermissions)
  loadPermissions(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminRolesService.getPermissions().pipe(
      tap(permissions => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsSuccess(permissions));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadPermissionsSuccess)
  loadPermissionsSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsSuccess) {
    ctx.patchState({
      permissions: action.permissions,
      loading: false,
      error: null
    });
  }

  @Action(AdminRolesAction.LoadPermissionsFailure)
  loadPermissionsFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminRolesAction.LoadRoleStats)
  loadRoleStats(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminRolesService.getRolesStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminRolesAction.LoadRoleStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadRoleStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadRoleStatsSuccess)
  loadRoleStatsSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoleStatsSuccess) {
    ctx.patchState({
      stats: action.stats,
      loading: false,
      error: null
    });
  }

  @Action(AdminRolesAction.LoadRoleStatsFailure)
  loadRoleStatsFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoleStatsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminRolesAction.LoadPermissionsMatrix)
  loadPermissionsMatrix(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminRolesService.getPermissionsMatrix().pipe(
      tap(matrix => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsMatrixSuccess(matrix));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsMatrixFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadPermissionsMatrixSuccess)
  loadPermissionsMatrixSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsMatrixSuccess) {
    ctx.patchState({
      permissionsMatrix: action.matrix,
      loading: false,
      error: null
    });
  }

  @Action(AdminRolesAction.LoadPermissionsMatrixFailure)
  loadPermissionsMatrixFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsMatrixFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminRolesAction.CreateRole)
  createRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRole) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminRolesService.createRole(action.roleData).pipe(
      tap(role => {
        ctx.dispatch(new AdminRolesAction.CreateRoleSuccess(role));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.CreateRoleFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.CreateRoleSuccess)
  createRoleSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRoleSuccess) {
    const state = ctx.getState();
    ctx.patchState({
      roles: [action.role, ...state.roles],
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminRolesAction.CreateRoleFailure)
  createRoleFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRoleFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminRolesAction.UpdateRole)
  updateRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.UpdateRole) {
    ctx.patchState({ loading: true, error: null });
    return this.adminRolesService.updateRole(action.roleId, action.roleData).pipe(
      tap(role => {
        const state = ctx.getState();
        ctx.patchState({
          roles: state.roles.map(r => r._id === role._id ? role : r),
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.SetLoading)
  setLoading(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminRolesAction.ClearState)
  clearState(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({
      roles: [],
      permissions: [],
      selectedRole: null,
      stats: null,
      permissionsMatrix: null,
      roleUsers: {},
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminRolesAction.RefreshData)
  refreshData(ctx: StateContext<AdminRolesStateModel>) {
    const state = ctx.getState();
    ctx.dispatch([
      new AdminRolesAction.LoadRoles(state.filters),
      new AdminRolesAction.LoadPermissions(),
      new AdminRolesAction.LoadRoleStats(),
      new AdminRolesAction.LoadPermissionsMatrix()
    ]);
  }

  @Action(AdminRolesAction.ToggleRolePermission)
  toggleRolePermission(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermission) {
    return this.adminRolesService.toggleRolePermission(action.roleId, action.permissionCode, action.granted).pipe(
      tap(updatedRole => {
        ctx.dispatch(new AdminRolesAction.ToggleRolePermissionSuccess(updatedRole));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.ToggleRolePermissionFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.ToggleRolePermissionSuccess)
  toggleRolePermissionSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermissionSuccess) {
    const state = ctx.getState();

    // Mettre à jour le rôle dans la liste des rôles
    const updatedRoles = state.roles.map(role =>
      role._id === action.updatedRole._id ? action.updatedRole : role
    );

    ctx.patchState({
      roles: updatedRoles
    });

    // Recharger la matrice des permissions pour refléter les changements
    ctx.dispatch(new AdminRolesAction.LoadPermissionsMatrix());
  }

  @Action(AdminRolesAction.ToggleRolePermissionFailure)
  toggleRolePermissionFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermissionFailure) {
    ctx.patchState({
      error: action.error,
      loading: false
    });
  }
}
