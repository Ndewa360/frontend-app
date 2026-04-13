import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from '../../shared/guard/auth-guard';
import { AdminGuard } from './guards/admin.guard';

// Components
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminRolesComponent } from './pages/roles/admin-roles.component';
import { AdminGeographyComponent } from './pages/geography/admin-geography.component';
import { AdminPaymentsComponent } from './pages/payments/admin-payments.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';
import { UserDetailsComponent } from './pages/user-details/user-details.component';
import { AgentManagementComponent } from './pages/agent-management/agent-management.component';
import { AdminSubscriptionsComponent } from './pages/subscriptions/admin-subscriptions.component';
import { PlatformFinanceComponent } from './pages/platform-finance/platform-finance.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [      
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.DASHBOARD',
          breadcrumb: 'ADMIN.BREADCRUMBS.DASHBOARD'
        }
      },
      {
        path: 'users',
        component: AdminUsersComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.USERS',
          breadcrumb: 'ADMIN.BREADCRUMBS.USERS'
        }
      },
      {
        path: 'users/:id',
        component: UserDetailsComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.USER_DETAILS',
          breadcrumb: 'ADMIN.BREADCRUMBS.USER_DETAILS'
        }
      },
      {
        path: 'roles',
        component: AdminRolesComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.ROLES',
          breadcrumb: 'ADMIN.BREADCRUMBS.ROLES'
        }
      },
      {
        path: 'geography',
        component: AdminGeographyComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.GEOGRAPHY',
          breadcrumb: 'ADMIN.BREADCRUMBS.GEOGRAPHY'
        }
      },
      {
        path: 'payments',
        component: AdminPaymentsComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.PAYMENTS',
          breadcrumb: 'ADMIN.BREADCRUMBS.PAYMENTS'
        }
      },
      {
        path: 'settings',
        component: AdminSettingsComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.SETTINGS',
          breadcrumb: 'ADMIN.BREADCRUMBS.SETTINGS'
        }
      },
      {
        path: 'agents',
        component: AgentManagementComponent,
        data: {
          title: 'ADMIN.PAGE_TITLES.AGENTS',
          breadcrumb: 'ADMIN.BREADCRUMBS.AGENTS'
        }
      },
      {
        path: 'subscriptions',
        component: AdminSubscriptionsComponent,
        data: { title: 'ADMIN.PAGE_TITLES.SUBSCRIPTIONS', breadcrumb: 'ADMIN.BREADCRUMBS.SUBSCRIPTIONS' }
      },
      {
        path: 'platform-finance',
        component: PlatformFinanceComponent,
        data: { title: 'Super Wallet Plateforme', breadcrumb: 'Wallet Plateforme' }
      },
      {
        path: 'monitoring',
        loadChildren: () => import('../../monitoring/monitoring.module').then(m => m.MonitoringModule),
        data: {
          title: 'ADMIN.PAGE_TITLES.MONITORING',
          breadcrumb: 'ADMIN.BREADCRUMBS.MONITORING'
        }
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
