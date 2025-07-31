export interface AdminRole {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: AdminPermission[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface AdminPermission {
  _id: string;
  name: string;
  code?: string;
  displayName?: string;
  description: string;
  module: string;
  category?: string;
  action?: string;
  resource?: string;
  isSystem?: boolean;
  isSystemPermission?: boolean;
  isDeleted?: boolean;
  isDisabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleStats {
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  activeRoles: number;
  inactiveRoles: number;
  totalPermissions: number;
  systemPermissions: number;
  customPermissions: number;
  rolesWithUsers: number;
  rolesWithoutUsers: number;
  averagePermissionsPerRole: number;
  mostUsedRoles: RoleUsage[];
  leastUsedRoles: RoleUsage[];
  permissionDistribution: PermissionDistribution[];
  roleCreationTrend: ChartData[];
}

export interface RoleUsage {
  roleId: string;
  roleName: string;
  roleColor: string;
  userCount: number;
  percentage: number;
}

export interface PermissionDistribution {
  module: string;
  permissionCount: number;
  percentage: number;
  color: string;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface PermissionsMatrix {
  roles: MatrixRole[];
  permissions: MatrixPermission[];
  matrix: { [roleId: string]: { [permissionId: string]: boolean } };
  modules?: Array<{
    name: string;
    displayName: string;
    permissions: Array<{
      permission: MatrixPermission;
      roles: Array<{
        roleId: string;
        roleName: string;
        hasPermission: boolean;
      }>;
    }>;
  }>;
}

export interface MatrixRole {
  _id: string;
  name: string;
  displayName: string;
  color: string;
  userCount: number;
  isSystemRole?: boolean;
}

export interface MatrixPermission {
  _id: string;
  name: string;
  code: string;
  displayName: string;
  module: string;
  category: string;
  action: string;
  resource: string;
  isSystem?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  isDisabled?: boolean;
  description?: string;
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  displayName?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleFilters {
  search?: string;
  isSystem?: boolean;
  isActive?: boolean;
  hasUsers?: boolean;
  module?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminRolesStateModel {
  roles: AdminRole[];
  permissions: AdminPermission[];
  selectedRole: AdminRole | null;
  stats: RoleStats | null;
  permissionsMatrix: PermissionsMatrix | null;
  roleUsers: { [roleId: string]: any[] };
  filters: RoleFilters;
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
