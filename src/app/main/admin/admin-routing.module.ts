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
          title: 'Tableau de bord',
          breadcrumb: 'Dashboard'
        }
      },
      {
        path: 'users',
        component: AdminUsersComponent,
        data: {
          title: 'Gestion des utilisateurs',
          breadcrumb: 'Utilisateurs'
        }
      },
      {
        path: 'roles',
        component: AdminRolesComponent,
        data: {
          title: 'Rôles et permissions',
          breadcrumb: 'Rôles'
        }
      },
      {
        path: 'geography',
        component: AdminGeographyComponent,
        data: {
          title: 'Gestion géographique',
          breadcrumb: 'Géographie'
        }
      },
      {
        path: 'payments',
        component: AdminPaymentsComponent,
        data: {
          title: 'Gestion des paiements',
          breadcrumb: 'Paiements'
        }
      },
      {
        path: 'settings',
        component: AdminSettingsComponent,
        data: {
          title: 'Paramètres système',
          breadcrumb: 'Paramètres'
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
