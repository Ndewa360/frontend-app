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
  testEmailConfiguration(testEmail: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<ApiResultFormat<{ success: boolean; message: string }>>(`${this.apiUrl}/email/test`, { testEmail }).pipe(
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
   * Activer/Désactiver le mode maintenance
   */
  toggleMaintenanceMode(enabled: boolean, message?: string): Observable<any> {
    return this.http.patch<ApiResultFormat<any>>(`${this.apiUrl}/maintenance/toggle`, { enabled, message }).pipe(
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

  /**
   * Créer une sauvegarde de la base de données
   */
  createBackup(): Observable<BackupInfo> {
    return this.http.post<ApiResultFormat<BackupInfo>>(`${this.apiUrl}/backup`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des sauvegardes
   */
  getBackups(): Observable<BackupInfo[]> {
    return this.http.get<ApiResultFormat<BackupInfo[]>>(`${this.apiUrl}/backups`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer une sauvegarde
   */
  deleteBackup(backupId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/backups/${backupId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Restaurer une sauvegarde
   */
  restoreBackup(backupId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<ApiResultFormat<{ success: boolean; message: string }>>(`${this.apiUrl}/backups/${backupId}/restore`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Vider le cache
   */
  clearCache(cacheType?: string): Observable<{ cleared: string[] }> {
    const params = cacheType ? new HttpParams().set('type', cacheType) : new HttpParams();
    return this.http.delete<ApiResultFormat<{ cleared: string[] }>>(`${this.apiUrl}/cache`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Optimiser la base de données
   */
  optimizeDatabase(): Observable<{ optimized: string[]; size_before: number; size_after: number }> {
    return this.http.post<ApiResultFormat<{ optimized: string[]; size_before: number; size_after: number }>>(`${this.apiUrl}/optimize-db`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Redémarrer l'application
   */
  restartApplication(): Observable<{ success: boolean; message: string }> {
    return this.http.post<ApiResultFormat<{ success: boolean; message: string }>>(`${this.apiUrl}/restart`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les logs système
   */
  getSystemLogs(level: string = 'all', limit: number = 100): Observable<any[]> {
    const params = new HttpParams()
      .set('level', level)
      .set('limit', limit.toString());
    
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/logs`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Télécharger les logs système
   */
  downloadLogs(level: string = 'all', dateFrom?: Date, dateTo?: Date): Observable<{ downloadUrl: string }> {
    let params = new HttpParams().set('level', level);
    
    if (dateFrom) {
      params = params.set('dateFrom', dateFrom.toISOString());
    }
    if (dateTo) {
      params = params.set('dateTo', dateTo.toISOString());
    }
    
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/logs/download`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Importer des paramètres
   */
  importSettings(file: File): Observable<{ imported: string[]; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResultFormat<{ imported: string[]; errors: any[] }>>(`${this.apiUrl}/import`, formData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les paramètres
   */
  exportSettings(sections?: string[]): Observable<{ downloadUrl: string }> {
    let params = new HttpParams();
    if (sections && sections.length > 0) {
      params = params.set('sections', sections.join(','));
    }
    
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }
}
