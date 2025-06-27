import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Components
import { MonitoringDashboardComponent } from './monitoring-dashboard/monitoring-dashboard.component';
import { ErrorManagementComponent } from './error-management/error-management.component';
import { ErrorDetailsDialogComponent } from './error-management/error-details-dialog/error-details-dialog.component';
import { SystemHealthComponent } from './system-health/system-health.component';
import { MonitoringAnalyticsComponent } from './monitoring-analytics/monitoring-analytics.component';

// Guards
import { AuthGuard } from '../shared/guard/auth-guard';

// Routes
const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: MonitoringDashboardComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Monitoring Dashboard',
      breadcrumb: 'Dashboard'
    }
  },
  {
    path: 'errors',
    component: ErrorManagementComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Gestion des Erreurs',
      breadcrumb: 'Erreurs'
    }
  },
  {
    path: 'system',
    component: SystemHealthComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Santé du Système',
      breadcrumb: 'Système'
    }
  },
  {
    path: 'analytics',
    component: MonitoringAnalyticsComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Analytics',
      breadcrumb: 'Analytics'
    }
  }
];

@NgModule({
  declarations: [
    MonitoringDashboardComponent,
    ErrorManagementComponent,
    ErrorDetailsDialogComponent,
    SystemHealthComponent,
    MonitoringAnalyticsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgScrollbarModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    MonitoringDashboardComponent,
    ErrorManagementComponent,
    SystemHealthComponent,
    MonitoringAnalyticsComponent
  ]
})
export class MonitoringModule { }
