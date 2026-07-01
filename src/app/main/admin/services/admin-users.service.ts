import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminUser, 
  AdminUserStats, 
  AdminUserFilters, 
  CreateAdminUserDto, 
  UpdateAdminUserDto, 
  BulkActionDto 
} from '../store/users/admin-users.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  private readonly apiUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUsersStats(): Observable<AdminUserStats> {
    return this.http.get<ApiResultFormat<AdminUserStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des utilisateurs avec filtres
   */
  getUsers(filters: AdminUserFilters = {}): Observable<{ data: AdminUser[], meta: any }> {
    let params = new HttpParams();
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        data: response.data,
        meta: response.meta || {}
      }))
    );
  }

  /**
   * Obtenir un utilisateur par ID
   */
  getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<ApiResultFormat<AdminUser>>(`${this.apiUrl}/${userId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les détails complets d'un utilisateur avec informations financières
   */
  getUserDetails(userId: string): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/${userId}/details`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les transactions PENDING/FAILED (loyer + souscription) pour un propriétaire
   */
  getPendingRentTransactions(ownerId: string): Observable<any[]> {
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/${ownerId}/rent-transactions`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Re-vérifier le statut d'une transaction auprès du provider
   */
  recheckRentTransaction(externalRef: string): Observable<{ externalRef: string; status: string; message: string }> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/admin/rent-transactions/${externalRef}/recheck`, {}
    ).pipe(map(response => response.data));
  }

  /**
   * Confirmer manuellement un paiement de loyer en attente
   */
  confirmRentTransaction(externalRef: string, adminNote?: string): Observable<{ externalRef: string; status: string; message: string }> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/admin/rent-transactions/${externalRef}/confirm`, { adminNote }
    ).pipe(map(response => response.data));
  }

  /**
   * Supprimer une transaction échouée / annulée / expirée
   */
  deleteRentTransaction(externalRef: string): Observable<{ message: string }> {
    return this.http.delete<ApiResultFormat<any>>(
      `${environment.apiUrl}/admin/rent-transactions/${externalRef}`
    ).pipe(map(response => response.data));
  }

  /**
   * Créer un nouvel utilisateur
   */
  createUser(userData: CreateAdminUserDto): Observable<AdminUser> {
    return this.http.post<ApiResultFormat<AdminUser>>(`${this.apiUrl}`, userData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(userId: string, userData: UpdateAdminUserDto): Observable<AdminUser> {
    return this.http.put<ApiResultFormat<AdminUser>>(`${this.apiUrl}/${userId}`, userData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/${userId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actions en masse sur les utilisateurs
   */
  bulkAction(bulkData: BulkActionDto): Observable<any> {
    return this.http.post<ApiResultFormat<any>>(`${this.apiUrl}/bulk-action`, bulkData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Assigner des rôles à un utilisateur
   */
  assignRoles(userId: string, roleIds: string[]): Observable<AdminUser> {
    return this.http.post<ApiResultFormat<AdminUser>>(`${this.apiUrl}/${userId}/assign-roles`, { roleIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Retirer des rôles d'un utilisateur
   */
  removeRoles(userId: string, roleIds: string[]): Observable<AdminUser> {
    return this.http.post<ApiResultFormat<AdminUser>>(`${this.apiUrl}/${userId}/remove-roles`, { roleIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Activer/Désactiver un utilisateur
   */
  toggleUserStatus(userId: string, status: string): Observable<AdminUser> {
    return this.http.patch<ApiResultFormat<AdminUser>>(`${this.apiUrl}/${userId}/status`, { status }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  resetPassword(userId: string, sendEmail: boolean = true): Observable<{ temporaryPassword?: string }> {
    return this.http.post<ApiResultFormat<{ temporaryPassword?: string }>>(`${this.apiUrl}/${userId}/reset-password`, { sendEmail }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Envoyer un email de vérification
   */
  sendVerificationEmail(userId: string): Observable<void> {
    return this.http.post<ApiResultFormat<void>>(`${this.apiUrl}/${userId}/send-verification`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir l'historique des activités d'un utilisateur
   */
  getUserActivities(userId: string, limit: number = 50): Observable<any[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/${userId}/activities`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les utilisateurs
   */
  exportUsers(filters: AdminUserFilters = {}, format: string = 'xlsx'): Observable<{ downloadUrl: string }> {
    let params = new HttpParams().set('format', format);
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Importer des utilisateurs
   */
  importUsers(file: File): Observable<{ imported: number, errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResultFormat<{ imported: number, errors: any[] }>>(`${this.apiUrl}/import`, formData).pipe(
      map(response => response.data)
    );
  }
}
