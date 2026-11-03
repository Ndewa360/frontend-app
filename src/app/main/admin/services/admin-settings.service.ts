import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminSettings, 
  SystemInfo, 
  BackupInfo 
} from '../store/settings/admin-settings.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

/** Réponse de GET /admin/settings/effective (backend AdminSettingsService.getEffectiveConfiguration). */
export interface EffectiveConfiguration {
  general: {
    appName: string; appVersion: string | null; environment: string; timezone: string;
    frontendUrl: string | null; apiDocsEnabled: boolean; cronsEnabled: boolean;
  };
  email: {
    provider: string; configured: boolean; domain: string | null; senderName: string | null;
    noReplySender: string | null; contactSender: string | null; dpoEmail: string | null;
  };
  payment: {
    mobileMoneyAggregator: string | null;
    providers: Array<{ name: string; configured: boolean; webhookSecured: boolean | null }>;
  };
  security: {
    accessTokenTtl: string | null; refreshTokenTtlWeb: string | null; refreshTokenTtlMobile: string | null;
    rateLimitMax: number | null; rateLimitWindowMs: number | null; allowedOrigins: string[];
    encryptionConfigured: boolean; googleSignInConfigured: boolean;
  };
  notifications: {
    pushConfigured: boolean; whatsappConfigured: boolean; whatsappWebhookSecured: boolean; whatsappApiVersion: string;
  };
  integrations: {
    storageConfigured: boolean; storageBucket: string | null; redisConfigured: boolean;
    geonamesConfigured: boolean; tracingConfigured: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/admin/settings`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les paramètres
   */
  getSettings(): Observable<AdminSettings> {
    return this.http.get<ApiResultFormat<AdminSettings>>(`${this.apiUrl}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres
   */
  updateSettings(settingsData: Partial<AdminSettings>): Observable<AdminSettings> {
    // Mettre à jour chaque section présente
    const sections = Object.keys(settingsData) as (keyof AdminSettings)[];
    if (sections.length === 1) {
      const section = sections[0];
      return this.http.put<ApiResultFormat<AdminSettings>>(`${this.apiUrl}/${section}`, settingsData[section]).pipe(
        map(response => response.data)
      );
    }
    // Plusieurs sections : appel global PUT /admin/settings
    return this.http.put<ApiResultFormat<AdminSettings>>(`${this.apiUrl}`, settingsData).pipe(
      map(response => response.data)
    );
  }

  /** Configuration réellement utilisée par le serveur (lecture seule, sans secret). */
  getEffectiveConfiguration(): Observable<EffectiveConfiguration> {
    return this.http.get<ApiResultFormat<EffectiveConfiguration>>(`${this.apiUrl}/effective`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les informations système
   */
  getSystemInfo(): Observable<SystemInfo> {
    return this.http.get<ApiResultFormat<SystemInfo>>(`${this.apiUrl}/system-info`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres généraux
   */
  getGeneralSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/general`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres généraux
   */
  updateGeneralSettings(generalData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/general`, generalData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres email
   */
  getEmailSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/email`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres email
   */
  updateEmailSettings(emailData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/email`, emailData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Tester la configuration email
   */
  /** Le serveur envoie l'email de test à l'adresse de l'administrateur connecté. */
  testEmailConfiguration(): Observable<{ success: boolean; message: string }> {
    return this.http.post<ApiResultFormat<{ success: boolean; message: string }>>(`${this.apiUrl}/email/test`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres de paiement
   */
  getPaymentSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/payment`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres de paiement
   */
  updatePaymentSettings(paymentData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/payment`, paymentData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres de sécurité
   */
  getSecuritySettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/security`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres de sécurité
   */
  updateSecuritySettings(securityData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/security`, securityData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres de notifications
   */
  getNotificationSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/notifications`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres de notifications
   */
  updateNotificationSettings(notificationData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/notifications`, notificationData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres de maintenance
   */
  getMaintenanceSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/maintenance`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres de maintenance
   */
  updateMaintenanceSettings(maintenanceData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/maintenance`, maintenanceData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les paramètres d'intégrations
   */
  getIntegrationSettings(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/integrations`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les paramètres d'intégrations
   */
  updateIntegrationSettings(integrationData: any): Observable<any> {
    return this.http.put<ApiResultFormat<any>>(`${this.apiUrl}/integrations`, integrationData).pipe(
      map(response => response.data)
    );
  }

}
