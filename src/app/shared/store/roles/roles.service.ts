import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Role, 
  Permission, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  AssignRoleRequest,
  RoleFilters,
  PermissionFilters,
  RolesResponse,
  PermissionsResponse,
  UserRolesResponse,
  RoleStats,
  PermissionCheck,
  PermissionResult,
  RoleAuditLog,
  RoleTemplate,
  UserRoleAssignment
} from './roles.model';
import { ApiResultFormat } from '../global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly apiUrl = `${environment.apiUrl}/admin/roles`;
  private readonly permissionsUrl = `${environment.apiUrl}/admin/permissions`;

  constructor(private http: HttpClient) {}

  // ==================== GESTION DES RÔLES ====================

  /**
   * Récupérer tous les rôles avec filtres
   */
  getRoles(filters?: RoleFilters, page = 1, limit = 20): Observable<ApiResultFormat<RolesResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
      if (filters.isSystemRole !== undefined) params = params.set('isSystemRole', filters.isSystemRole.toString());
      if (filters.module) params = params.set('module', filters.module);
      if (filters.hasPermission) params = params.set('hasPermission', filters.hasPermission);
    }

    return this.http.get<ApiResultFormat<RolesResponse>>(`${this.apiUrl}`, { params });
  }

  /**
   * Récupérer un rôle par ID
   */
  getRoleById(roleId: string): Observable<ApiResultFormat<Role>> {
    return this.http.get<ApiResultFormat<Role>>(`${this.apiUrl}/${roleId}`);
  }

  /**
   * Créer un nouveau rôle
   */
  createRole(roleData: CreateRoleRequest): Observable<ApiResultFormat<Role>> {
    return this.http.post<ApiResultFormat<Role>>(`${this.apiUrl}`, roleData);
  }

  /**
   * Mettre à jour un rôle
   */
  updateRole(roleData: UpdateRoleRequest): Observable<ApiResultFormat<Role>> {
    return this.http.put<ApiResultFormat<Role>>(`${this.apiUrl}/${roleData.id}`, roleData);
  }

  /**
   * Supprimer un rôle
   */
  deleteRole(roleId: string): Observable<ApiResultFormat<void>> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/${roleId}`);
  }

  /**
   * Dupliquer un rôle
   */
  duplicateRole(roleId: string, newName: string): Observable<ApiResultFormat<Role>> {
    return this.http.post<ApiResultFormat<Role>>(`${this.apiUrl}/${roleId}/duplicate`, { name: newName });
  }

  // ==================== GESTION DES PERMISSIONS ====================

  /**
   * Récupérer toutes les permissions avec filtres
   */
  getPermissions(filters?: PermissionFilters, page = 1, limit = 50): Observable<ApiResultFormat<PermissionsResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.module) params = params.set('module', filters.module);
      if (filters.action) params = params.set('action', filters.action);
      if (filters.resource) params = params.set('resource', filters.resource);
    }

    return this.http.get<ApiResultFormat<PermissionsResponse>>(`${this.permissionsUrl}`, { params });
  }

  /**
   * Récupérer les permissions par module
   */
  getPermissionsByModule(module: string): Observable<ApiResultFormat<Permission[]>> {
    return this.http.get<ApiResultFormat<Permission[]>>(`${this.permissionsUrl}/module/${module}`);
  }

  /**
   * Créer une nouvelle permission
   */
  createPermission(permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Observable<ApiResultFormat<Permission>> {
    return this.http.post<ApiResultFormat<Permission>>(`${this.permissionsUrl}`, permissionData);
  }

  /**
   * Mettre à jour une permission
   */
  updatePermission(permissionId: string, permissionData: Partial<Permission>): Observable<ApiResultFormat<Permission>> {
    return this.http.put<ApiResultFormat<Permission>>(`${this.permissionsUrl}/${permissionId}`, permissionData);
  }

  /**
   * Supprimer une permission
   */
  deletePermission(permissionId: string): Observable<ApiResultFormat<void>> {
    return this.http.delete<ApiResultFormat<void>>(`${this.permissionsUrl}/${permissionId}`);
  }

  // ==================== ASSIGNATION DE RÔLES ====================

  /**
   * Assigner des rôles à un utilisateur
   */
  assignRolesToUser(assignmentData: AssignRoleRequest): Observable<ApiResultFormat<UserRoleAssignment[]>> {
    return this.http.post<ApiResultFormat<UserRoleAssignment[]>>(`${this.apiUrl}/assign`, assignmentData);
  }

  /**
   * Retirer un rôle d'un utilisateur
   */
  unassignRoleFromUser(userId: string, roleId: string): Observable<ApiResultFormat<void>> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/assign/${userId}/${roleId}`);
  }

  /**
   * Récupérer les rôles d'un utilisateur
   */
  getUserRoles(userId: string): Observable<ApiResultFormat<UserRolesResponse>> {
    return this.http.get<ApiResultFormat<UserRolesResponse>>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Récupérer les utilisateurs ayant un rôle spécifique
   */
  getUsersWithRole(roleId: string): Observable<ApiResultFormat<any[]>> {
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/${roleId}/users`);
  }

  // ==================== VALIDATION DES PERMISSIONS ====================

  /**
   * Vérifier une permission pour un utilisateur
   */
  checkPermission(userId: string, permissionCheck: PermissionCheck): Observable<ApiResultFormat<PermissionResult>> {
    return this.http.post<ApiResultFormat<PermissionResult>>(`${this.apiUrl}/check-permission/${userId}`, permissionCheck);
  }

  /**
   * Vérifier plusieurs permissions pour un utilisateur
   */
  checkMultiplePermissions(userId: string, permissionChecks: PermissionCheck[]): Observable<ApiResultFormat<PermissionResult[]>> {
    return this.http.post<ApiResultFormat<PermissionResult[]>>(`${this.apiUrl}/check-permissions/${userId}`, { permissions: permissionChecks });
  }

  // ==================== STATISTIQUES ====================

  /**
   * Récupérer les statistiques des rôles
   */
  getRoleStats(): Observable<ApiResultFormat<RoleStats>> {
    return this.http.get<ApiResultFormat<RoleStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Récupérer les statistiques d'utilisation des permissions
   */
  getPermissionUsageStats(): Observable<ApiResultFormat<any>> {
    return this.http.get<ApiResultFormat<any>>(`${this.permissionsUrl}/usage-stats`);
  }

  // ==================== AUDIT ====================

  /**
   * Récupérer l'historique d'audit des rôles
   */
  getRoleAuditLog(roleId?: string, userId?: string, limit = 50): Observable<ApiResultFormat<RoleAuditLog[]>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (roleId) params = params.set('roleId', roleId);
    if (userId) params = params.set('userId', userId);

    return this.http.get<ApiResultFormat<RoleAuditLog[]>>(`${this.apiUrl}/audit`, { params });
  }

  // ==================== TEMPLATES ====================

  /**
   * Récupérer les templates de rôles
   */
  getRoleTemplates(): Observable<ApiResultFormat<RoleTemplate[]>> {
    return this.http.get<ApiResultFormat<RoleTemplate[]>>(`${this.apiUrl}/templates`);
  }

  /**
   * Créer un rôle à partir d'un template
   */
  createRoleFromTemplate(templateId: string, roleName: string, description?: string): Observable<ApiResultFormat<Role>> {
    return this.http.post<ApiResultFormat<Role>>(`${this.apiUrl}/templates/${templateId}/create`, {
      name: roleName,
      description
    });
  }

  // ==================== OPÉRATIONS EN LOT ====================

  /**
   * Mise à jour en lot des rôles
   */
  bulkUpdateRoles(roleIds: string[], updates: Partial<Role>): Observable<ApiResultFormat<Role[]>> {
    return this.http.put<ApiResultFormat<Role[]>>(`${this.apiUrl}/bulk-update`, { roleIds, updates });
  }

  /**
   * Suppression en lot des rôles
   */
  bulkDeleteRoles(roleIds: string[]): Observable<ApiResultFormat<void>> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/bulk-delete`, { body: { roleIds } });
  }

  /**
   * Assignation en lot de rôles
   */
  bulkAssignRoles(userIds: string[], roleIds: string[]): Observable<ApiResultFormat<UserRoleAssignment[]>> {
    return this.http.post<ApiResultFormat<UserRoleAssignment[]>>(`${this.apiUrl}/bulk-assign`, { userIds, roleIds });
  }

  // ==================== IMPORT/EXPORT ====================

  /**
   * Exporter les rôles
   */
  exportRoles(format: 'json' | 'csv' | 'excel' = 'json'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  /**
   * Importer les rôles
   */
  importRoles(file: File, options?: { overwrite?: boolean; validateOnly?: boolean }): Observable<ApiResultFormat<any>> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.overwrite) formData.append('overwrite', 'true');
    if (options?.validateOnly) formData.append('validateOnly', 'true');

    return this.http.post<ApiResultFormat<any>>(`${this.apiUrl}/import`, formData);
  }

  // ==================== VALIDATION ====================

  /**
   * Valider un nom de rôle
   */
  validateRoleName(name: string, excludeId?: string): Observable<ApiResultFormat<{ isValid: boolean; message?: string }>> {
    let params = new HttpParams().set('name', name);
    if (excludeId) params = params.set('excludeId', excludeId);

    return this.http.get<ApiResultFormat<{ isValid: boolean; message?: string }>>(`${this.apiUrl}/validate-name`, { params });
  }

  /**
   * Valider un nom de permission
   */
  validatePermissionName(name: string, excludeId?: string): Observable<ApiResultFormat<{ isValid: boolean; message?: string }>> {
    let params = new HttpParams().set('name', name);
    if (excludeId) params = params.set('excludeId', excludeId);

    return this.http.get<ApiResultFormat<{ isValid: boolean; message?: string }>>(`${this.permissionsUrl}/validate-name`, { params });
  }

  // ==================== SYNCHRONISATION ====================

  /**
   * Synchroniser les rôles avec le système
   */
  syncRolesWithSystem(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(`${this.apiUrl}/sync`, {});
  }

  /**
   * Rafraîchir les permissions d'un utilisateur
   */
  refreshUserPermissions(userId: string): Observable<ApiResultFormat<void>> {
    return this.http.post<ApiResultFormat<void>>(`${this.apiUrl}/refresh-permissions/${userId}`, {});
  }
}
