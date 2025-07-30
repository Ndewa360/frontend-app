import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';

// Actions
import { AdminRolesAction } from '../../store/roles/admin-roles.actions';

// States
import { AdminRolesState } from '../../store/roles/admin-roles.state';

// Models
import { AdminRole, AdminPermission } from '../../store/roles/admin-roles.model';

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

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadData();
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

  onCreateRole(): void {
    this.showCreateModal = true;
  }

  onEditRole(role: AdminRole): void {
    this.selectedRole = role;
    this.showEditModal = true;
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
    const newName = prompt('Nom du nouveau rôle:', `${role.name}_copy`);
    if (newName) {
      // Dispatch duplicate role action
      console.log('Duplicate role:', role._id, newName);
    }
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

  trackByRoleId(index: number, role: AdminRole): string {
    return role._id;
  }

  trackByPermissionId(index: number, permission: AdminPermission): string {
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
    return matrix?.matrix?.[roleId]?.[permissionId] || false;
  }
}
