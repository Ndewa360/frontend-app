import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { AdminRolesService } from '../../services/admin-roles.service';

// Actions
import { AdminRolesAction } from '../../store/roles/admin-roles.actions';

// States
import { AdminRolesState } from '../../store/roles/admin-roles.state';

// Models
import { AdminRole, AdminPermission, MatrixPermission } from '../../store/roles/admin-roles.model';

@Component({
  selector: 'app-admin-roles',
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.scss']
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  roles$ = this.store.select(AdminRolesState.selectRoles);
  permissions$ = this.store.select(AdminRolesState.selectPermissions);
  stats$ = this.store.select(AdminRolesState.selectStats);
  permissionsMatrix$ = this.store.select(AdminRolesState.selectPermissionsMatrix);
  isLoading$ = this.store.select(AdminRolesState.selectIsLoading);

  // Component state
  selectedTab = 'roles';
  showCreateModal = false;
  showEditModal = false;
  selectedRole: AdminRole | null = null;

  // Matrix state
  isEditMode = false;
  isSaving = false;
  isApplyingChange = false;
  isRefreshing = false;
  selectedModule = '';
  permissionSearchTerm = '';
  filteredPermissions: AdminPermission[] = [];
  pendingChanges: { [roleId: string]: { [permissionId: string]: boolean } } = {};

  // Permissions list state
  selectedPermissionModule = '';
  selectedPermissionType = '';
  permissionSearchQuery = '';
  expandedModules: Set<string> = new Set(['users', 'roles', 'admin']); // Modules expanded by default

  constructor(private store: Store, private fb: FormBuilder, private adminRolesService: AdminRolesService) {}

  ngOnInit(): void {
    this.loadData();
    this.initRoleForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminRolesAction.LoadRoles(),
      new AdminRolesAction.LoadPermissions(),
      new AdminRolesAction.LoadRoleStats(),
      new AdminRolesAction.LoadPermissionsMatrix()
    ]);
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
  }

  // Role form
  roleForm: FormGroup;

  private initRoleForm(): void {
    this.roleForm = this.fb.group({
      name:        ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      displayName: ['', Validators.required],
      description: [''],
      color:       ['#6c757d']
    });
  }

  onCreateRole(): void {
    this.roleForm.reset({ color: '#6c757d' });
    this.showCreateModal = true;
  }

  onEditRole(role: AdminRole): void {
    this.selectedRole = role;
    this.roleForm.patchValue({
      name:        role.name,
      displayName: role.displayName,
      description: role.description || '',
      color:       role.color || '#6c757d'
    });
    this.showEditModal = true;
  }

  onSubmitRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    const data = this.roleForm.value;
    if (this.showEditModal && this.selectedRole) {
      this.store.dispatch(new AdminRolesAction.UpdateRole(this.selectedRole._id, data));
    } else {
      this.store.dispatch(new AdminRolesAction.CreateRole(data));
    }
    this.onCloseModal();
    setTimeout(() => this.loadData(), 500);
  }

  onDeleteRole(role: AdminRole): void {
    if (role.isSystem) {
      alert('Impossible de supprimer un rôle système');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.displayName}" ?`)) {
      this.store.dispatch(new AdminRolesAction.DeleteRole(role._id));
    }
  }

  onToggleRoleStatus(role: AdminRole): void {
    if (role.isSystem) {
      alert('Impossible de modifier un rôle système');
      return;
    }

    this.store.dispatch(new AdminRolesAction.UpdateRole(role._id, { isActive: !role.isActive }));
  }

  onDuplicateRole(role: AdminRole): void {
    if (role.isSystem) {
      alert('Impossible de dupliquer un rôle système');
      return;
    }
    const newName = window.prompt('Nom du nouveau rôle :', `${role.name}_copy`);
    if (!newName) return;
    this.adminRolesService.duplicateRole(role._id, newName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadData(),
        error: () => {}
      });
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminRolesAction.RefreshData());
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedRole = null;
  }

  onRoleCreated(): void {
    this.onCloseModal();
    this.loadData();
  }

  onRoleUpdated(): void {
    this.onCloseModal();
    this.loadData();
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'secondary';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
  }

  trackByRoleId(_index: number, role: AdminRole): string {
    return role._id;
  }

  trackByPermissionId(_index: number, permission: AdminPermission): string {
    return permission._id;
  }

  // Menu state
  openMenuId: string | null = null;

  toggleRoleMenu(roleId: string): void {
    this.openMenuId = this.openMenuId === roleId ? null : roleId;
  }

  // Template helper methods to simplify expressions
  shouldShowRolesEmptyState(isLoading: boolean, roles: any[]): boolean {
    return !isLoading && (!roles || roles.length === 0);
  }

  shouldShowPermissionsEmptyState(permissions: any[]): boolean {
    return !permissions || permissions.length === 0;
  }

  isPermissionGranted(matrix: any, roleId: string, permissionId: string): boolean {
    // Vérifier d'abord les changements en attente
    if (this.pendingChanges[roleId] && this.pendingChanges[roleId][permissionId] !== undefined) {
      return this.pendingChanges[roleId][permissionId];
    }

    // Utiliser la structure matrix si disponible
    if (matrix.matrix && matrix.matrix[roleId]) {
      return matrix.matrix[roleId][permissionId] || false;
    }

    // Fallback vers l'ancienne structure
    const role = matrix.roles?.find((r: any) => r._id === roleId);
    if (!role) return false;

    return role.permissions?.some((p: any) => p._id === permissionId) || false;
  }

  // ==================== MATRIX METHODS ====================

  /**
   * Basculer le mode édition
   */
  onToggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Annuler les changements en attente
      this.pendingChanges = {};
    }
  }

  /**
   * Basculer une permission pour un rôle
   */
  onPermissionToggle(roleId: string, permissionId: string, event: any): void {
    const granted = (event.target as HTMLInputElement).checked;

    // Mode immédiat : appliquer le changement directement
    if (!this.isEditMode) {
      this.applyPermissionChange(roleId, permissionId, granted);
      return;
    }

    // Mode édition : stocker les changements pour application en batch
    if (!this.pendingChanges[roleId]) {
      this.pendingChanges[roleId] = {};
    }
    this.pendingChanges[roleId][permissionId] = granted;
  }

  /**
   * Appliquer un changement de permission immédiatement
   */
  private async applyPermissionChange(roleId: string, permissionId: string, granted: boolean): Promise<void> {
    if (this.isApplyingChange) return; // Éviter les appels multiples

    try {
      this.isApplyingChange = true;

      // Trouver la permission dans la matrice
      const matrix = this.store.selectSnapshot(AdminRolesState.selectPermissionsMatrix);
      if (!matrix) return;

      const permission = matrix.permissions?.find((p: any) => p._id === permissionId);
      if (!permission) {
        console.error('Permission non trouvée:', permissionId);
        return;
      }

      // Appeler l'API pour basculer la permission
      const permissionCode = permission.code || permission.name;
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.ToggleRolePermission(roleId, permissionCode, granted)));

      // Recharger la matrice pour refléter les changements
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));

    } catch (error) {
      console.error('Erreur lors de l\'application du changement de permission:', error);

      // Recharger la matrice pour annuler le changement visuel
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));
    } finally {
      this.isApplyingChange = false;
    }
  }

  /**
   * Basculer toutes les permissions pour un rôle
   */
  async onToggleAllPermissions(roleId: string): Promise<void> {
    const matrix = this.store.selectSnapshot(AdminRolesState.selectPermissionsMatrix);
    if (!matrix) return;

    const hasAll = this.hasAllPermissions(matrix, roleId);
    const targetState = !hasAll; // Si il a toutes les permissions, on les retire, sinon on les ajoute

    // Mode immédiat : appliquer les changements directement
    if (!this.isEditMode) {
      await this.applyAllPermissionsChange(roleId, targetState);
      return;
    }

    // Mode édition : stocker les changements pour application en batch
    if (!this.pendingChanges[roleId]) {
      this.pendingChanges[roleId] = {};
    }

    // Utiliser la liste des permissions directement
    if (matrix.permissions) {
      matrix.permissions.forEach((permission: any) => {
        this.pendingChanges[roleId][permission._id] = targetState;
      });
    }
  }

  /**
   * Appliquer le changement de toutes les permissions pour un rôle
   */
  private async applyAllPermissionsChange(roleId: string, granted: boolean): Promise<void> {
    if (this.isApplyingChange) return; // Éviter les appels multiples

    try {
      this.isApplyingChange = true;

      const matrix = this.store.selectSnapshot(AdminRolesState.selectPermissionsMatrix);
      if (!matrix || !matrix.permissions) return;

      // Appliquer les changements pour toutes les permissions
      const promises = matrix.permissions.map(async (permission: any) => {
        const permissionCode = permission.code || permission.name;
        return firstValueFrom(this.store.dispatch(new AdminRolesAction.ToggleRolePermission(roleId, permissionCode, granted)));
      });

      await Promise.all(promises);

      // Recharger la matrice pour refléter les changements
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));

    } catch (error) {
      console.error('Erreur lors de l\'application des changements de permissions:', error);

      // Recharger la matrice pour annuler les changements visuels
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));
    } finally {
      this.isApplyingChange = false;
    }
  }

  /**
   * Vérifier si un rôle a toutes les permissions
   */
  hasAllPermissions(matrix: any, roleId: string): boolean {
    if (!matrix.permissions) return false;

    return matrix.permissions.every((permission: any) => {
      return this.isPermissionGranted(matrix, roleId, permission._id);
    });
  }

  /**
   * Sauvegarder les changements de permissions
   */
  async onSavePermissions(): Promise<void> {
    if (Object.keys(this.pendingChanges).length === 0) {
      this.isEditMode = false;
      return;
    }

    this.isSaving = true;

    try {
      // Envoyer les changements au backend
      const matrix = this.store.selectSnapshot(AdminRolesState.selectPermissionsMatrix);
      if (!matrix) return;

      for (const roleId of Object.keys(this.pendingChanges)) {
        for (const permissionId of Object.keys(this.pendingChanges[roleId])) {
          const granted = this.pendingChanges[roleId][permissionId];

          // Trouver la permission dans la liste
          const permission = matrix.permissions?.find((p: any) => p._id === permissionId);
          if (!permission) continue;

          // Appeler l'API pour basculer la permission
          const permissionCode = permission.code || permission.name;
          await firstValueFrom(this.store.dispatch(new AdminRolesAction.ToggleRolePermission(roleId, permissionCode, granted)));
        }
      }

      // Recharger la matrice
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));

      // Réinitialiser l'état
      this.pendingChanges = {};
      this.isEditMode = false;

    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions:', error);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Obtenir les modules uniques (pour la matrice)
   */
  getUniqueModules(permissions: MatrixPermission[] | undefined): string[] {
    if (!permissions) return [];
    const modules = permissions.map(p => p.module);
    return [...new Set(modules)].sort();
  }

  /**
   * Filtrer les permissions (pour la matrice)
   */
  getFilteredPermissions(permissions: MatrixPermission[] | undefined): MatrixPermission[] {
    if (!permissions) return [];
    let filtered = permissions;

    // Filtrer par module
    if (this.selectedModule) {
      filtered = filtered.filter(p => p.module === this.selectedModule);
    }

    // Filtrer par recherche
    if (this.permissionSearchTerm) {
      const term = this.permissionSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(term)) ||
        (p.code && p.code.toLowerCase().includes(term)) ||
        p.module.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  /**
   * Grouper les permissions par module (pour la matrice)
   */
  getGroupedPermissions(permissions: MatrixPermission[]): { name: string, permissions: MatrixPermission[] }[] {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as { [module: string]: MatrixPermission[] });

    return Object.keys(grouped).sort().map(module => ({
      name: module,
      permissions: grouped[module].sort((a, b) => {
        const nameA = a.displayName || a.name;
        const nameB = b.displayName || b.name;
        return nameA.localeCompare(nameB);
      })
    }));
  }

  /**
   * Filtrer par module
   */
  onModuleFilter(): void {
    // La méthode getFilteredPermissions gère déjà le filtrage
  }

  /**
   * Rechercher dans les permissions (Matrix)
   */
  onMatrixPermissionSearch(): void {
    // La méthode getFilteredPermissions gère déjà la recherche
  }

  /**
   * Obtenir les initiales d'un nom
   */
  getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Obtenir le nombre de changements en attente
   */
  getPendingChangesCount(): number {
    let count = 0;
    for (const roleId of Object.keys(this.pendingChanges)) {
      count += Object.keys(this.pendingChanges[roleId]).length;
    }
    return count;
  }

  /**
   * Annuler tous les changements en attente
   */
  onCancelChanges(): void {
    this.pendingChanges = {};
    this.isEditMode = false;
  }

  /**
   * Vérifier si une permission est une permission système
   */
  isSystemPermission(permission: AdminPermission | MatrixPermission): boolean {
    return permission.isSystem || (permission as any).isSystemPermission || false;
  }

  // ==================== PERMISSIONS LIST METHODS ====================

  /**
   * Obtenir les modules des permissions
   */
  getPermissionModules(): string[] {
    const permissions = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
    const modules = permissions.map(p => p.module);
    return [...new Set(modules)].sort();
  }

  /**
   * Obtenir les permissions filtrées
   */
  getFilteredPermissionsList(): AdminPermission[] {
    const permissions = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
    let filtered = permissions;

    // Filtrer par module
    if (this.selectedPermissionModule) {
      filtered = filtered.filter(p => p.module === this.selectedPermissionModule);
    }

    // Filtrer par type
    if (this.selectedPermissionType) {
      if (this.selectedPermissionType === 'system') {
        filtered = filtered.filter(p => this.isSystemPermission(p));
      } else if (this.selectedPermissionType === 'custom') {
        filtered = filtered.filter(p => !this.isSystemPermission(p));
      }
    }

    // Filtrer par recherche
    if (this.permissionSearchQuery) {
      const query = this.permissionSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(query)) ||
        (p.code && p.code.toLowerCase().includes(query)) ||
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        p.module.toLowerCase().includes(query) ||
        (p.action && p.action.toLowerCase().includes(query)) ||
        (p.resource && p.resource.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  /**
   * Grouper les permissions par module
   */
  getGroupedPermissionsList(): { name: string, permissions: AdminPermission[] }[] {
    const filtered = this.getFilteredPermissionsList();
    const grouped = filtered.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as { [module: string]: AdminPermission[] });

    return Object.keys(grouped).sort().map(module => ({
      name: module,
      permissions: grouped[module].sort((a, b) => {
        const nameA = a.displayName || a.name;
        const nameB = b.displayName || b.name;
        return nameA.localeCompare(nameB);
      })
    }));
  }

  /**
   * Obtenir le nombre de permissions système
   */
  getSystemPermissionsCount(): number {
    const permissions = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
    return permissions.filter(p => p.isSystem).length;
  }

  /**
   * Obtenir le nombre de permissions personnalisées
   */
  getCustomPermissionsCount(): number {
    const permissions = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
    return permissions.filter(p => !this.isSystemPermission(p)).length;
  }

  /**
   * Obtenir le nombre total de permissions
   */
  getTotalPermissionsCount(): number {
    const permissions = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
    return permissions.length;
  }



  /**
   * Obtenir le nombre de modules
   */
  getModulesCount(): number {
    return this.getPermissionModules().length;
  }



  /**
   * Obtenir le nom d'affichage d'une permission
   */
  getPermissionDisplayName(permission: AdminPermission): string {
    return permission.displayName || permission.name || 'Permission sans nom';
  }

  /**
   * Basculer l'expansion d'un module
   */
  toggleModuleExpansion(moduleName: string): void {
    if (this.expandedModules.has(moduleName)) {
      this.expandedModules.delete(moduleName);
    } else {
      this.expandedModules.add(moduleName);
    }
  }

  /**
   * Vérifier si un module est étendu
   */
  isModuleExpanded(moduleName: string): boolean {
    return this.expandedModules.has(moduleName);
  }

  /**
   * Obtenir l'icône d'un module
   */
  getModuleIcon(moduleName: string): string {
    const icons: { [key: string]: string } = {
      'users': 'fas fa-users',
      'roles': 'fas fa-user-shield',
      'admin': 'fas fa-cogs',
      'properties': 'fas fa-building',
      'contracts': 'fas fa-file-contract',
      'payments': 'fas fa-credit-card',
      'billing': 'fas fa-receipt',
      'geography': 'fas fa-map-marker-alt',
      'settings': 'fas fa-sliders-h',
      'dashboard': 'fas fa-chart-line',
      'notifications': 'fas fa-bell',
      'reports': 'fas fa-chart-bar'
    };
    return icons[moduleName.toLowerCase()] || 'fas fa-folder';
  }

  /**
   * Filtrer par module de permission
   */
  onPermissionModuleFilter(): void {
    // Le filtrage est géré par getFilteredPermissionsList()
  }

  /**
   * Filtrer par type de permission
   */
  onPermissionTypeFilter(): void {
    // Le filtrage est géré par getFilteredPermissionsList()
  }

  /**
   * Rechercher dans les permissions
   */
  onPermissionSearch(): void {
    // La recherche est gérée par getFilteredPermissionsList()
  }

  /**
   * Actualiser les permissions
   */
  async onRefreshPermissions(): Promise<void> {
    if (this.isRefreshing) return;

    try {
      this.isRefreshing = true;
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissions()));

      // Petit délai pour l'animation
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des permissions:', error);
      this.isRefreshing = false;
    }
  }

  /**
   * Créer une nouvelle permission
   */
  onCreatePermission(): void {
    // TODO: Ouvrir le modal de création de permission
    console.log('Créer une nouvelle permission');
  }

  /**
   * Voir les détails d'une permission
   */
  onViewPermission(permission: AdminPermission): void {
    // TODO: Ouvrir le modal de détails de permission
    console.log('Voir la permission:', permission);
  }

  /**
   * Modifier une permission
   */
  onEditPermission(permission: AdminPermission): void {
    // TODO: Ouvrir le modal d'édition de permission
    console.log('Modifier la permission:', permission);
  }

  /**
   * Supprimer une permission
   */
  onDeletePermission(permission: AdminPermission): void {
    // TODO: Confirmer et supprimer la permission
    console.log('Supprimer la permission:', permission);
  }

  /**
   * Vérifier s'il y a des filtres actifs
   */
  hasActiveFilters(): boolean {
    return !!(this.selectedPermissionModule || this.selectedPermissionType || this.permissionSearchQuery);
  }

  /**
   * Effacer tous les filtres
   */
  onClearFilters(): void {
    this.selectedPermissionModule = '';
    this.selectedPermissionType = '';
    this.permissionSearchQuery = '';
  }

  /**
   * Obtenir le message d'état vide
   */
  getEmptyStateMessage(): string {
    if (this.hasActiveFilters()) {
      return 'Aucune permission ne correspond aux critères de recherche. Essayez de modifier vos filtres.';
    }
    return 'Aucune permission n\'est disponible dans le système. Les permissions sont générées automatiquement.';
  }
}
