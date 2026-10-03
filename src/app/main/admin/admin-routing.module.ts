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
        loadComponent: () => import('./pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        data: { title: 'ADMIN.PAGE_TITLES.DASHBOARD', breadcrumb: 'ADMIN.BREADCRUMBS.DASHBOARD' }
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/admin-users.component').then(m => m.AdminUsersComponent),
        data: { title: 'ADMIN.PAGE_TITLES.USERS', breadcrumb: 'ADMIN.BREADCRUMBS.USERS' }
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/user-details/user-details.component').then(m => m.UserDetailsComponent),
        data: { title: 'ADMIN.PAGE_TITLES.USER_DETAILS', breadcrumb: 'ADMIN.BREADCRUMBS.USER_DETAILS' }
      },
      {
        path: 'roles',
        loadComponent: () => import('./pages/roles/admin-roles.component').then(m => m.AdminRolesComponent),
        data: { title: 'ADMIN.PAGE_TITLES.ROLES', breadcrumb: 'ADMIN.BREADCRUMBS.ROLES' }
      },
      {
        path: 'geography',
        loadComponent: () => import('./pages/geography/admin-geography.component').then(m => m.AdminGeographyComponent),
        data: { title: 'ADMIN.PAGE_TITLES.GEOGRAPHY', breadcrumb: 'ADMIN.BREADCRUMBS.GEOGRAPHY' }
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/admin-payments.component').then(m => m.AdminPaymentsComponent),
        data: { title: 'ADMIN.PAGE_TITLES.PAYMENTS', breadcrumb: 'ADMIN.BREADCRUMBS.PAYMENTS' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        data: { title: 'ADMIN.PAGE_TITLES.SETTINGS', breadcrumb: 'ADMIN.BREADCRUMBS.SETTINGS' }
      },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agent-management/agent-management.component').then(m => m.AgentManagementComponent),
        data: { title: 'ADMIN.PAGE_TITLES.AGENTS', breadcrumb: 'ADMIN.BREADCRUMBS.AGENTS' }
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./pages/subscriptions/admin-subscriptions.component').then(m => m.AdminSubscriptionsComponent),
        data: { title: 'ADMIN.PAGE_TITLES.SUBSCRIPTIONS', breadcrumb: 'ADMIN.BREADCRUMBS.SUBSCRIPTIONS' }
      },
      {
        path: 'platform-finance',
        loadComponent: () => import('./pages/platform-finance/platform-finance.component').then(m => m.PlatformFinanceComponent),
        data: { title: 'Super Wallet Plateforme', breadcrumb: 'Wallet Plateforme' }
      },
      {
        path: 'breach',
        loadComponent: () => import('./pages/breach/admin-breach.component').then(m => m.AdminBreachComponent),
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