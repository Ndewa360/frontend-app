import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
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

  matrixSnapshot: PermissionsMatrix | null = null;

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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initRoleForm();
    this.loadData();
    this.store.select(AdminRolesState.selectPermissionsMatrix)
      .pipe(takeUntil(this.destroy$))
      .subscribe(m => {
        this.matrixSnapshot = m ? JSON.parse(JSON.stringify(m)) : null;
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
    if (tab === 'matrix' && !this.matrixSnapshot) {
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
        this.toastr.success(this.showEditModal ? 'Role mis a jour' : 'Role cree');
        this.onCloseModal();
        setTimeout(() => this.loadData(), 300);
      },
      error: (e) => this.toastr.error(e?.error?.message || 'Erreur')
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
    if (role.isSystemRole) { this.toastr.warning('Impossible de supprimer un role systeme'); return; }
    this.roleToAction = role;
    this.showDeleteRoleModal = true;
  }

  confirmDeleteRole(): void {
    if (!this.roleToAction) return;
    this.store.dispatch(new AdminRolesAction.DeleteRole(this.roleToAction._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Role supprime'); setTimeout(() => this.loadData(), 300); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la suppression')
      });
    this.showDeleteRoleModal = false;
    this.roleToAction = null;
  }

  onToggleRoleStatus(role: AdminRole): void {
    this.openMenuId = null;
    if (role.isSystemRole) { this.toastr.warning('Impossible de modifier un role systeme'); return; }
    this.roleToAction = role;
    this.showToggleStatusModal = true;
  }

  confirmToggleStatus(): void {
    if (!this.roleToAction) return;
    this.store.dispatch(new AdminRolesAction.UpdateRole(this.roleToAction._id, { isDisabled: !this.roleToAction.isDisabled }))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Statut mis a jour'); setTimeout(() => this.loadData(), 300); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur')
      });
    this.showToggleStatusModal = false;
    this.roleToAction = null;
  }

  onDuplicateRole(role: AdminRole): void {
    this.openMenuId = null;
    if (role.isSystemRole) { this.toastr.warning('Impossible de dupliquer un role systeme'); return; }
    this.roleToAction = role;
    this.duplicateRoleName = `${role.name}_copy`;
    this.showDuplicateRoleModal = true;
  }

  confirmDuplicateRole(): void {
    if (!this.roleToAction || !this.duplicateRoleName.trim()) return;
    this.adminRolesService.duplicateRole(this.roleToAction._id, this.duplicateRoleName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.loadData(); this.toastr.success('Role duplique'); },
        error: () => this.toastr.error('Erreur lors de la duplication')
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
  trackByRoleId(_i: number, r: AdminRole): string { return r._id; }
  trackByPermissionId(_i: number, p: AdminPermission): string { return p._id; }

  toggleRoleMenu(roleId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === roleId ? null : roleId;
  }

  shouldShowRolesEmptyState(isLoading: boolean | null, roles: AdminRole[] | null): boolean {
    return !isLoading && (!roles || roles.length === 0);
  }

  // ==================== MATRIX ====================

  isPermissionGranted(roleId: string, permissionId: string): boolean {
    if (!this.matrixSnapshot) return false;
    return this.matrixSnapshot.matrix?.[roleId]?.[permissionId] || false;
  }

  onToggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  onPermissionToggle(roleId: string, permissionId: string, event: Event): void {
    if (!this.isEditMode) { (event.target as HTMLInputElement).checked = !((event.target as HTMLInputElement).checked); return; }
    const granted = (event.target as HTMLInputElement).checked;
    if (!this.matrixSnapshot) return;
    if (!this.matrixSnapshot.matrix[roleId]) this.matrixSnapshot.matrix[roleId] = {};
    this.matrixSnapshot.matrix[roleId][permissionId] = granted;

    const permission = this.matrixSnapshot.permissions.find(p => p._id === permissionId);
    if (!permission) { this.toastr.error('Permission introuvable'); return; }

    this.store.dispatch(new AdminRolesAction.ToggleRolePermission(roleId, permission.code || permission.name, granted))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => {
          if (this.matrixSnapshot?.matrix[roleId]) {
            this.matrixSnapshot.matrix[roleId][permissionId] = !granted;
          }
          this.toastr.error('Erreur lors de la modification');
        }
      });
  }

  async onRefreshMatrix(): Promise<void> {
    if (this.matrixLoading) return;
    this.matrixLoading = true;
    try {
      await firstValueFrom(this.store.dispatch(new AdminRolesAction.LoadPermissionsMatrix()));
    } catch {
      this.toastr.error('Erreur lors de l\'actualisation');
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

  onModuleFilter(): void {}
  onMatrixPermissionSearch(): void {}

  isSystemPermission(p: AdminPermission | MatrixPermission): boolean {
    return !!(p.isSystem || (p as any).isSystemPermission);
  }

  // ==================== PERMISSIONS LIST (lecture seule) ====================

  getPermissionModules(): string[] {
    return [...new Set((this.store.selectSnapshot(AdminRolesState.selectPermissions) || []).map(p => p.module))].sort();
  }

  getFilteredPermissionsList(): AdminPermission[] {
    let filtered = this.store.selectSnapshot(AdminRolesState.selectPermissions) || [];
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
    return filtered;
  }

  getTotalPermissionsCount():  number { return (this.store.selectSnapshot(AdminRolesState.selectPermissions) || []).length; }
  getSystemPermissionsCount(): number { return (this.store.selectSnapshot(AdminRolesState.selectPermissions) || []).filter(p => p.isSystem).length; }
  getCustomPermissionsCount(): number { return (this.store.selectSnapshot(AdminRolesState.selectPermissions) || []).filter(p => !this.isSystemPermission(p)).length; }

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
      this.toastr.error('Erreur lors de l\'actualisation');
    } finally {
      setTimeout(() => this.isRefreshing = false, 300);
    }
  }

  hasActiveFilters(): boolean { return !!(this.selectedPermissionModule || this.selectedPermissionType || this.permissionSearchQuery); }
  onClearFilters(): void { this.selectedPermissionModule = ''; this.selectedPermissionType = ''; this.permissionSearchQuery = ''; }
  onPermissionModuleFilter(): void {}
  onPermissionTypeFilter(): void {}
  onPermissionSearch(): void {}

  getEmptyStateMessage(): string {
    return this.hasActiveFilters()
      ? 'Aucune permission ne correspond aux criteres.'
      : 'Les permissions sont generees automatiquement au demarrage.';
  }
}
