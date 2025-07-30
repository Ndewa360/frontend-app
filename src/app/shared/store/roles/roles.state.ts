import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { RolesService } from './roles.service';
import { RolesAction } from './roles.actions';
import { 
  RolesStateModel, 
  Role, 
  Permission, 
  RoleStats,
  UserRoleAssignment,
  RoleFilters,
  PermissionFilters
} from './roles.model';

@State<RolesStateModel>({
  name: 'roles',
  defaults: {
    roles: [],
    permissions: [],
    userRoleAssignments: [],
    selectedRole: null,
    selectedPermissions: [],
    loading: false,
    error: null,
    stats: null,
    filters: {},
    permissionFilters: {}
  }
})
@Injectable()
export class RolesState {

  constructor(private rolesService: RolesService) {}

  // ==================== SELECTORS ====================

  @Selector()
  static selectRoles(state: RolesStateModel): Role[] {
    return state.roles;
  }

  @Selector()
  static selectPermissions(state: RolesStateModel): Permission[] {
    return state.permissions;
  }

  @Selector()
  static selectSelectedRole(state: RolesStateModel): Role | null {
    return state.selectedRole;
  }

  @Selector()
  static selectSelectedPermissions(state: RolesStateModel): Permission[] {
    return state.selectedPermissions;
  }

  @Selector()
  static selectLoading(state: RolesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: RolesStateModel): string | null {
    return state.error;
  }

  @Selector()
  static selectStats(state: RolesStateModel): RoleStats | null {
    return state.stats;
  }

  @Selector()
  static selectUserRoleAssignments(state: RolesStateModel): UserRoleAssignment[] {
    return state.userRoleAssignments;
  }

  @Selector()
  static selectActiveRoles(state: RolesStateModel): Role[] {
    return state.roles.filter(role => role.isActive);
  }

  @Selector()
  static selectSystemRoles(state: RolesStateModel): Role[] {
    return state.roles.filter(role => role.isSystemRole);
  }

  @Selector()
  static selectCustomRoles(state: RolesStateModel): Role[] {
    return state.roles.filter(role => !role.isSystemRole);
  }

  @Selector()
  static selectRoleFilters(state: RolesStateModel): RoleFilters {
    return state.filters;
  }

  @Selector()
  static selectPermissionFilters(state: RolesStateModel): PermissionFilters {
    return state.permissionFilters;
  }

  // Sélecteur pour obtenir un rôle par ID
  static selectRoleById(roleId: string) {
    return (state: RolesStateModel) => state.roles.find(role => role.id === roleId);
  }

  // Sélecteur pour obtenir les permissions d'un rôle
  static selectRolePermissions(roleId: string) {
    return (state: RolesStateModel) => {
      const role = state.roles.find(r => r.id === roleId);
      return role ? role.permissions : [];
    };
  }

  // Sélecteur pour obtenir les permissions par module
  static selectPermissionsByModule(module: string) {
    return (state: RolesStateModel) => state.permissions.filter(permission => permission.module === module);
  }

  // ==================== ACTIONS POUR LES RÔLES ====================

