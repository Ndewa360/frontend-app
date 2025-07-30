import { 
  Role, 
  Permission, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  AssignRoleRequest,
  RoleFilters,
  PermissionFilters,
  PermissionCheck,
  UserRoleAssignment
} from './roles.model';

export namespace RolesAction {
  
  // Actions pour les rôles
  export class FetchRoles {
    static readonly type = '[Roles] Fetch Roles';
    constructor(public filters?: RoleFilters, public page?: number, public limit?: number) {}
  }

  export class FetchRoleById {
    static readonly type = '[Roles] Fetch Role By Id';
    constructor(public roleId: string) {}
  }

  export class CreateRole {
    static readonly type = '[Roles] Create Role';
    constructor(public roleData: CreateRoleRequest) {}
  }

  export class UpdateRole {
    static readonly type = '[Roles] Update Role';
    constructor(public roleData: UpdateRoleRequest) {}
  }

  export class DeleteRole {
    static readonly type = '[Roles] Delete Role';
    constructor(public roleId: string) {}
  }

  export class DuplicateRole {
    static readonly type = '[Roles] Duplicate Role';
    constructor(public roleId: string, public newName: string) {}
  }

  // Actions pour les permissions
  export class FetchPermissions {
    static readonly type = '[Roles] Fetch Permissions';
    constructor(public filters?: PermissionFilters, public page?: number, public limit?: number) {}
  }

  export class FetchPermissionsByModule {
    static readonly type = '[Roles] Fetch Permissions By Module';
    constructor(public module: string) {}
  }

  export class CreatePermission {
    static readonly type = '[Roles] Create Permission';
    constructor(public permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>) {}
  }

  export class UpdatePermission {
    static readonly type = '[Roles] Update Permission';
    constructor(public permissionId: string, public permissionData: Partial<Permission>) {}
  }

  export class DeletePermission {
    static readonly type = '[Roles] Delete Permission';
    constructor(public permissionId: string) {}
  }

  // Actions pour l'assignation de rôles
  export class AssignRolesToUser {
    static readonly type = '[Roles] Assign Roles To User';
    constructor(public assignmentData: AssignRoleRequest) {}
  }

  export class UnassignRoleFromUser {
    static readonly type = '[Roles] Unassign Role From User';
    constructor(public userId: string, public roleId: string) {}
  }

  export class FetchUserRoles {
    static readonly type = '[Roles] Fetch User Roles';
    constructor(public userId: string) {}
  }

  export class FetchUsersWithRole {
    static readonly type = '[Roles] Fetch Users With Role';
    constructor(public roleId: string) {}
  }

  // Actions pour la validation des permissions
  export class CheckPermission {
    static readonly type = '[Roles] Check Permission';
    constructor(public userId: string, public permissionCheck: PermissionCheck) {}
  }

  export class CheckMultiplePermissions {
    static readonly type = '[Roles] Check Multiple Permissions';
    constructor(public userId: string, public permissionChecks: PermissionCheck[]) {}
  }

  // Actions pour les statistiques
  export class FetchRoleStats {
    static readonly type = '[Roles] Fetch Role Stats';
  }

  export class FetchPermissionUsageStats {
    static readonly type = '[Roles] Fetch Permission Usage Stats';
  }

  // Actions pour l'audit
  export class FetchRoleAuditLog {
    static readonly type = '[Roles] Fetch Role Audit Log';
    constructor(public roleId?: string, public userId?: string, public limit?: number) {}
  }

  // Actions pour les templates de rôles
  export class FetchRoleTemplates {
    static readonly type = '[Roles] Fetch Role Templates';
  }

  export class CreateRoleFromTemplate {
    static readonly type = '[Roles] Create Role From Template';
    constructor(public templateId: string, public roleName: string, public description?: string) {}
  }

  // Actions pour la gestion des filtres
  export class SetRoleFilters {
    static readonly type = '[Roles] Set Role Filters';
    constructor(public filters: RoleFilters) {}
  }

  export class SetPermissionFilters {
    static readonly type = '[Roles] Set Permission Filters';
    constructor(public filters: PermissionFilters) {}
  }

  export class ClearFilters {
    static readonly type = '[Roles] Clear Filters';
  }

  // Actions pour la sélection
  export class SelectRole {
    static readonly type = '[Roles] Select Role';
    constructor(public role: Role | null) {}
  }

  export class SelectPermissions {
    static readonly type = '[Roles] Select Permissions';
    constructor(public permissions: Permission[]) {}
  }

  // Actions pour la synchronisation
  export class SyncRolesWithSystem {
    static readonly type = '[Roles] Sync Roles With System';
  }

  export class RefreshUserPermissions {
    static readonly type = '[Roles] Refresh User Permissions';
    constructor(public userId: string) {}
  }

  // Actions pour l'import/export
  export class ExportRoles {
    static readonly type = '[Roles] Export Roles';
    constructor(public format: 'json' | 'csv' | 'excel' = 'json') {}
  }

  export class ImportRoles {
    static readonly type = '[Roles] Import Roles';
    constructor(public file: File, public options?: { overwrite?: boolean; validateOnly?: boolean }) {}
  }

  // Actions pour la gestion des erreurs
  export class ClearError {
    static readonly type = '[Roles] Clear Error';
  }

  export class SetLoading {
    static readonly type = '[Roles] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Actions pour les opérations en lot
  export class BulkUpdateRoles {
    static readonly type = '[Roles] Bulk Update Roles';
    constructor(public roleIds: string[], public updates: Partial<Role>) {}
  }

  export class BulkDeleteRoles {
    static readonly type = '[Roles] Bulk Delete Roles';
    constructor(public roleIds: string[]) {}
  }

  export class BulkAssignRoles {
    static readonly type = '[Roles] Bulk Assign Roles';
    constructor(public userIds: string[], public roleIds: string[]) {}
  }

  // Actions pour la recherche avancée
  export class SearchRoles {
    static readonly type = '[Roles] Search Roles';
    constructor(public query: string, public filters?: RoleFilters) {}
  }

  export class SearchPermissions {
    static readonly type = '[Roles] Search Permissions';
    constructor(public query: string, public filters?: PermissionFilters) {}
  }

  // Actions pour la validation
  export class ValidateRoleName {
    static readonly type = '[Roles] Validate Role Name';
    constructor(public name: string, public excludeId?: string) {}
  }

  export class ValidatePermissionName {
    static readonly type = '[Roles] Validate Permission Name';
    constructor(public name: string, public excludeId?: string) {}
  }
}
