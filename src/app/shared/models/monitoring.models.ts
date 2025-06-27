export enum ErrorLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorSource {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK'
}

export enum ErrorStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED'
}

export interface ErrorLog {
  _id: string;
  message: string;
  stackTrace: any;
  level: ErrorLevel;
  source: ErrorSource;
  status: ErrorStatus;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  requestBody?: any;
  requestHeaders?: any;
  responseData?: any;
  userAgent?: string;
  ipAddress?: string;
  environment?: string;
  version?: string;
  additionalData?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
  occurrenceCount: number;
  lastOccurrence?: Date;
  firstOccurrence?: Date;
  tags?: string[];
  component?: string;
  feature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

export interface ServiceMetric {
  name: string;
  status: ServiceStatus;
  responseTime?: number;
  lastCheck: Date;
  message?: string;
  details?: any;
}

export interface SystemHealth {
  _id: string;
  timestamp: Date;
  overallStatus: ServiceStatus;
  services: {
    database: ServiceMetric;
    authentication: ServiceMetric;
    fileUpload: ServiceMetric;
    email: ServiceMetric;
    externalApis: ServiceMetric;
    cache?: ServiceMetric;
  };
  systemMetrics: {
    memoryUsage?: number;
    cpuUsage?: number;
    diskUsage?: number;
    activeConnections?: number;
    requestsPerMinute?: number;
    errorRate?: number;
    averageResponseTime?: number;
    uptime?: number;
    nodeVersion?: string;
    platform?: string;
  };
  applicationMetrics: {
    activeUsers?: number;
    totalProperties?: number;
    totalRooms?: number;
    totalLocataires?: number;
    totalPayments?: number;
    recentErrors?: number;
    uptime?: number;
  };
  environment: string;
  version: string;
  alerts?: string[];
  additionalData?: any;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<ErrorLevel, number>;
  errorsBySource: Record<ErrorSource, number>;
  errorsByStatus: Record<ErrorStatus, number>;
  recentErrors: number;
  topErrors: Array<{ message: string; count: number; level: ErrorLevel }>;
}

export interface DashboardData {
  errorStats: ErrorStats;
  systemHealth: SystemHealth;
  timestamp: Date;
}

export interface ErrorFilters {
  level?: ErrorLevel;
  source?: ErrorSource;
  status?: ErrorStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
  search?: string;
}

export interface LogErrorRequest {
  message: string;
  stackTrace: any;
  level?: ErrorLevel;
  source: ErrorSource;
  url?: string;
  component?: string;
  feature?: string;
  additionalData?: any;
  tags?: string[];
}

export interface BulkUpdateRequest {
  ids: string[];
  updates: Partial<ErrorLog>;
}

export interface CleanupRequest {
  errorDays?: number;
  healthDays?: number;
}

// Types pour les alertes en temps réel
export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source?: ErrorSource;
  level?: ErrorLevel;
  autoClose?: boolean;
  duration?: number;
}

// Types pour les métriques en temps réel
export interface RealTimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
  systemLoad: number;
  memoryUsage: number;
  timestamp: Date;
}

// Configuration du monitoring
export interface MonitoringConfig {
  autoRefreshInterval: number; // en millisecondes
  maxErrorsToShow: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
  };
  enableRealTimeAlerts: boolean;
  enableAutoCleanup: boolean;
  cleanupIntervalDays: number;
}
