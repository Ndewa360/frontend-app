import { AdminRole } from './admin-roles.model';

export namespace AdminRolesAction {
  
  // Load Roles
  export class LoadRoles {
    static readonly type = '[Admin Roles] Load Roles';
    constructor(public filters?: any) {}
  }

  export class LoadRolesSuccess {
    static readonly type = '[Admin Roles] Load Roles Success';
    constructor(public roles: any[]) {}
  }

  export class LoadRolesFailure {
    static readonly type = '[Admin Roles] Load Roles Failure';
    constructor(public error: any) {}
  }

  // Load Permissions
  export class LoadPermissions {
    static readonly type = '[Admin Roles] Load Permissions';
  }

  export class LoadPermissionsSuccess {
    static readonly type = '[Admin Roles] Load Permissions Success';
    constructor(public permissions: any[]) {}
  }

  export class LoadPermissionsFailure {
    static readonly type = '[Admin Roles] Load Permissions Failure';
    constructor(public error: any) {}
  }

  // Load Role Stats
  export class LoadRoleStats {
    static readonly type = '[Admin Roles] Load Role Stats';
  }

  export class LoadRoleStatsSuccess {
    static readonly type = '[Admin Roles] Load Role Stats Success';
    constructor(public stats: any) {}
  }

  export class LoadRoleStatsFailure {
    static readonly type = '[Admin Roles] Load Role Stats Failure';
    constructor(public error: any) {}
  }

  // Load Permissions Matrix
  export class LoadPermissionsMatrix {
    static readonly type = '[Admin Roles] Load Permissions Matrix';
  }

  export class LoadPermissionsMatrixSuccess {
    static readonly type = '[Admin Roles] Load Permissions Matrix Success';
    constructor(public matrix: any) {}
  }

  export class LoadPermissionsMatrixFailure {
    static readonly type = '[Admin Roles] Load Permissions Matrix Failure';
    constructor(public error: any) {}
  }

  // Create Role
  export class CreateRole {
    static readonly type = '[Admin Roles] Create Role';
    constructor(public roleData: any) {}
  }

  export class CreateRoleSuccess {
    static readonly type = '[Admin Roles] Create Role Success';
    constructor(public role: any) {}
  }

  export class CreateRoleFailure {
    static readonly type = '[Admin Roles] Create Role Failure';
    constructor(public error: any) {}
  }

  // Update Role
  export class UpdateRole {
    static readonly type = '[Admin Roles] Update Role';
    constructor(public roleId: string, public roleData: any) {}
  }

  export class UpdateRoleSuccess {
    static readonly type = '[Admin Roles] Update Role Success';
    constructor(public role: any) {}
  }

  export class UpdateRoleFailure {
    static readonly type = '[Admin Roles] Update Role Failure';
    constructor(public error: any) {}
  }

  // Delete Role
  export class DeleteRole {
    static readonly type = '[Admin Roles] Delete Role';
    constructor(public roleId: string) {}
  }

  export class DeleteRoleSuccess {
    static readonly type = '[Admin Roles] Delete Role Success';
    constructor(public roleId: string) {}
  }

  export class DeleteRoleFailure {
    static readonly type = '[Admin Roles] Delete Role Failure';
    constructor(public error: any) {}
  }

  // Assign Permissions
  export class AssignPermissions {
    static readonly type = '[Admin Roles] Assign Permissions';
    constructor(public roleId: string, public permissionIds: string[]) {}
  }

  export class AssignPermissionsSuccess {
    static readonly type = '[Admin Roles] Assign Permissions Success';
    constructor(public roleId: string, public permissions: any[]) {}
  }

  export class AssignPermissionsFailure {
    static readonly type = '[Admin Roles] Assign Permissions Failure';
    constructor(public error: any) {}
  }

  // Get Users with Role
  export class GetUsersWithRole {
    static readonly type = '[Admin Roles] Get Users with Role';
    constructor(public roleId: string) {}
  }

  export class GetUsersWithRoleSuccess {
    static readonly type = '[Admin Roles] Get Users with Role Success';
    constructor(public roleId: string, public users: any[]) {}
  }

  export class GetUsersWithRoleFailure {
    static readonly type = '[Admin Roles] Get Users with Role Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Roles] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Roles] Clear State';
  }

  // Refresh Data
  export class RefreshData {
    static readonly type = '[Admin Roles] Refresh Data';
  }

  // Toggle Role Permission
  export class ToggleRolePermission {
    static readonly type = '[Admin Roles] Toggle Role Permission';
    constructor(public roleId: string, public permissionCode: string, public granted: boolean) {}
  }

  export class ToggleRolePermissionSuccess {
    static readonly type = '[Admin Roles] Toggle Role Permission Success';
    constructor(public updatedRole: AdminRole) {}
  }

  export class ToggleRolePermissionFailure {
    static readonly type = '[Admin Roles] Toggle Role Permission Failure';
    constructor(public error: any) {}
  }

  // Create Permission
  export class CreatePermission {
    static readonly type = '[Admin Roles] Create Permission';
    constructor(public permissionData: any) {}
  }

  // Update Permission
  export class UpdatePermission {
    static readonly type = '[Admin Roles] Update Permission';
    constructor(public permissionId: string, public permissionData: any) {}
  }

  // Delete Permission
  export class DeletePermission {
    static readonly type = '[Admin Roles] Delete Permission';
    constructor(public permissionId: string) {}
  }
}