  @Action(RolesAction.FetchRoles)
  fetchRoles(ctx: StateContext<RolesStateModel>, action: RolesAction.FetchRoles) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.getRoles(action.filters, action.page, action.limit).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          ctx.patchState({
            roles: response.data.roles,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des rôles'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.FetchRoleById)
  fetchRoleById(ctx: StateContext<RolesStateModel>, action: RolesAction.FetchRoleById) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.getRoleById(action.roleId).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          ctx.patchState({
            selectedRole: response.data,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement du rôle'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.CreateRole)
  createRole(ctx: StateContext<RolesStateModel>, action: RolesAction.CreateRole) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.createRole(action.roleData).pipe(
      tap(response => {
        if (response.statusCode === 201) {
          const state = ctx.getState();
          ctx.patchState({
            roles: [...state.roles, response.data],
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la création du rôle'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.UpdateRole)
  updateRole(ctx: StateContext<RolesStateModel>, action: RolesAction.UpdateRole) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.updateRole(action.roleData).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          const state = ctx.getState();
          const updatedRoles = state.roles.map(role => 
            role.id === response.data.id ? response.data : role
          );
          ctx.patchState({
            roles: updatedRoles,
            selectedRole: response.data,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la mise à jour du rôle'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.DeleteRole)
  deleteRole(ctx: StateContext<RolesStateModel>, action: RolesAction.DeleteRole) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.deleteRole(action.roleId).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          const state = ctx.getState();
          const filteredRoles = state.roles.filter(role => role.id !== action.roleId);
          ctx.patchState({
            roles: filteredRoles,
            selectedRole: state.selectedRole?.id === action.roleId ? null : state.selectedRole,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la suppression du rôle'
        });
        return of(error);
      })
    );
  }

  // ==================== ACTIONS POUR LES PERMISSIONS ====================

  @Action(RolesAction.FetchPermissions)
  fetchPermissions(ctx: StateContext<RolesStateModel>, action: RolesAction.FetchPermissions) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.getPermissions(action.filters, action.page, action.limit).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          ctx.patchState({
            permissions: response.data.permissions,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des permissions'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.CreatePermission)
  createPermission(ctx: StateContext<RolesStateModel>, action: RolesAction.CreatePermission) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.createPermission(action.permissionData).pipe(
      tap(response => {
        if (response.statusCode === 201) {
          const state = ctx.getState();
          ctx.patchState({
            permissions: [...state.permissions, response.data],
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la création de la permission'
        });
        return of(error);
      })
    );
  }

  // ==================== ACTIONS POUR L'ASSIGNATION ====================

  @Action(RolesAction.AssignRolesToUser)
  assignRolesToUser(ctx: StateContext<RolesStateModel>, action: RolesAction.AssignRolesToUser) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.assignRolesToUser(action.assignmentData).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          const state = ctx.getState();
          ctx.patchState({
            userRoleAssignments: [...state.userRoleAssignments, ...response.data],
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de l\'assignation des rôles'
        });
        return of(error);
      })
    );
  }

  @Action(RolesAction.FetchUserRoles)
  fetchUserRoles(ctx: StateContext<RolesStateModel>, action: RolesAction.FetchUserRoles) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.getUserRoles(action.userId).pipe(
      tap(response => {
        if (response.statusCode === 200) {
          ctx.patchState({
            userRoleAssignments: response.data.assignments,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des rôles utilisateur'
        });
        return of(error);
      })
    );
  }

  // ==================== ACTIONS POUR LES STATISTIQUES ====================

  @Action(RolesAction.FetchRoleStats)
  fetchRoleStats(ctx: StateContext<RolesStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.rolesService.getRoleStats().pipe(
      tap(response => {
        if (response.statusCode === 200) {
          ctx.patchState({
            stats: response.data,
            loading: false
          });
        }
      }),
      catchError(error => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des statistiques'
        });
        return of(error);
      })
    );
  }

  // ==================== ACTIONS POUR LA GESTION D'ÉTAT ====================

  @Action(RolesAction.SelectRole)
  selectRole(ctx: StateContext<RolesStateModel>, action: RolesAction.SelectRole) {
    ctx.patchState({ selectedRole: action.role });
  }

  @Action(RolesAction.SelectPermissions)
  selectPermissions(ctx: StateContext<RolesStateModel>, action: RolesAction.SelectPermissions) {
    ctx.patchState({ selectedPermissions: action.permissions });
  }

  @Action(RolesAction.SetRoleFilters)
  setRoleFilters(ctx: StateContext<RolesStateModel>, action: RolesAction.SetRoleFilters) {
    ctx.patchState({ filters: action.filters });
  }

  @Action(RolesAction.SetPermissionFilters)
  setPermissionFilters(ctx: StateContext<RolesStateModel>, action: RolesAction.SetPermissionFilters) {
    ctx.patchState({ permissionFilters: action.filters });
  }

  @Action(RolesAction.ClearFilters)
  clearFilters(ctx: StateContext<RolesStateModel>) {
    ctx.patchState({ filters: {}, permissionFilters: {} });
  }

  @Action(RolesAction.ClearError)
  clearError(ctx: StateContext<RolesStateModel>) {
    ctx.patchState({ error: null });
  }

  @Action(RolesAction.SetLoading)
  setLoading(ctx: StateContext<RolesStateModel>, action: RolesAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }
}
