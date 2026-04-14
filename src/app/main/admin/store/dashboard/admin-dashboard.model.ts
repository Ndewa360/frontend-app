import { AdminChartData } from '../../models/shared.types';

/** Structure exacte retournée par GET /admin/dashboard/stats */
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    verified: number;
    suspended: number;
    statusDistribution: any[];
    registrationTrend: any[];
  };
  subscriptions: {
    total: number;
    free: number;
    premium: number;
    active: number;
    suspended: number;
    totalRevenue: number;
    monthlyRevenue: number;
    unpaidAmount: number;
    unpaidCount: number;
    topMetrics: any;
  };
  payments: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    successfulPayments: number;
  };
  roles: {
    total: number;
    active: number;
    permissions: number;
  };
  geography: {
    countries: number;
    cities: number;
    currencies: number;
  };
  coupons: {
    total: number;
    active: number;
    totalUsages: number;
    totalDiscount: number;
  };
  systemHealth: {
    status: string;
    uptime: number;
    memory: any;
    timestamp: Date;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  uptime: number;
  uptimeFormatted?: string;
  memory?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    unit: string;
  };
  nodeVersion?: string;
  platform?: string;
  services: ServiceHealth[];
  alerts: SystemAlert[];
  lastCheck: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  uptime: number;
  lastCheck: Date;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  link?: string;
  severity?: string;
  actionRequired?: boolean;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  userName?: string;
  timestamp: Date;
  hasError?: boolean;
  metadata?: any;
}

export interface PerformanceMetrics {
  timeRange: string;
  metrics: {
    requests: MetricData[];
    responseTime: MetricData[];
    errorRate: MetricData[];
    throughput: MetricData[];
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    peakThroughput: number;
  };
}

export interface MetricData {
  timestamp: Date;
  value: number;
}

export interface AdminDashboardStateModel {
  stats: DashboardStats | null;
  systemHealth: SystemHealth | null;
  recentActivities: RecentActivity[];
  performanceMetrics: PerformanceMetrics | null;
  financialData: any | null;
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
