import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';

// Actions
import { AdminSettingsAction } from '../../store/settings/admin-settings.actions';

// States
import { AdminSettingsState } from '../../store/settings/admin-settings.state';

// Models
import { AdminSettings } from '../../store/settings/admin-settings.model';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  settings$ = this.store.select(AdminSettingsState.selectSettings);
  systemInfo$ = this.store.select(AdminSettingsState.selectSystemInfo);
  isLoading$ = this.store.select(AdminSettingsState.selectIsLoading);

  // Component state
  selectedTab = 'general';
  settingsForm: FormGroup;
  hasUnsavedChanges = false;

  // Settings sections
  settingsSections = [
    { key: 'general', label: 'Général', icon: 'settings' },
    { key: 'email', label: 'Email', icon: 'email' },
    { key: 'payment', label: 'Paiements', icon: 'currency-dollar' },
    { key: 'security', label: 'Sécurité', icon: 'security' },
    { key: 'notifications', label: 'Notifications', icon: 'notification' },
    { key: 'maintenance', label: 'Maintenance', icon: 'tools' },
    { key: 'integrations', label: 'Intégrations', icon: 'connect' }
  ];

  constructor(
    private store: Store,
    private formBuilder: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFormSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminSettingsAction.LoadSettings(),
      new AdminSettingsAction.LoadSystemInfo()
    ]);
  }

  private initializeForm(): void {
    this.settingsForm = this.formBuilder.group({
      // General settings
      appName: ['', Validators.required],
      appDescription: [''],
      supportEmail: ['', [Validators.required, Validators.email]],
      supportPhone: [''],
      defaultLanguage: ['fr'],
      defaultTimezone: ['Africa/Douala'],
      defaultCurrency: ['XAF'],
      maintenanceMode: [false],
      registrationEnabled: [true],
      emailVerificationRequired: [true],
      
      // Email settings
      emailProvider: ['smtp'],
      smtpHost: [''],
      smtpPort: [587],
      smtpSecure: [true],
      smtpUser: [''],
      smtpPassword: [''],
      fromEmail: ['', Validators.email],
      fromName: [''],
      
      // Payment settings
      stripeEnabled: [false],
      stripePublicKey: [''],
      stripeSecretKey: [''],
      paypalEnabled: [false],
      paypalClientId: [''],
      paypalClientSecret: [''],
      mobileMoneyEnabled: [false],
      
      // Security settings
      passwordMinLength: [8, [Validators.min(6), Validators.max(32)]],
      passwordRequireUppercase: [true],
      passwordRequireLowercase: [true],
      passwordRequireNumbers: [true],
      passwordRequireSymbols: [false],
      sessionTimeout: [3600],
      maxLoginAttempts: [5],
      lockoutDuration: [900],
      twoFactorRequired: [false],
      
      // Notification settings
      emailNotificationsEnabled: [true],
      smsNotificationsEnabled: [false],
      pushNotificationsEnabled: [false],
      
      // Maintenance settings
      backupsEnabled: [true],
      backupFrequency: ['daily'],
      backupRetention: [30]
    });
  }

  private setupFormSubscription(): void {
    this.settingsForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUnsavedChanges = this.settingsForm.dirty;
      });

    // Load settings into form when available
    this.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        if (settings) {
          this.populateForm(settings);
        }
      });
  }

  private populateForm(settings: AdminSettings): void {
    this.settingsForm.patchValue({
      // General
      appName: settings.general.appName,
      appDescription: settings.general.appDescription,
      supportEmail: settings.general.supportEmail,
      supportPhone: settings.general.supportPhone,
      defaultLanguage: settings.general.defaultLanguage,
      defaultTimezone: settings.general.defaultTimezone,
      defaultCurrency: settings.general.defaultCurrency,
      maintenanceMode: settings.general.maintenanceMode,
      registrationEnabled: settings.general.registrationEnabled,
      emailVerificationRequired: settings.general.emailVerificationRequired,
      
      // Email
      emailProvider: settings.email.provider,
      smtpHost: settings.email.smtpHost,
      smtpPort: settings.email.smtpPort,
      smtpSecure: settings.email.smtpSecure,
      smtpUser: settings.email.smtpUser,
      fromEmail: settings.email.fromEmail,
      fromName: settings.email.fromName,
      
      // Payment
      stripeEnabled: settings.payment.providers.stripe.enabled,
      stripePublicKey: settings.payment.providers.stripe.publicKey,
      paypalEnabled: settings.payment.providers.paypal.enabled,
      paypalClientId: settings.payment.providers.paypal.clientId,
      mobileMoneyEnabled: settings.payment.providers.mobileMoney.enabled,
      
      // Security
      passwordMinLength: settings.security.passwordMinLength,
      passwordRequireUppercase: settings.security.passwordRequireUppercase,
      passwordRequireLowercase: settings.security.passwordRequireLowercase,
      passwordRequireNumbers: settings.security.passwordRequireNumbers,
      passwordRequireSymbols: settings.security.passwordRequireSymbols,
      sessionTimeout: settings.security.sessionTimeout,
      maxLoginAttempts: settings.security.maxLoginAttempts,
      lockoutDuration: settings.security.lockoutDuration,
      twoFactorRequired: settings.security.twoFactorRequired,
      
      // Notifications
      emailNotificationsEnabled: settings.notifications.email.enabled,
      smsNotificationsEnabled: settings.notifications.sms.enabled,
      pushNotificationsEnabled: settings.notifications.push.enabled,
      
      // Maintenance
      backupsEnabled: settings.maintenance.backups.enabled,
      backupFrequency: settings.maintenance.backups.frequency,
      backupRetention: settings.maintenance.backups.retention
    });
    
    this.settingsForm.markAsPristine();
    this.hasUnsavedChanges = false;
  }

  onTabChange(tab: string): void {
    if (this.hasUnsavedChanges) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous continuer ?')) {
        this.selectedTab = tab;
        this.hasUnsavedChanges = false;
        this.settingsForm.markAsPristine();
      }
    } else {
      this.selectedTab = tab;
    }
  }

  onSaveSettings(): void {
    if (this.settingsForm.valid) {
      const formValue = this.settingsForm.value;
      const settingsData = this.buildSettingsData(formValue);
      
      this.store.dispatch(new AdminSettingsAction.UpdateSettings(settingsData));
      this.hasUnsavedChanges = false;
      this.settingsForm.markAsPristine();
    }
  }

  onResetForm(): void {
    if (confirm('Êtes-vous sûr de vouloir annuler toutes les modifications ?')) {
      this.settingsForm.reset();
      this.loadData();
      this.hasUnsavedChanges = false;
    }
  }

  onTestEmailConfiguration(): void {
    const testEmail = prompt('Adresse email de test:');
    if (testEmail) {
      // Dispatch test email action
      console.log('Test email configuration:', testEmail);
    }
  }

  onCreateBackup(): void {
    if (confirm('Créer une nouvelle sauvegarde ?')) {
      this.store.dispatch(new AdminSettingsAction.BackupDatabase());
    }
  }

  onClearCache(): void {
    if (confirm('Vider le cache système ?')) {
      this.store.dispatch(new AdminSettingsAction.ClearCache());
    }
  }

  onToggleMaintenanceMode(): void {
    const currentMode = this.settingsForm.get('maintenanceMode')?.value;
    const message = currentMode ? 
      'Désactiver le mode maintenance ?' : 
      'Activer le mode maintenance ? Les utilisateurs ne pourront plus accéder à l\'application.';
    
    if (confirm(message)) {
      this.settingsForm.patchValue({ maintenanceMode: !currentMode });
      this.onSaveSettings();
    }
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminSettingsAction.RefreshData());
  }

  private buildSettingsData(formValue: any): Partial<AdminSettings> {
    return {
      general: {
        appName: formValue.appName,
        appDescription: formValue.appDescription,
        supportEmail: formValue.supportEmail,
        supportPhone: formValue.supportPhone,
        defaultLanguage: formValue.defaultLanguage,
        defaultTimezone: formValue.defaultTimezone,
        defaultCurrency: formValue.defaultCurrency,
        maintenanceMode: formValue.maintenanceMode,
        registrationEnabled: formValue.registrationEnabled,
        emailVerificationRequired: formValue.emailVerificationRequired
      },
      email: {
        provider: formValue.emailProvider,
        smtpHost: formValue.smtpHost,
        smtpPort: formValue.smtpPort,
        smtpSecure: formValue.smtpSecure,
        smtpUser: formValue.smtpUser,
        fromEmail: formValue.fromEmail,
        fromName: formValue.fromName
      },
      security: {
        passwordMinLength: formValue.passwordMinLength,
        passwordRequireUppercase: formValue.passwordRequireUppercase,
        passwordRequireLowercase: formValue.passwordRequireLowercase,
        passwordRequireNumbers: formValue.passwordRequireNumbers,
        passwordRequireSymbols: formValue.passwordRequireSymbols,
        sessionTimeout: formValue.sessionTimeout,
        maxLoginAttempts: formValue.maxLoginAttempts,
        lockoutDuration: formValue.lockoutDuration,
        twoFactorRequired: formValue.twoFactorRequired
      }
    } as Partial<AdminSettings>;
  }

  // Toggle method for settings
  toggleSetting(settingName: string): void {
    const currentValue = this.settingsForm.get(settingName)?.value;
    this.settingsForm.patchValue({
      [settingName]: !currentValue
    });
    this.hasUnsavedChanges = true;
  }

  // Get section icon SVG
  getSectionIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      'settings': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
      'mail': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>',
      'credit-card': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>',
      'shield-check': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>',
      'database': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>',
      'bell': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>'
    };
    return icons[iconName] || icons['settings'];
  }
}
