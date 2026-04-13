import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminSettingsStateModel, AdminSettings, SystemInfo, BackupInfo } from './admin-settings.model';

// Actions
import { AdminSettingsAction } from './admin-settings.actions';

// Services
import { AdminSettingsService } from '../../services/admin-settings.service';

@State<AdminSettingsStateModel>({
  name: 'adminSettings',
  defaults: {
    settings: null,
    systemInfo: null,
    backups: [],
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminSettingsState {

  constructor(private adminSettingsService: AdminSettingsService) {}

  // Selectors
  @Selector()
  static selectSettings(state: AdminSettingsStateModel): AdminSettings | null {
    return state.settings;
  }

  @Selector()
  static selectSystemInfo(state: AdminSettingsStateModel): SystemInfo | null {
    return state.systemInfo;
  }

  @Selector()
  static selectBackups(state: AdminSettingsStateModel): BackupInfo[] {
    return state.backups;
  }

  @Selector()
  static selectIsLoading(state: AdminSettingsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminSettingsStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminSettingsStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  @Action(AdminSettingsAction.LoadSettings)
  loadSettings(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminSettingsService.getSettings().pipe(
      tap(settings => {
        ctx.dispatch(new AdminSettingsAction.LoadSettingsSuccess(settings));
      }),
      catchError(error => {
        ctx.dispatch(new AdminSettingsAction.LoadSettingsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminSettingsAction.LoadSettingsSuccess)
  loadSettingsSuccess(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.LoadSettingsSuccess) {
    ctx.patchState({
      settings: action.settings,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminSettingsAction.LoadSettingsFailure)
  loadSettingsFailure(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.LoadSettingsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminSettingsAction.UpdateSettings)
  updateSettings(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.UpdateSettings) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminSettingsService.updateSettings(action.settingsData).pipe(
      tap(settings => {
        ctx.dispatch(new AdminSettingsAction.UpdateSettingsSuccess(settings));
      }),
      catchError(error => {
        ctx.dispatch(new AdminSettingsAction.UpdateSettingsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminSettingsAction.UpdateSettingsSuccess)
  updateSettingsSuccess(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.UpdateSettingsSuccess) {
    ctx.patchState({
      settings: action.settings,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminSettingsAction.UpdateSettingsFailure)
  updateSettingsFailure(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.UpdateSettingsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminSettingsAction.LoadSystemInfo)
  loadSystemInfo(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminSettingsService.getSystemInfo().pipe(
      tap(systemInfo => {
        ctx.dispatch(new AdminSettingsAction.LoadSystemInfoSuccess(systemInfo));
      }),
      catchError(error => {
        ctx.dispatch(new AdminSettingsAction.LoadSystemInfoFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminSettingsAction.LoadSystemInfoSuccess)
  loadSystemInfoSuccess(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.LoadSystemInfoSuccess) {
    ctx.patchState({
      systemInfo: action.systemInfo,
      loading: false,
      error: null
    });
  }

  @Action(AdminSettingsAction.LoadSystemInfoFailure)
  loadSystemInfoFailure(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.LoadSystemInfoFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminSettingsAction.SetLoading)
  setLoading(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminSettingsAction.ClearState)
  clearState(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.patchState({
      settings: null,
      systemInfo: null,
      backups: [],
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminSettingsAction.RefreshData)
  refreshData(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.dispatch([
      new AdminSettingsAction.LoadSettings(),
      new AdminSettingsAction.LoadSystemInfo()
    ]);
  }

  @Action(AdminSettingsAction.BackupDatabase)
  backupDatabase(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.patchState({ loading: true });
    return this.adminSettingsService.createBackup().pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new AdminSettingsAction.BackupDatabaseSuccess(result));
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        ctx.dispatch(new AdminSettingsAction.BackupDatabaseFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminSettingsAction.TestEmailConfiguration)
  testEmailConfiguration(ctx: StateContext<AdminSettingsStateModel>, action: AdminSettingsAction.TestEmailConfiguration) {
    return this.adminSettingsService.testEmailConfiguration(action.testEmail).pipe(
      catchError(error => throwError(error))
    );
  }

  @Action(AdminSettingsAction.ClearCache)
  clearCache(ctx: StateContext<AdminSettingsStateModel>) {
    ctx.patchState({ loading: true });
    return this.adminSettingsService.clearCache().pipe(
      tap((result) => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new AdminSettingsAction.ClearCacheSuccess(result));
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        ctx.dispatch(new AdminSettingsAction.ClearCacheFailure(error));
        return throwError(error);
      })
    );
  }
}
