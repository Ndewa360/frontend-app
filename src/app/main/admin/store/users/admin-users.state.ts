import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminUsersStateModel, AdminUser, AdminUserStats } from './admin-users.model';

// Actions
import { AdminUsersAction } from './admin-users.actions';

// Services
import { AdminUsersService } from '../../services/admin-users.service';

@State<AdminUsersStateModel>({
  name: 'adminUsers',
  defaults: {
    users: [],
    selectedUser: null,
    stats: null,
    filters: {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminUsersState {

  constructor(private adminUsersService: AdminUsersService) {}

  // Selectors
  @Selector()
  static selectUsers(state: AdminUsersStateModel): AdminUser[] {
    return state.users;
  }

  @Selector()
  static selectSelectedUser(state: AdminUsersStateModel): AdminUser | null {
    return state.selectedUser;
  }

  @Selector()
  static selectStats(state: AdminUsersStateModel): AdminUserStats | null {
    return state.stats;
  }

  @Selector()
  static selectFilters(state: AdminUsersStateModel) {
    return state.filters;
  }

  @Selector()
  static selectPagination(state: AdminUsersStateModel) {
    return state.pagination;
  }

  @Selector()
  static selectIsLoading(state: AdminUsersStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminUsersStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminUsersStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  @Action(AdminUsersAction.LoadUsers)
  loadUsers(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUsers) {
    ctx.patchState({ loading: true, error: null });

    const filters = action.filters || ctx.getState().filters;

    return this.adminUsersService.getUsers(filters).pipe(
      tap(response => {
        ctx.dispatch(new AdminUsersAction.LoadUsersSuccess(
          response.data,
          response.meta.total,
          response.meta
        ));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.LoadUsersFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.LoadUsersSuccess)
  loadUsersSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUsersSuccess) {
    ctx.patchState({
      users: action.users || [],
      pagination: {
        page: action.meta?.page || 1,
        limit: action.meta?.limit || 20,
        total: action.total || 0,
        totalPages: action.meta?.totalPages || 0
      },
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminUsersAction.LoadUsersFailure)
  loadUsersFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUsersFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.LoadUserStats)
  loadUserStats(ctx: StateContext<AdminUsersStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.adminUsersService.getUsersStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminUsersAction.LoadUserStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.LoadUserStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.LoadUserStatsSuccess)
  loadUserStatsSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUserStatsSuccess) {
    ctx.patchState({
      stats: action.stats,
      loading: false,
      error: null
    });
  }

  @Action(AdminUsersAction.LoadUserStatsFailure)
  loadUserStatsFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUserStatsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.LoadUser)
  loadUser(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUser) {
    ctx.patchState({ loading: true, error: null });

    return this.adminUsersService.getUserById(action.userId).pipe(
      tap(user => {
        ctx.dispatch(new AdminUsersAction.LoadUserSuccess(user));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.LoadUserFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.LoadUserSuccess)
  loadUserSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUserSuccess) {
    ctx.patchState({
      selectedUser: action.user,
      loading: false,
      error: null
    });
  }

  @Action(AdminUsersAction.LoadUserFailure)
  loadUserFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.LoadUserFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.CreateUser)
  createUser(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.CreateUser) {
    ctx.patchState({ loading: true, error: null });

    return this.adminUsersService.createUser(action.userData).pipe(
      tap(user => {
        ctx.dispatch(new AdminUsersAction.CreateUserSuccess(user));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.CreateUserFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.CreateUserSuccess)
  createUserSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.CreateUserSuccess) {
    const state = ctx.getState();
    ctx.patchState({
      users: [action.user, ...state.users],
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminUsersAction.CreateUserFailure)
  createUserFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.CreateUserFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.UpdateUser)
  updateUser(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.UpdateUser) {
    ctx.patchState({ loading: true, error: null });

    return this.adminUsersService.updateUser(action.userId, action.userData).pipe(
      tap(user => {
        ctx.dispatch(new AdminUsersAction.UpdateUserSuccess(user));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.UpdateUserFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.UpdateUserSuccess)
  updateUserSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.UpdateUserSuccess) {
    const state = ctx.getState();
    const updatedUsers = state.users.map(user =>
      user._id === action.user._id ? action.user : user
    );

    ctx.patchState({
      users: updatedUsers,
      selectedUser: state.selectedUser?._id === action.user._id ? action.user : state.selectedUser,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminUsersAction.UpdateUserFailure)
  updateUserFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.UpdateUserFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.DeleteUser)
  deleteUser(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.DeleteUser) {
    ctx.patchState({ loading: true, error: null });

    return this.adminUsersService.deleteUser(action.userId).pipe(
      tap(() => {
        ctx.dispatch(new AdminUsersAction.DeleteUserSuccess(action.userId));
      }),
      catchError(error => {
        ctx.dispatch(new AdminUsersAction.DeleteUserFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.DeleteUserSuccess)
  deleteUserSuccess(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.DeleteUserSuccess) {
    const state = ctx.getState();
    const filteredUsers = state.users.filter(user => user._id !== action.userId);

    ctx.patchState({
      users: filteredUsers,
      selectedUser: state.selectedUser?._id === action.userId ? null : state.selectedUser,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminUsersAction.DeleteUserFailure)
  deleteUserFailure(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.DeleteUserFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminUsersAction.BulkAction)
  bulkAction(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.BulkAction) {
    ctx.patchState({ loading: true });
    return this.adminUsersService.bulkAction({ userIds: action.userIds, action: action.action as any, data: action.data }).pipe(
      tap(result => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new AdminUsersAction.RefreshData());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminUsersAction.SetFilters)
  setFilters(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.SetFilters) {
    ctx.patchState({
      filters: { ...ctx.getState().filters, ...action.filters }
    });
  }

  @Action(AdminUsersAction.SetLoading)
  setLoading(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminUsersAction.ClearState)
  clearState(ctx: StateContext<AdminUsersStateModel>) {
    ctx.patchState({
      users: [],
      selectedUser: null,
      stats: null,
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminUsersAction.RefreshData)
  refreshData(ctx: StateContext<AdminUsersStateModel>) {
    const state = ctx.getState();
    ctx.dispatch([
      new AdminUsersAction.LoadUsers(state.filters),
      new AdminUsersAction.LoadUserStats()
    ]);
  }

  @Action(AdminUsersAction.ExportUsers)
  exportUsers(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.ExportUsers) {
    return this.adminUsersService.exportUsers(action.filters, action.format).pipe(
      tap((result) => {
        if (result?.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
        }
      }),
      catchError(error => throwError(error))
    );
  }

  @Action(AdminUsersAction.ResetPassword)
  resetPassword(ctx: StateContext<AdminUsersStateModel>, action: AdminUsersAction.ResetPassword) {
    return this.adminUsersService.resetPassword(action.userId, true).pipe(
      catchError(error => throwError(error))
    );
  }
}
