export type ManagerPermission =
  | 'VIEW_PROPERTY'
  | 'MANAGE_UNITS'
  | 'MANAGE_TENANTS'
  | 'MANAGE_CONTRACTS'
  | 'MANAGE_PAYMENTS'
  | 'VIEW_FINANCES'
  | 'MANAGE_FINANCES'
  | 'FULL_ACCESS';

export type AssignmentStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export interface ManagedPropertyItem {
  assignmentId: string;
  propertyId: string;
  propertyName: string;
  ownerName: string;
  permissions: ManagerPermission[];
}

export interface PropertyManagerAssignment {
  _id: string;
  owner: any;
  manager: any;
  property: any;
  permissions: ManagerPermission[];
  status: AssignmentStatus;
  invitedByEmail: string;
  isNewAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAndAssignManagerPayload {
  name: string;
  email: string;
  propertyId: string;
  permissions: ManagerPermission[];
}

export interface AssignExistingManagerPayload {
  email: string;
  propertyId: string;
  permissions: ManagerPermission[];
}

export const PERMISSION_LABELS: Record<ManagerPermission, string> = {
  VIEW_PROPERTY: 'Voir le bien',
  MANAGE_UNITS: 'Gérer les unités',
  MANAGE_TENANTS: 'Gérer les locataires',
  MANAGE_CONTRACTS: 'Gérer les contrats',
  MANAGE_PAYMENTS: 'Gérer les paiements',
  VIEW_FINANCES: 'Voir les finances',
  MANAGE_FINANCES: 'Gérer les finances',
  FULL_ACCESS: 'Accès complet',
};
