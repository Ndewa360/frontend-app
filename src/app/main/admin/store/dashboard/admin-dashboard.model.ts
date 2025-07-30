import { AdminChartData } from '../../models/shared.types';

export interface DashboardStats {
  overview: OverviewStats;
  users: UserOverview;
  properties: PropertyOverview;
  payments: PaymentOverview;
  system: SystemOverview;
  charts: DashboardCharts;
}

export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  totalRevenue: number;
  monthlyGrowth: number;
  systemHealth: number;
}

export interface UserOverview {
  total: number;
  active: number;
  newThisMonth: number;
  growthRate: number;
  topCountries: CountryData[];
  statusDistribution: StatusData[];
}

export interface PropertyOverview {
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number;
  averageRent: number;
  topCities: CityData[];
}

export interface PaymentOverview {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  successRate: number;
  revenueGrowth: number;
}

export interface SystemOverview {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface DashboardCharts {
  userGrowth: AdminChartData[];
  revenue: AdminChartData[];
  propertyOccupancy: AdminChartData[];
  systemMetrics: AdminChartData[];
}

export interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

export interface CityData {
  city: string;
  country: string;
  count: number;
  percentage: number;
}

export interface StatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

// ChartData moved to shared.types.ts as AdminChartData

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
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
}

export interface RecentActivity {
  id: string;
  type: 'user' | 'property' | 'payment' | 'system';
  action: string;
  description: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
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
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
