import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from '../../shared/guard/auth-guard';
import { AdminGuard } from './guards/admin.guard';

// Layout
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [      
      {
        path: 'dashboard',
        loadChildren: () => import('./pages/dashboard/admin-dashboard.module').then(m => m.AdminDashboardModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.DASHBOARD',
          breadcrumb: 'ADMIN.BREADCRUMBS.DASHBOARD'
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/admin-users.module').then(m => m.AdminUsersModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.USERS',
          breadcrumb: 'ADMIN.BREADCRUMBS.USERS'
        }
      },
      {
        path: 'users/:id',
        loadChildren: () => import('./pages/user-details/admin-user-details.module').then(m => m.AdminUserDetailsModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.USER_DETAILS',
          breadcrumb: 'ADMIN.BREADCRUMBS.USER_DETAILS'
        }
      },
      {
        path: 'roles',
        loadChildren: () => import('./pages/roles/admin-roles.module').then(m => m.AdminRolesModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.ROLES',
          breadcrumb: 'ADMIN.BREADCRUMBS.ROLES'
        }
      },
      {
        path: 'geography',
        loadChildren: () => import('./pages/geography/admin-geography.module').then(m => m.AdminGeographyModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.GEOGRAPHY',
          breadcrumb: 'ADMIN.BREADCRUMBS.GEOGRAPHY'
        }
      },
      {
        path: 'payments',
        loadChildren: () => import('./pages/payments/admin-payments.module').then(m => m.AdminPaymentsModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.PAYMENTS',
          breadcrumb: 'ADMIN.BREADCRUMBS.PAYMENTS'
        }
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/admin-settings.module').then(m => m.AdminSettingsModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.SETTINGS',
          breadcrumb: 'ADMIN.BREADCRUMBS.SETTINGS'
        }
      },
      {
        path: 'agents',
        loadChildren: () => import('./pages/agent-management/admin-agent-management.module').then(m => m.AdminAgentManagementModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.AGENTS',
          breadcrumb: 'ADMIN.BREADCRUMBS.AGENTS'
        }
      },
      {
        path: 'subscriptions',
        loadChildren: () => import('./pages/subscriptions/admin-subscriptions.module').then(m => m.AdminSubscriptionsModule),
        data: { title: 'ADMIN.PAGE_TITLES.SUBSCRIPTIONS', breadcrumb: 'ADMIN.BREADCRUMBS.SUBSCRIPTIONS' }
      },
      {
        path: 'platform-finance',
        loadChildren: () => import('./pages/platform-finance/admin-platform-finance.module').then(m => m.AdminPlatformFinanceModule),
        data: { title: 'Super Wallet Plateforme', breadcrumb: 'Wallet Plateforme' }
      },
      {
        path: 'breach',
        loadChildren: () => import('./pages/breach/admin-breach.module').then(m => m.AdminBreachModule),
        data: { title: 'Violations de données', breadcrumb: 'Violations de données' }
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }