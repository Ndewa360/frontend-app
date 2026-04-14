import { AdminChartData } from '../../models/shared.types';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';
  emailConfirmed: boolean;
  telConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  roles: AdminUserRole[];
  lastLoginAt?: Date;
  lastLoginIP?: string;
  loginCount?: number;
  country?: string;
  location?: string;
  timezone?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  bio?: string;
  coverPicture?: string;
  whatsappContact?: string;
  skype?: string;
  websiteLink?: string;
}

export interface AdminUserRole {
  _id: string;
  name: string;
  displayName: string;
  color?: string;
  permissions: string[];
}

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  newUsersToday: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  twoFactorEnabledUsers: number;
  usersWithTwoFactor: number;
  averageLoginFrequency: number;
  topCountries: CountryStats[];
  topCities: CityStats[];
  userGrowthChart: AdminChartData[];
  registrationTrend: AdminChartData[];
  statusDistribution: StatusDistribution[];
  roleDistribution: RoleDistribution[];
  recentActivities: UserActivity[];
}

export interface CountryStats {
  country: string;
  count: number;
  percentage: number;
}

export interface CityStats {
  city: string;
  country: string;
  count: number;
  percentage: number;
}

// ChartData moved to shared.types.ts as AdminChartData

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RoleDistribution {
  roleName: string;
  roleColor: string;
  count: number;
  userCount: number;
  percentage: number;
}

export interface UserActivity {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  metadata: any;
  createdAt: Date;
}

export interface AdminUserFilters {
  search?: string;
  status?: string;
  role?: string;
  country?: string;
  city?: string;
  emailConfirmed?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  lastLoginFrom?: Date;
  lastLoginTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAdminUserDto {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  roles?: string[];
  status?: string;
  country?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateAdminUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  roles?: string[];
  country?: string;
  city?: string;
  timezone?: string;
  language?: string;
  emailConfirmed?: boolean;
  phoneConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  metadata?: any;
}

export interface BulkActionDto {
  action: 'activate' | 'deactivate' | 'suspend' | 'ban' | 'delete' | 'assign_role' | 'remove_role';
  userIds: string[];
  data?: {
    roleId?: string;
    reason?: string;
    [key: string]: any;
  };
}

export interface AdminUsersStateModel {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  stats: AdminUserStats | null;
  filters: AdminUserFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
