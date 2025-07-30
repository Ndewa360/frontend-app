export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  isActive: boolean;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
}

// Modules de l'application pour les permissions
export enum AppModule {
  PROPERTIES = 'properties',
  TENANTS = 'tenants',
  CONTRACTS = 'contracts',
  PAYMENTS = 'payments',
  SEARCH = 'search',
  ADMIN = 'admin',
  USERS = 'users',
  ROLES = 'roles',
  GEOGRAPHY = 'geography',
  SETTINGS = 'settings',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports'
}

// Actions possibles pour les permissions
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject'
}

// Ressources pour les permissions
export enum PermissionResource {
  ALL = '*',
  OWN = 'own',
  PROPERTY = 'property',
  TENANT = 'tenant',
  CONTRACT = 'contract',
  PAYMENT = 'payment',
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  CITY = 'city',
  COUNTRY = 'country',
  SETTING = 'setting',
  REPORT = 'report'
}

// Rôles système prédéfinis
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROPERTY_MANAGER = 'property_manager',
  TENANT = 'tenant',
  VIEWER = 'viewer'
}

// Interface pour la création/modification de rôle
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  id: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

// Interface pour l'assignation de rôles
export interface AssignRoleRequest {
  userId: string;
  roleIds: string[];
  expiresAt?: Date;
}

// Interface pour les filtres de recherche
export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  isSystemRole?: boolean;
  module?: AppModule;
  hasPermission?: string;
}

export interface PermissionFilters {
  search?: string;
  module?: AppModule;
  action?: PermissionAction;
  resource?: PermissionResource;
}

// Interface pour les statistiques des rôles
export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
  mostUsedRole: {
    role: Role;
    userCount: number;
  };
  permissionsByModule: {
    [module: string]: number;
  };
}

// Interface pour l'état du store
export interface RolesStateModel {
  roles: Role[];
  permissions: Permission[];
  userRoleAssignments: UserRoleAssignment[];
  selectedRole: Role | null;
  selectedPermissions: Permission[];
  loading: boolean;
  error: string | null;
  stats: RoleStats | null;
  filters: RoleFilters;
  permissionFilters: PermissionFilters;
}

// Interface pour les réponses API
export interface RolesResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
}

export interface PermissionsResponse {
  permissions: Permission[];
  total: number;
  page: number;
  limit: number;
}

export interface UserRolesResponse {
  userId: string;
  roles: Role[];
  assignments: UserRoleAssignment[];
}

// Interface pour la validation des permissions
export interface PermissionCheck {
  module: AppModule;
  action: PermissionAction;
  resource: PermissionResource;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions: string[];
}

// Interface pour l'audit des rôles
export interface RoleAuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'unassign';
  roleId: string;
  roleName: string;
  userId?: string;
  performedBy: string;
  performedAt: Date;
  changes?: any;
  reason?: string;
}

// Interface pour les templates de rôles
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  category: 'business' | 'technical' | 'administrative';
  isDefault: boolean;
}
