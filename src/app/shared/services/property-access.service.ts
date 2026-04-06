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

  private getOwnerIdForProperty(propertyId: string): string | null {
    const properties = this.store.selectSnapshot((state: any) => state.properties?.properties || []);
    const prop = properties.find((p: any) => p._id === propertyId);
    return prop?.owner?._id || prop?.owner || null;
  }

  private getAssignment(propertyId: string): ManagedPropertyItem | null {
    const managed = this.store.selectSnapshot(PropertyManagerState.selectManagedProperties);
    return managed.find(m => m.propertyId === propertyId) || null;
  }

  isOwner(propertyId: string): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    const ownerId = this.getOwnerIdForProperty(propertyId);
    return ownerId === userId;
  }

  isManager(propertyId: string): boolean {
    return !!this.getAssignment(propertyId);
  }

  hasAccess(propertyId: string): boolean {
    return this.isOwner(propertyId) || this.isManager(propertyId);
  }

  hasPermission(propertyId: string, permission: ManagerPermission): boolean {
    if (this.isOwner(propertyId)) return true;
    const assignment = this.getAssignment(propertyId);
    if (!assignment) return false;
    return assignment.permissions.includes('FULL_ACCESS') || assignment.permissions.includes(permission);
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

  getPermissionsForProperty(propertyId: string): ManagerPermission[] {
    if (this.isOwner(propertyId)) return ['FULL_ACCESS'];
    return this.getAssignment(propertyId)?.permissions || [];
  }
}
