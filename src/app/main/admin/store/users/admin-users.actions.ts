export namespace AdminUsersAction {
  
  // Load Actions
  export class LoadUsers {
    static readonly type = '[Admin Users] Load Users';
    constructor(public filters?: any) {}
  }

  export class LoadUsersSuccess {
    static readonly type = '[Admin Users] Load Users Success';
    constructor(public users: any[], public total: number, public meta: any) {}
  }

  export class LoadUsersFailure {
    static readonly type = '[Admin Users] Load Users Failure';
    constructor(public error: any) {}
  }

  // Load User Stats
  export class LoadUserStats {
    static readonly type = '[Admin Users] Load User Stats';
  }

  export class LoadUserStatsSuccess {
    static readonly type = '[Admin Users] Load User Stats Success';
    constructor(public stats: any) {}
  }

  export class LoadUserStatsFailure {
    static readonly type = '[Admin Users] Load User Stats Failure';
    constructor(public error: any) {}
  }

  // Load Single User
  export class LoadUser {
    static readonly type = '[Admin Users] Load User';
    constructor(public userId: string) {}
  }

  export class LoadUserSuccess {
    static readonly type = '[Admin Users] Load User Success';
    constructor(public user: any) {}
  }

  export class LoadUserFailure {
    static readonly type = '[Admin Users] Load User Failure';
    constructor(public error: any) {}
  }

  // Create User
  export class CreateUser {
    static readonly type = '[Admin Users] Create User';
    constructor(public userData: any) {}
  }

  export class CreateUserSuccess {
    static readonly type = '[Admin Users] Create User Success';
    constructor(public user: any) {}
  }

  export class CreateUserFailure {
    static readonly type = '[Admin Users] Create User Failure';
    constructor(public error: any) {}
  }

  // Update User
  export class UpdateUser {
    static readonly type = '[Admin Users] Update User';
    constructor(public userId: string, public userData: any) {}
  }

  export class UpdateUserSuccess {
    static readonly type = '[Admin Users] Update User Success';
    constructor(public user: any) {}
  }

  export class UpdateUserFailure {
    static readonly type = '[Admin Users] Update User Failure';
    constructor(public error: any) {}
  }

  // Delete User
  export class DeleteUser {
    static readonly type = '[Admin Users] Delete User';
    constructor(public userId: string) {}
  }

  export class DeleteUserSuccess {
    static readonly type = '[Admin Users] Delete User Success';
    constructor(public userId: string) {}
  }

  export class DeleteUserFailure {
    static readonly type = '[Admin Users] Delete User Failure';
    constructor(public error: any) {}
  }

  // Bulk Actions
  export class BulkAction {
    static readonly type = '[Admin Users] Bulk Action';
    constructor(public action: string, public userIds: string[], public data?: any) {}
  }

  export class BulkActionSuccess {
    static readonly type = '[Admin Users] Bulk Action Success';
    constructor(public result: any) {}
  }

  export class BulkActionFailure {
    static readonly type = '[Admin Users] Bulk Action Failure';
    constructor(public error: any) {}
  }

  // Assign Role
  export class AssignRole {
    static readonly type = '[Admin Users] Assign Role';
    constructor(public userId: string, public roleIds: string[]) {}
  }

  export class AssignRoleSuccess {
    static readonly type = '[Admin Users] Assign Role Success';
    constructor(public userId: string, public roles: any[]) {}
  }

  export class AssignRoleFailure {
    static readonly type = '[Admin Users] Assign Role Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Users] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Set Filters
  export class SetFilters {
    static readonly type = '[Admin Users] Set Filters';
    constructor(public filters: any) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Users] Clear State';
  }

  // Refresh Data
  export class RefreshData {
    static readonly type = '[Admin Users] Refresh Data';
  }
}
