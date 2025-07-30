// Types partagés pour le module admin

export interface AdminChartData {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  role?: string;
  country?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface AdminSortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AdminTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface AdminBulkAction {
  action: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning';
  requireConfirmation?: boolean;
}

export interface AdminMenuItem {
  label: string;
  action: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning';
  disabled?: boolean;
  separator?: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface AdminSystemInfo {
  version: string;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  lastBackup?: Date;
}

export interface AdminExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters?: AdminFilters;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface AdminImportResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  warnings: string[];
}

export interface AdminBackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AdminEntityStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending' | 'deleted';

export type AdminUserRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'viewer';

export type AdminPermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view' | 'export' | 'import';

export type AdminPermissionResource = 'users' | 'roles' | 'properties' | 'payments' | 'geography' | 'settings' | 'reports' | 'system';
