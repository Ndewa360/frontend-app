export namespace AdminSettingsAction {
  
  // Load Settings
  export class LoadSettings {
    static readonly type = '[Admin Settings] Load Settings';
  }

  export class LoadSettingsSuccess {
    static readonly type = '[Admin Settings] Load Settings Success';
    constructor(public settings: any) {}
  }

  export class LoadSettingsFailure {
    static readonly type = '[Admin Settings] Load Settings Failure';
    constructor(public error: any) {}
  }

  // Update Settings
  export class UpdateSettings {
    static readonly type = '[Admin Settings] Update Settings';
    constructor(public settingsData: any) {}
  }

  export class UpdateSettingsSuccess {
    static readonly type = '[Admin Settings] Update Settings Success';
    constructor(public settings: any) {}
  }

  export class UpdateSettingsFailure {
    static readonly type = '[Admin Settings] Update Settings Failure';
    constructor(public error: any) {}
  }

  // Load System Info
  export class LoadSystemInfo {
    static readonly type = '[Admin Settings] Load System Info';
  }

  export class LoadSystemInfoSuccess {
    static readonly type = '[Admin Settings] Load System Info Success';
    constructor(public systemInfo: any) {}
  }

  export class LoadSystemInfoFailure {
    static readonly type = '[Admin Settings] Load System Info Failure';
    constructor(public error: any) {}
  }

  // Test Email Configuration
  export class TestEmailConfiguration {
    static readonly type = '[Admin Settings] Test Email Configuration';
    constructor(public testEmail: string) {}
  }

  // Backup Database
  export class BackupDatabase {
    static readonly type = '[Admin Settings] Backup Database';
  }

  export class BackupDatabaseSuccess {
    static readonly type = '[Admin Settings] Backup Database Success';
    constructor(public backupInfo: any) {}
  }

  export class BackupDatabaseFailure {
    static readonly type = '[Admin Settings] Backup Database Failure';
    constructor(public error: any) {}
  }

  // Clear Cache
  export class ClearCache {
    static readonly type = '[Admin Settings] Clear Cache';
  }

  export class ClearCacheSuccess {
    static readonly type = '[Admin Settings] Clear Cache Success';
    constructor(public result: any) {}
  }

  export class ClearCacheFailure {
    static readonly type = '[Admin Settings] Clear Cache Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Settings] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Settings] Clear State';
  }

  // Refresh Data
  export class RefreshData {
    static readonly type = '[Admin Settings] Refresh Data';
  }
}
