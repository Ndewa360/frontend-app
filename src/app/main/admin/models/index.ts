// Export all admin models and types

// Shared types
export * from './shared.types';

// Store models
export * from '../store/users/admin-users.model';
export * from '../store/roles/admin-roles.model';
export * from '../store/dashboard/admin-dashboard.model';
export * from '../store/geography/admin-geography.model';
export * from '../store/payments/admin-payments.model';
export * from '../store/settings/admin-settings.model';

// Roles Models
export * from '../store/roles/admin-roles.model';

// Dashboard Models
export * from '../store/dashboard/admin-dashboard.model';

// Geography Models
export * from '../store/geography/admin-geography.model';

// Payments Models
export * from '../store/payments/admin-payments.model';

// Settings Models
export * from '../store/settings/admin-settings.model';

// Common Admin Types
export interface AdminResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface AdminError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AdminBulkAction {
  action: string;
  ids: string[];
  data?: any;
}

export interface AdminExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  filters?: any;
  columns?: string[];
  filename?: string;
}

export interface AdminImportResult {
  imported: number;
  failed: number;
  errors: AdminImportError[];
}

export interface AdminImportError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: AdminNotificationAction[];
}

export interface AdminNotificationAction {
  label: string;
  action: string;
  data?: any;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface AdminSystemMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  status: 'normal' | 'warning' | 'critical';
}

export interface AdminAlert {
  id: string;
  type: 'system' | 'security' | 'performance' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: any;
}

export interface AdminTask {
  id: string;
  name: string;
  description: string;
  type: 'backup' | 'cleanup' | 'sync' | 'report' | 'maintenance';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  createdBy: string;
}

export interface AdminWidget {
  id: string;
  type: 'chart' | 'stat' | 'table' | 'list' | 'metric';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: any;
  data?: any;
  refreshInterval?: number;
  lastUpdated?: Date;
}

export interface AdminDashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: AdminWidget[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Utility Types
export type AdminEntityStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending' | 'deleted';

export type AdminUserRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'viewer';

export type AdminPermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view' | 'export' | 'import';

export type AdminPermissionResource = 'users' | 'roles' | 'permissions' | 'properties' | 'payments' | 'subscriptions' | 'coupons' | 'countries' | 'cities' | 'currencies' | 'settings' | 'logs' | 'backups' | 'reports';

export type AdminLogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type AdminBackupType = 'full' | 'incremental' | 'differential';

export type AdminCacheType = 'redis' | 'memory' | 'file' | 'database';

export type AdminStorageProvider = 'local' | 's3' | 'cloudinary' | 'azure' | 'gcp';

export type AdminEmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';

export type AdminPaymentProvider = 'stripe' | 'paypal' | 'square' | 'razorpay' | 'flutterwave';

export type AdminAnalyticsProvider = 'google' | 'mixpanel' | 'amplitude' | 'segment';

export type AdminMapProvider = 'google' | 'mapbox' | 'openstreetmap';

// Constants
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
  VIEWER: 'viewer'
} as const;

export const ADMIN_PERMISSIONS = {
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
  PAYMENTS_VIEW: 'payments:view',
  REPORTS_EXPORT: 'reports:export'
} as const;

export const ADMIN_COLORS = {
  PRIMARY: 'rgb(204, 140, 10)',
  SECONDARY: 'rgb(39, 122, 252)',
  SUCCESS: '#24a148',
  WARNING: '#f1c21b',
  DANGER: '#da1e28',
  INFO: '#0f62fe'
} as const;
