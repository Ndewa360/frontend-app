import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminRolesService } from '../../services/admin-roles.service';

import { AdminRolesAction } from '../../store/roles/admin-roles.actions';
import { AdminRolesState } from '../../store/roles/admin-roles.state';
import { AdminRole, AdminPermission, MatrixPermission, PermissionsMatrix } from '../../store/roles/admin-roles.model';

@Component({
  selector: 'app-admin-roles',
  templateUrl: './admin-roles.component.html',
  styleUrls: ['./admin-roles.component.scss']
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  roles$       = this.store.select(AdminRolesState.selectRoles);
  permissions$ = this.store.select(AdminRolesState.selectPermissions);
  stats$       = this.store.select(AdminRolesState.selectStats);
  isLoading$   = this.store.select(AdminRolesState.selectIsLoading);

  filteredPermissions: AdminPermission[] = [];
  totalPermissionsCount  = 0;
  systemPermissionsCount = 0;
  customPermissionsCount = 0;

  matrix$ = this.store.select(AdminRolesState.selectPermissionsMatrix);

  // Matrice locale en mode édition (copie indépendante du store)
  localMatrix: { [roleId: string]: { [permId: string]: boolean } } | null = null;
  matrixDirty = false;

  selectedTab     = 'roles';
  showCreateModal = false;
  showEditModal   = false;
  selectedRole: AdminRole | null = null;

  roleSearchQuery  = '';
  roleStatusFilter = '';
  roleTypeFilter   = '';

  isSaving            = false;
  isRefreshing        = false;
  matrixLoading       = false;
  isEditMode          = false;
  selectedModule      = '';
  permissionSearchTerm = '';

  selectedPermissionModule = '';
  selectedPermissionType   = '';
  permissionSearchQuery    = '';

  openMenuId: string | null = null;

  roleForm: FormGroup;

  showDeleteRoleModal    = false;
  showDuplicateRoleModal = false;
  showToggleStatusModal  = false;
  duplicateRoleName      = '';
  roleToAction: AdminRole | null = null;

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private adminRolesService: AdminRolesService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initRoleForm();
    this.loadData();
    // Réactivité de l'onglet permissions via observable
    this.store.select(AdminRolesState.selectPermissions)
      .pipe(takeUntil(this.destroy$))
      .subscribe(permissions => {
        this._allPermissions = permissions || [];
        this._recomputePermissions();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.ar-actions-menu')) {
      this.openMenuId = null;
    }
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
    this.openMenuId  = null;
    if (tab === 'matrix' && !this.store.selectSnapshot(AdminRolesState.selectPermissionsMatrix)) {
      this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix());
    }
  }

  // ==================== ROLE FORM ====================

  private initRoleForm(): void {
    this.roleForm = this.fb.group({
      name:        ['', [Validators.required, Validators.pattern(/^[a-z0-9_-]+$/)]],
      description: [''],
      color:       ['#6c757d'],
      level:       [null]
    });
  }

  onCreateRole(): void {
    this.roleForm.reset({ color: '#6c757d', level: null });
    this.showCreateModal = true;
  }

  onEditRole(role: AdminRole): void {
    this.openMenuId  = null;
    this.selectedRole = role;
    this.roleForm.patchValue({
      name:        role.name,
      description: role.description || '',
      color:       role.color || '#6c757d',
      level:       role.level ?? null
    });
    this.showEditModal = true;
  }

  onSubmitRole(): void {
    if (this.roleForm.invalid) { this.roleForm.markAllAsTouched(); return; }
    const data = this.roleForm.value;
    const action$ = this.showEditModal && this.selectedRole
      ? this.store.dispatch(new AdminRolesAction.UpdateRole(this.selectedRole._id, data))
      : this.store.dispatch(new AdminRolesAction.CreateRole(data));

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next:  () => {
        this.toastr.success(this.showEditModal ? this.translate.instant('NOTIFICATIONS.ADMIN_ROLE_UPDATED') : this.translate.instant('NOTIFICATIONS.ADMIN_ROLE_CREATED'));
        this.onCloseModal();
        this.store.dispatch(new AdminRolesAction.LoadRoleStats());
      },
      error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('COMMON.ERROR'))
    });
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal   = false;
    this.selectedRole    = null;
  }

  // ==================== ROLE ACTIONS ====================

  onDeleteRole(role: AdminRole): void {
    this.openMenuId = null;
    if (role.isSystemRole) { this.toastr.warning(this.translate.instant('NOTIFICATIONS.ADMIN_CANNOT_DELETE_SYSTEM_ROLE')); return; }
    this.roleToAction = role;
    this.showDeleteRoleModal = true;
  }

  confirmDeleteRole(): void {
    if (!this.roleToAction) return;
    this.store.dispatch(new AdminRolesAction.DeleteRole(this.roleToAction._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_ROLE_DELETED')); this.store.dispatch(new AdminRolesAction.LoadRoleStats()); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_DELETE_ERROR'))
      });
    this.showDeleteRoleModal = false;
    this.roleToAction = null;
  }

  onToggleRoleStatus(role: AdminRole): void {
    this.openMenuId = null;
    if (role.isSystemRole) { this.toastr.warning(this.translate.instant('NOTIFICATIONS.ADMIN_CANNOT_MODIFY_SYSTEM_ROLE')); return; }
    this.roleToAction = role;
    this.showToggleStatusModal = true;
  }

  confirmToggleStatus(): void {
    if (!this.roleToAction) return;
    this.store.dispatch(new AdminRolesAction.UpdateRole(this.roleToAction._id, { isDisabled: !this.roleToAction.isDisabled }))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_STATUS_UPDATED')); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('COMMON.ERROR'))
      });
    this.showToggleStatusModal = false;
    this.roleToAction = null;
  }

  onDuplicateRole(role: AdminRole): void {
    this.openMenuId = null;
    if (role.isSystemRole) { this.toastr.warning(this.translate.instant('NOTIFICATIONS.ADMIN_CANNOT_DUPLICATE_SYSTEM_ROLE')); return; }
    this.roleToAction = role;
    this.duplicateRoleName = `${role.name}_copy`;
    this.showDuplicateRoleModal = true;
  }

  confirmDuplicateRole(): void {
    if (!this.roleToAction || !this.duplicateRoleName.trim()) return;
    this.adminRolesService.duplicateRole(this.roleToAction._id, this.duplicateRoleName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (role) => {
          const state = this.store.selectSnapshot(AdminRolesState.selectRoles);
          this.store.dispatch(new AdminRolesAction.LoadRolesSuccess([role, ...state]));
          this.store.dispatch(new AdminRolesAction.LoadRoleStats());
          this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_ROLE_DUPLICATED'));
        },
        error: () => this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_DUPLICATE_ERROR'))
      });
    this.showDuplicateRoleModal = false;
    this.roleToAction = null;
  }

  cancelRoleAction(): void {
    this.showDeleteRoleModal    = false;
    this.showDuplicateRoleModal = false;
    this.showToggleStatusModal  = false;
    this.roleToAction = null;
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminRolesAction.RefreshData());
  }

  // ==================== ROLES FILTERS ====================

  getFilteredRoles(roles: AdminRole[] | null): AdminRole[] {
    if (!roles) return [];
    let filtered = roles;
    if (this.roleSearchQuery) {
      const q = this.roleSearchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    if (this.roleStatusFilter === 'active')   filtered = filtered.filter(r => !r.isDisabled);
    if (this.roleStatusFilter === 'inactive') filtered = filtered.filter(r =>  r.isDisabled);
    if (this.roleTypeFilter   === 'system')   filtered = filtered.filter(r =>  r.isSystemRole);
    if (this.roleTypeFilter   === 'custom')   filtered = filtered.filter(r => !r.isSystemRole);
    return filtered;
  }

  onClearRoleFilters(): void { this.roleSearchQuery = ''; this.roleStatusFilter = ''; this.roleTypeFilter = ''; }
  hasActiveRoleFilters(): boolean { return !!(this.roleSearchQuery || this.roleStatusFilter || this.roleTypeFilter); }

  // ==================== HELPERS ====================

  getStatusLabel(isDisabled: boolean): string { return isDisabled ? 'Inactif' : 'Actif'; }
  trackByRoleId(_i: number, r: { _id: string }): string { return r._id; }
  trackByPermissionId(_i: number, p: AdminPermission): string { return p._id; }
  trackByPermId(_i: number, p: MatrixPermission): string { return p._id; }
  trackByGroupName(_i: number, g: { name: string }): string { return g.name; }

  toggleRoleMenu(roleId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === roleId ? null : roleId;
  }

  shouldShowRolesEmptyState(isLoading: boolean | null, roles: AdminRole[] | null): boolean {
    return !isLoading && (!roles || roles.length === 0);
  }

  // ==================== MATRIX ====================

  isPermissionGranted(matrix: PermissionsMatrix | null, roleId: string, permId: string): boolean {
    if (this.isEditMode && this.localMatrix) return this.localMatrix[roleId]?.[permId] || false;
    if (!matrix) return false;
    return matrix.matrix?.[roleId]?.[permId] || false;
  }

  onEnterEditMode(matrix: PermissionsMatrix): void {
    // Cloner la matrice du store dans localMatrix
    this.localMatrix = {};
    for (const roleId of Object.keys(matrix.matrix)) {
      this.localMatrix[roleId] = { ...matrix.matrix[roleId] };
    }
    this.matrixDirty = false;
    this.isEditMode  = true;
  }

  onCancelEdit(): void {
    this.localMatrix = null;
    this.matrixDirty = false;
    this.isEditMode  = false;
  }

  onPermissionToggle(roleId: string, permId: string, event: Event): void {
    if (!this.isEditMode || !this.localMatrix) return;
    const granted = (event.target as HTMLInputElement).checked;
    if (!this.localMatrix[roleId]) this.localMatrix[roleId] = {};
    this.localMatrix[roleId][permId] = granted;
    this.matrixDirty = true;
  }

  async onSaveMatrix(matrix: PermissionsMatrix): Promise<void> {
    if (!this.localMatrix || this.isSaving) return;
    this.isSaving = true;

    // Identifier les rôles modifiés et construire les payloads bulk
    const saves: Promise<void>[] = [];
    for (const role of matrix.roles) {
      if (role.isSystemRole) continue;
      const original = matrix.matrix[role._id] || {};
      const local    = this.localMatrix[role._id] || {};
      const changed  = matrix.permissions.some(p => (original[p._id] || false) !== (local[p._id] || false));
      if (!changed) continue;

      const permIds = matrix.permissions
        .filter(p => local[p._id])
        .map(p => p._id);

      saves.push(
        firstValueFrom(
          this.adminRolesService.assignPermissions(role._id, permIds)
        ).then(() => {})
      );
    }

    try {
      await Promise.all(saves);
      // Recharger la matrice depuis le serveur
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));
      this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_PERMISSIONS_SAVED'));
      this.localMatrix = null;
      this.matrixDirty = false;
      this.isEditMode  = false;
    } catch {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_SAVE_ERROR'));
    } finally {
      this.isSaving = false;
    }
  }

  async onRefreshMatrix(): Promise<void> {
    if (this.matrixLoading) return;
    this.matrixLoading = true;
    try {
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));
    } catch {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_REFRESH_ERROR'));
    } finally {
      this.matrixLoading = false;
    }
  }

  getUniqueModules(permissions: MatrixPermission[] | undefined): string[] {
    if (!permissions) return [];
    return [...new Set(permissions.map(p => p.module))].sort();
  }

  getFilteredPermissions(permissions: MatrixPermission[] | undefined): MatrixPermission[] {
    if (!permissions) return [];
    let filtered = permissions;
    if (this.selectedModule) filtered = filtered.filter(p => p.module === this.selectedModule);
    if (this.permissionSearchTerm) {
      const t = this.permissionSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(t)) ||
        (p.code && p.code.toLowerCase().includes(t)) ||
        p.module.toLowerCase().includes(t)
      );
    }
    return filtered;
  }

  getGroupedPermissions(permissions: MatrixPermission[]): { name: string; permissions: MatrixPermission[] }[] {
    const grouped = permissions.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    }, {} as { [m: string]: MatrixPermission[] });
    return Object.keys(grouped).sort().map(m => ({
      name: m,
      permissions: grouped[m].sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
    }));
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const w = name.trim().split(' ');
    return w.length === 1 ? w[0][0].toUpperCase() : (w[0][0] + w[w.length - 1][0]).toUpperCase();
  }

  onModuleFilter(): void        {}
  onMatrixPermissionSearch(): void {}

  isSystemPermission(p: AdminPermission | MatrixPermission): boolean {
    return !!(p.isSystem || (p as any).isSystemPermission);
  }

  // ==================== PERMISSIONS LIST (lecture seule) ====================

  private _allPermissions: AdminPermission[] = [];

  private _recomputePermissions(): void {
    let filtered = this._allPermissions;
    if (this.selectedPermissionModule) filtered = filtered.filter(p => p.module === this.selectedPermissionModule);
    if (this.selectedPermissionType === 'system') filtered = filtered.filter(p =>  this.isSystemPermission(p));
    if (this.selectedPermissionType === 'custom') filtered = filtered.filter(p => !this.isSystemPermission(p));
    if (this.permissionSearchQuery) {
      const q = this.permissionSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.displayName && p.displayName.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.module.toLowerCase().includes(q)
      );
    }
    this.filteredPermissions      = filtered;
    this.totalPermissionsCount    = this._allPermissions.length;
    this.systemPermissionsCount   = this._allPermissions.filter(p => p.isSystem).length;
    this.customPermissionsCount   = this._allPermissions.filter(p => !this.isSystemPermission(p)).length;
  }

  getPermissionModules(): string[] {
    return [...new Set(this._allPermissions.map(p => p.module))].sort();
  }

  getFilteredPermissionsList(): AdminPermission[] { return this.filteredPermissions; }

  getTotalPermissionsCount():  number { return this.totalPermissionsCount; }
  getSystemPermissionsCount(): number { return this.systemPermissionsCount; }
  getCustomPermissionsCount(): number { return this.customPermissionsCount; }

  getPermissionDisplayName(p: AdminPermission): string { return p.displayName || p.name || 'Permission sans nom'; }

  getModuleIcon(moduleName: string): string {
    const icons: { [k: string]: string } = {
      users: 'fas fa-users', roles: 'fas fa-user-shield', admin: 'fas fa-cogs',
      properties: 'fas fa-building', contracts: 'fas fa-file-contract',
      payments: 'fas fa-credit-card', billing: 'fas fa-receipt',
      settings: 'fas fa-sliders-h', dashboard: 'fas fa-chart-line',
      notifications: 'fas fa-bell', reports: 'fas fa-chart-bar'
    };
    return icons[moduleName?.toLowerCase()] || 'fas fa-folder';
  }

  async onRefreshPermissions(): Promise<void> {
    if (this.isRefreshing) return;
    try {
      this.isRefreshing = true;
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissions()));
    } catch {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_REFRESH_ERROR'));
    } finally {
      setTimeout(() => this.isRefreshing = false, 300);
    }
  }

  hasActiveFilters(): boolean { return !!(this.selectedPermissionModule || this.selectedPermissionType || this.permissionSearchQuery); }
  onClearFilters(): void {
    this.selectedPermissionModule = '';
    this.selectedPermissionType   = '';
    this.permissionSearchQuery    = '';
    this._recomputePermissions();
  }
  onPermissionModuleFilter(): void { this._recomputePermissions(); }
  onPermissionTypeFilter(): void   { this._recomputePermissions(); }
  onPermissionSearch(): void       { this._recomputePermissions(); }

  getEmptyStateMessage(): string {
    return this.hasActiveFilters()
      ? this.translate.instant('NOTIFICATIONS.ADMIN_NO_PERMISSIONS_MATCH')
      : this.translate.instant('NOTIFICATIONS.ADMIN_PERMISSIONS_AUTO_GENERATED');
  }
}
