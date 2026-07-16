import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AdminRolesStateModel, AdminRole, AdminPermission, RoleStats, PermissionsMatrix } from './admin-roles.model';
import { AdminRolesAction } from './admin-roles.actions';
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
    filters: { sortBy: 'name', sortOrder: 'asc' },
    loading: false,
    rolesLoading: false,
    permissionsLoading: false,
    statsLoading: false,
    matrixLoading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminRolesState {

  constructor(private adminRolesService: AdminRolesService) {}

  // ==================== SELECTORS ====================

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
    return state.rolesLoading;
  }

  @Selector()
  static selectError(state: AdminRolesStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminRolesStateModel): Date | null {
    return state.lastUpdated;
  }

  // ==================== LOAD ROLES ====================

  @Action(AdminRolesAction.LoadRoles)
  loadRoles(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoles) {
    ctx.patchState({ rolesLoading: true, error: null });
    return this.adminRolesService.getRoles(action.filters).pipe(
      tap(roles => ctx.dispatch(new AdminRolesAction.LoadRolesSuccess(roles))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadRolesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadRolesSuccess)
  loadRolesSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRolesSuccess) {
    ctx.patchState({ roles: action.roles, rolesLoading: false, error: null, lastUpdated: new Date() });
  }

  @Action(AdminRolesAction.LoadRolesFailure)
  loadRolesFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRolesFailure) {
    ctx.patchState({ rolesLoading: false, error: action.error });
  }

  // ==================== LOAD PERMISSIONS ====================

  @Action(AdminRolesAction.LoadPermissions)
  loadPermissions(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ permissionsLoading: true, error: null });
    return this.adminRolesService.getPermissions().pipe(
      tap(permissions => ctx.dispatch(new AdminRolesAction.LoadPermissionsSuccess(permissions))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadPermissionsSuccess)
  loadPermissionsSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsSuccess) {
    ctx.patchState({ permissions: action.permissions, permissionsLoading: false, error: null });
  }

  @Action(AdminRolesAction.LoadPermissionsFailure)
  loadPermissionsFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsFailure) {
    ctx.patchState({ permissionsLoading: false, error: action.error });
  }

  // ==================== LOAD STATS ====================

  @Action(AdminRolesAction.LoadRoleStats)
  loadRoleStats(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ statsLoading: true, error: null });
    return this.adminRolesService.getRolesStats().pipe(
      tap(stats => ctx.dispatch(new AdminRolesAction.LoadRoleStatsSuccess(stats))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadRoleStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadRoleStatsSuccess)
  loadRoleStatsSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoleStatsSuccess) {
    ctx.patchState({ stats: action.stats, statsLoading: false, error: null });
  }

  @Action(AdminRolesAction.LoadRoleStatsFailure)
  loadRoleStatsFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadRoleStatsFailure) {
    ctx.patchState({ statsLoading: false, error: action.error });
  }

  // ==================== LOAD MATRIX ====================

  @Action(AdminRolesAction.LoadPermissionsMatrix)
  loadPermissionsMatrix(ctx: StateContext<AdminRolesStateModel>) {
    ctx.patchState({ matrixLoading: true, error: null });
    return this.adminRolesService.getPermissionsMatrix().pipe(
      tap(matrix => ctx.dispatch(new AdminRolesAction.LoadPermissionsMatrixSuccess(matrix))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.LoadPermissionsMatrixFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.LoadPermissionsMatrixSuccess)
  loadPermissionsMatrixSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsMatrixSuccess) {
    ctx.patchState({ permissionsMatrix: action.matrix, matrixLoading: false, error: null });
  }

  @Action(AdminRolesAction.LoadPermissionsMatrixFailure)
  loadPermissionsMatrixFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.LoadPermissionsMatrixFailure) {
    ctx.patchState({ matrixLoading: false, error: action.error });
  }

  // ==================== CREATE ROLE ====================

  @Action(AdminRolesAction.CreateRole)
  createRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRole) {
    ctx.patchState({ rolesLoading: true, error: null });
    return this.adminRolesService.createRole(action.roleData).pipe(
      tap(role => ctx.dispatch(new AdminRolesAction.CreateRoleSuccess(role))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.CreateRoleFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.CreateRoleSuccess)
  createRoleSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRoleSuccess) {
    const state = ctx.getState();
    ctx.patchState({ roles: [action.role, ...state.roles], rolesLoading: false, error: null, lastUpdated: new Date() });
  }

  @Action(AdminRolesAction.CreateRoleFailure)
  createRoleFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreateRoleFailure) {
    ctx.patchState({ rolesLoading: false, error: action.error });
  }

  // ==================== UPDATE ROLE ====================

  @Action(AdminRolesAction.UpdateRole)
  updateRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.UpdateRole) {
    ctx.patchState({ rolesLoading: true, error: null });
    return this.adminRolesService.updateRole(action.roleId, action.roleData).pipe(
      tap(role => {
        const state = ctx.getState();
        ctx.patchState({
          roles: state.roles.map(r => r._id === role._id ? role : r),
          rolesLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ rolesLoading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  // ==================== DELETE ROLE ====================

  @Action(AdminRolesAction.DeleteRole)
  deleteRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.DeleteRole) {
    ctx.patchState({ rolesLoading: true });
    return this.adminRolesService.deleteRole(action.roleId).pipe(
      tap(() => {
        const state = ctx.getState();
        ctx.patchState({ roles: state.roles.filter(r => r._id !== action.roleId), rolesLoading: false });
      }),
      catchError(error => {
        ctx.patchState({ rolesLoading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  // ==================== ASSIGN PERMISSIONS ====================

  @Action(AdminRolesAction.AssignPermissions)
  assignPermissions(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.AssignPermissions) {
    ctx.patchState({ rolesLoading: true, error: null });
    return this.adminRolesService.assignPermissions(action.roleId, action.permissionIds).pipe(
      tap(updatedRole => {
        ctx.dispatch(new AdminRolesAction.AssignPermissionsSuccess(action.roleId, updatedRole.permissions));
      }),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.AssignPermissionsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.AssignPermissionsSuccess)
  assignPermissionsSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.AssignPermissionsSuccess) {
    const state = ctx.getState();
    ctx.patchState({
      roles: state.roles.map(r => r._id === action.roleId ? { ...r, permissions: action.permissions } : r),
      rolesLoading: false,
      error: null,
      permissionsMatrix: null
    });
  }

  @Action(AdminRolesAction.AssignPermissionsFailure)
  assignPermissionsFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.AssignPermissionsFailure) {
    ctx.patchState({ rolesLoading: false, error: action.error });
  }

  // ==================== GET USERS WITH ROLE ====================

  @Action(AdminRolesAction.GetUsersWithRole)
  getUsersWithRole(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.GetUsersWithRole) {
    return this.adminRolesService.getUsersWithRole(action.roleId).pipe(
      tap(users => ctx.dispatch(new AdminRolesAction.GetUsersWithRoleSuccess(action.roleId, users))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.GetUsersWithRoleFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.GetUsersWithRoleSuccess)
  getUsersWithRoleSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.GetUsersWithRoleSuccess) {
    const state = ctx.getState();
    ctx.patchState({ roleUsers: { ...state.roleUsers, [action.roleId]: action.users } });
  }

  @Action(AdminRolesAction.GetUsersWithRoleFailure)
  getUsersWithRoleFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.GetUsersWithRoleFailure) {
    ctx.patchState({ error: action.error });
  }

  // ==================== TOGGLE PERMISSION ====================

  @Action(AdminRolesAction.ToggleRolePermission)
  toggleRolePermission(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermission) {
    return this.adminRolesService.toggleRolePermission(action.roleId, action.permissionCode, action.granted).pipe(
      tap(updatedRole => ctx.dispatch(new AdminRolesAction.ToggleRolePermissionSuccess(updatedRole))),
      catchError(error => {
        ctx.dispatch(new AdminRolesAction.ToggleRolePermissionFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.ToggleRolePermissionSuccess)
  toggleRolePermissionSuccess(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermissionSuccess) {
    const state = ctx.getState();
    const updatedRoles = state.roles.map(role =>
      role._id === action.updatedRole._id ? action.updatedRole : role
    );
    // Mettre à jour la matrice en mémoire avec nouvelle référence
    let updatedMatrix = state.permissionsMatrix;
    if (updatedMatrix && action.updatedRole) {
      const roleId = action.updatedRole._id;
      const newRolePermIds = new Set(
        (action.updatedRole.permissions as any[]).map((p: any) => p._id?.toString() || p.toString())
      );
      const newMatrixRow: { [permId: string]: boolean } = {};
      updatedMatrix.permissions.forEach(p => {
        newMatrixRow[p._id] = newRolePermIds.has(p._id);
      });
      updatedMatrix = {
        ...updatedMatrix,
        matrix: { ...updatedMatrix.matrix, [roleId]: newMatrixRow }
      };
    }
    ctx.patchState({ roles: updatedRoles, permissionsMatrix: updatedMatrix });
  }

  @Action(AdminRolesAction.ToggleRolePermissionFailure)
  toggleRolePermissionFailure(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.ToggleRolePermissionFailure) {
    ctx.patchState({ error: action.error });
  }

  // ==================== PERMISSIONS CRUD ====================

  @Action(AdminRolesAction.CreatePermission)
  createPermission(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.CreatePermission) {
    ctx.patchState({ permissionsLoading: true });
    return this.adminRolesService.createPermission(action.permissionData).pipe(
      tap(permission => {
        const state = ctx.getState();
        ctx.patchState({ permissions: [...state.permissions, permission as any], permissionsLoading: false });
      }),
      catchError(error => {
        ctx.patchState({ permissionsLoading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.UpdatePermission)
  updatePermission(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.UpdatePermission) {
    ctx.patchState({ permissionsLoading: true });
    return this.adminRolesService.updatePermission(action.permissionId, action.permissionData).pipe(
      tap(updated => {
        const state = ctx.getState();
        ctx.patchState({
          permissions: state.permissions.map(p => (p as any)._id === action.permissionId ? updated as any : p),
          permissionsLoading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ permissionsLoading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminRolesAction.DeletePermission)
  deletePermission(ctx: StateContext<AdminRolesStateModel>, action: AdminRolesAction.DeletePermission) {
    ctx.patchState({ permissionsLoading: true });
    return this.adminRolesService.deletePermission(action.permissionId).pipe(
      tap(() => {
        const state = ctx.getState();
        ctx.patchState({
          permissions: state.permissions.filter(p => (p as any)._id !== action.permissionId),
          permissionsLoading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ permissionsLoading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  // ==================== MISC ====================

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
}
