import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminRole, 
  AdminPermission, 
  RoleStats, 
  PermissionsMatrix,
  RoleFilters,
  CreateRoleDto, 
  UpdateRoleDto 
} from '../store/roles/admin-roles.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class AdminRolesService {
  private readonly apiUrl = `${environment.apiUrl}/admin/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques des rôles
   */
  getRolesStats(): Observable<RoleStats> {
    return this.http.get<ApiResultFormat<RoleStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des rôles avec filtres
   */
  getRoles(filters: RoleFilters = {}): Observable<AdminRole[]> {
    let params = new HttpParams();
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResultFormat<AdminRole[]>>(`${this.apiUrl}`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir un rôle par ID
   */
  getRoleById(roleId: string): Observable<AdminRole> {
    return this.http.get<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir toutes les permissions
   */
  getPermissions(): Observable<AdminPermission[]> {
    return this.http.get<ApiResultFormat<AdminPermission[]>>(`${this.apiUrl}/permissions`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la matrice des permissions
   */
  getPermissionsMatrix(): Observable<PermissionsMatrix> {
    return this.http.get<ApiResultFormat<PermissionsMatrix>>(`${this.apiUrl}/permissions-matrix`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer un nouveau rôle
   */
  createRole(roleData: CreateRoleDto): Observable<AdminRole> {
    return this.http.post<ApiResultFormat<AdminRole>>(`${this.apiUrl}`, roleData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour un rôle
   */
  updateRole(roleId: string, roleData: UpdateRoleDto): Observable<AdminRole> {
    return this.http.put<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}`, roleData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer un rôle
   */
  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/${roleId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Assigner des permissions à un rôle
   */
  assignPermissions(roleId: string, permissionIds: string[]): Observable<AdminRole> {
    return this.http.post<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}/assign-permissions`, { permissionIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Retirer des permissions d'un rôle
   */
  removePermissions(roleId: string, permissionIds: string[]): Observable<AdminRole> {
    return this.http.post<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}/remove-permissions`, { permissionIds }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les utilisateurs avec un rôle spécifique
   */
  getUsersWithRole(roleId: string): Observable<any[]> {
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/${roleId}/users`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Dupliquer un rôle
   */
  duplicateRole(roleId: string, newName: string): Observable<AdminRole> {
    return this.http.post<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}/duplicate`, { name: newName }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Activer/Désactiver un rôle
   */
  toggleRoleStatus(roleId: string, isActive: boolean): Observable<AdminRole> {
    return this.http.patch<ApiResultFormat<AdminRole>>(`${this.apiUrl}/${roleId}/status`, { isActive }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les permissions par module
   */
  getPermissionsByModule(): Observable<{ [module: string]: AdminPermission[] }> {
    return this.http.get<ApiResultFormat<{ [module: string]: AdminPermission[] }>>(`${this.apiUrl}/permissions/by-module`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer une permission personnalisée
   */
  createPermission(permissionData: any): Observable<AdminPermission> {
    return this.http.post<ApiResultFormat<AdminPermission>>(`${this.apiUrl}/permissions`, permissionData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour une permission
   */
  updatePermission(permissionId: string, permissionData: any): Observable<AdminPermission> {
    return this.http.put<ApiResultFormat<AdminPermission>>(`${this.apiUrl}/permissions/${permissionId}`, permissionData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer une permission
   */
  deletePermission(permissionId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/permissions/${permissionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les rôles et permissions
   */
  exportRoles(format: string = 'xlsx'): Observable<{ downloadUrl: string }> {
    const params = new HttpParams().set('format', format);
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Importer des rôles
   */
  importRoles(file: File): Observable<{ imported: number, errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResultFormat<{ imported: number, errors: any[] }>>(`${this.apiUrl}/import`, formData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Synchroniser les permissions système
   */
  syncSystemPermissions(): Observable<{ created: number, updated: number }> {
    return this.http.post<ApiResultFormat<{ created: number, updated: number }>>(`${this.apiUrl}/permissions/sync`, {}).pipe(
      map(response => response.data)
    );
  }
}
