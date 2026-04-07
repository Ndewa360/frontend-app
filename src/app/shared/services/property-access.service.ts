import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { PropertyManagerState } from '../store/property-manager';
import { ManagerPermission, ManagedPropertyItem } from '../store/property-manager/property-manager.model';

@Injectable({ providedIn: 'root' })
export class PropertyAccessService {
  constructor(private store: Store) {}

  private getCurrentUserId(): string | null {
    const profile = this.store.selectSnapshot((state: any) => state.userprofile?.userProfile);
    return profile?._id || null;
  }

  private getPropertyFromStore(propertyId: string): any {
    const properties = this.store.selectSnapshot((state: any) => state.properties?.properties || []);
    return properties.find((p: any) => p._id === propertyId) || null;
  }

  private getAssignment(propertyId: string): ManagedPropertyItem | null {
    const managed = this.store.selectSnapshot(PropertyManagerState.selectManagedProperties);
    return managed.find(m => m.propertyId === propertyId) || null;
  }

  /**
   * L'utilisateur est propriétaire si :
   * - Le backend a retourné userRole === 'owner' dans la propriété du store
   * - OU l'owner._id correspond à l'userId courant
   */
  isOwner(propertyId: string): boolean {
    if (!propertyId) return false;
    const prop = this.getPropertyFromStore(propertyId);
    if (!prop) return false;

    // Le backend retourne userRole directement
    if (prop.userRole === 'owner') return true;

    // Fallback : comparer owner._id
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    const ownerId = prop.owner?._id || prop.owner;
    return ownerId?.toString() === userId;
  }

  /**
   * L'utilisateur est gérant si :
   * - Le backend a retourné userRole === 'manager'
   * - OU il y a un assignment dans le store PropertyManager
   */
  isManager(propertyId: string): boolean {
    if (!propertyId) return false;
    const prop = this.getPropertyFromStore(propertyId);
    if (prop?.userRole === 'manager') return true;
    return !!this.getAssignment(propertyId);
  }

  hasAccess(propertyId: string): boolean {
    return this.isOwner(propertyId) || this.isManager(propertyId);
  }

  /**
   * Récupère les permissions du gérant :
   * - D'abord depuis la propriété du store (retournées par le backend)
   * - Sinon depuis le store PropertyManager
   */
  getPermissionsForProperty(propertyId: string): ManagerPermission[] {
    if (this.isOwner(propertyId)) return ['FULL_ACCESS'];

    // Permissions retournées par le backend dans la propriété
    const prop = this.getPropertyFromStore(propertyId);
    if (prop?.managerPermissions?.length > 0) {
      return prop.managerPermissions as ManagerPermission[];
    }

    // Fallback : store PropertyManager
    const assignment = this.getAssignment(propertyId);
    return assignment?.permissions || [];
  }

  hasPermission(propertyId: string, permission: ManagerPermission): boolean {
    if (this.isOwner(propertyId)) return true;
    const perms = this.getPermissionsForProperty(propertyId);
    return perms.includes('FULL_ACCESS') || perms.includes(permission);
  }

  canManageUnits(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'MANAGE_UNITS');
  }

  canManageTenants(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'MANAGE_TENANTS');
  }

  canManageContracts(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'MANAGE_CONTRACTS');
  }

  canManagePayments(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'MANAGE_PAYMENTS');
  }

  canViewFinances(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'VIEW_FINANCES') || this.hasPermission(propertyId, 'MANAGE_FINANCES');
  }

  canManageFinances(propertyId: string): boolean {
    return this.hasPermission(propertyId, 'MANAGE_FINANCES');
  }
}
