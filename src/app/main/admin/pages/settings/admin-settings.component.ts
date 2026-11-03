import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminSettingsAction } from '../../store/settings/admin-settings.actions';
import { AdminSettingsState } from '../../store/settings/admin-settings.state';
import { AdminSettingsService, EffectiveConfiguration } from '../../services/admin-settings.service';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';
import { LanguageUrlService } from '../../../../shared/services/language-url.service';
import { trackByFn } from '../../../../shared/utils/track-by.util';
import { isSuperAdmin } from '../../utils/admin-roles';

type SectionKey = 'general' | 'email' | 'payment' | 'security' | 'notifications' | 'integrations';

/** Ligne affichée : libellé traduit et valeur (texte, booléen « configuré » ou liste). */
interface ConfigRow {
  labelKey: string;
  value: string | number | boolean | string[] | null;
  kind?: 'status' | 'list' | 'text';
}

/**
 * Configuration effective du serveur, en lecture seule.
 *
 * Les anciens réglages (général, e-mail, paiement, sécurité, maintenance)
 * étaient enregistrés en base sans être lus par l'application : les modifier
 * n'avait aucun effet. Cette page affiche ce que le serveur utilise
 * réellement (variables d'environnement), sans aucun secret.
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault, AsyncPipe, DecimalPipe, RouterLink, TranslateModule],
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;
  private destroy$ = new Subject<void>();

  systemInfo$ = this.store.select(AdminSettingsState.selectSystemInfo);

  readonly sections: Array<{ key: SectionKey; icon: string }> = [
    { key: 'general', icon: 'fa-sliders-h' },
    { key: 'email', icon: 'fa-envelope' },
    { key: 'payment', icon: 'fa-credit-card' },
    { key: 'security', icon: 'fa-shield-alt' },
    { key: 'notifications', icon: 'fa-bell' },
    { key: 'integrations', icon: 'fa-plug' },
  ];

  selectedSection: SectionKey = 'general';
  config: EffectiveConfiguration | null = null;
  loading = false;
  loadError = false;
  superAdmin = false;

  testingEmail = false;
  testEmailResult: { success: boolean; message: string } | null = null;

  constructor(
    private store: Store,
    private settingsService: AdminSettingsService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private languageUrl: LanguageUrlService,
  ) {}

  ngOnInit(): void {
    this.superAdmin = isSuperAdmin(this.store.selectSnapshot(UserProfileState.selectStateUserProfile));
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get financeRoute(): string {
    return `/${this.languageUrl.getCurrentLanguage()}/admin/platform-finance`;
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.settingsService.getEffectiveConfiguration().pipe(takeUntil(this.destroy$)).subscribe({
      next: (config) => { this.config = config; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; },
    });
    // Informations système : réservées au super-admin côté serveur.
    if (this.superAdmin) this.store.dispatch(new AdminSettingsAction.LoadSystemInfo());
  }

  select(section: SectionKey): void {
    this.selectedSection = section;
  }

  rows(section: SectionKey): ConfigRow[] {
    const c = this.config;
    if (!c) return [];
    switch (section) {
      case 'general':
        return [
          { labelKey: 'APP_NAME', value: c.general.appName },
          { labelKey: 'APP_VERSION', value: c.general.appVersion },
          { labelKey: 'ENVIRONMENT', value: c.general.environment },
          { labelKey: 'TIMEZONE', value: c.general.timezone },
          { labelKey: 'FRONTEND_URL', value: c.general.frontendUrl },
          { labelKey: 'CRONS', value: c.general.cronsEnabled, kind: 'status' },
          { labelKey: 'API_DOCS', value: c.general.apiDocsEnabled, kind: 'status' },
        ];
      case 'email':
        return [
          { labelKey: 'EMAIL_PROVIDER', value: c.email.provider },
          { labelKey: 'EMAIL_CONFIGURED', value: c.email.configured, kind: 'status' },
          { labelKey: 'EMAIL_DOMAIN', value: c.email.domain },
          { labelKey: 'EMAIL_SENDER_NAME', value: c.email.senderName },
          { labelKey: 'EMAIL_NO_REPLY', value: c.email.noReplySender },
          { labelKey: 'EMAIL_CONTACT', value: c.email.contactSender },
          { labelKey: 'EMAIL_DPO', value: c.email.dpoEmail },
        ];
      case 'payment':
        return [{ labelKey: 'MOBILE_MONEY_AGGREGATOR', value: c.payment.mobileMoneyAggregator }];
      case 'security':
        return [
          { labelKey: 'ACCESS_TOKEN_TTL', value: c.security.accessTokenTtl },
          { labelKey: 'REFRESH_TTL_WEB', value: c.security.refreshTokenTtlWeb },
          { labelKey: 'REFRESH_TTL_MOBILE', value: c.security.refreshTokenTtlMobile },
          { labelKey: 'WEB_INACTIVITY', value: this.translate.instant('ADMIN.SETTINGS.VALUES.TWO_HOURS') },
          { labelKey: 'RATE_LIMIT', value: this.rateLimit(c) },
          { labelKey: 'ENCRYPTION', value: c.security.encryptionConfigured, kind: 'status' },
          { labelKey: 'GOOGLE_SIGN_IN', value: c.security.googleSignInConfigured, kind: 'status' },
          { labelKey: 'ALLOWED_ORIGINS', value: c.security.allowedOrigins, kind: 'list' },
        ];
      case 'notifications':
        return [
          { labelKey: 'PUSH', value: c.notifications.pushConfigured, kind: 'status' },
          { labelKey: 'WHATSAPP', value: c.notifications.whatsappConfigured, kind: 'status' },
          { labelKey: 'WHATSAPP_WEBHOOK', value: c.notifications.whatsappWebhookSecured, kind: 'status' },
          { labelKey: 'WHATSAPP_API_VERSION', value: c.notifications.whatsappApiVersion },
        ];
      case 'integrations':
        return [
          { labelKey: 'STORAGE', value: c.integrations.storageConfigured, kind: 'status' },
          { labelKey: 'STORAGE_BUCKET', value: c.integrations.storageBucket },
          { labelKey: 'REDIS', value: c.integrations.redisConfigured, kind: 'status' },
          { labelKey: 'GEONAMES', value: c.integrations.geonamesConfigured, kind: 'status' },
          { labelKey: 'TRACING', value: c.integrations.tracingConfigured, kind: 'status' },
        ];
    }
  }

  private rateLimit(c: EffectiveConfiguration): string | null {
    const { rateLimitMax, rateLimitWindowMs } = c.security;
    if (!rateLimitMax || !rateLimitWindowMs) return null;
    return this.translate.instant('ADMIN.SETTINGS.VALUES.RATE_LIMIT', { max: rateLimitMax, seconds: Math.round(rateLimitWindowMs / 1000) });
  }

  isList(row: ConfigRow): string[] {
    return Array.isArray(row.value) ? row.value : [];
  }

  /** Envoie un vrai e-mail de test à l'adresse de l'administrateur connecté. */
  onTestEmail(): void {
    if (this.testingEmail) return;
    this.testingEmail = true;
    this.testEmailResult = null;
    this.settingsService.testEmailConfiguration().pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.testingEmail = false;
        this.testEmailResult = result;
        if (result.success) this.toastr.success(result.message);
        else this.toastr.error(result.message);
      },
      error: () => {
        this.testingEmail = false;
        this.testEmailResult = { success: false, message: this.translate.instant('ADMIN.SETTINGS.TEST_EMAIL_ERROR') };
        this.toastr.error(this.testEmailResult.message);
      },
    });
  }
}
