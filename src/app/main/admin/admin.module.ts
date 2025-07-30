import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



// NGXS Store
import { NgxsModule } from '@ngxs/store';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// Admin Components
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminRolesComponent } from './pages/roles/admin-roles.component';
import { AdminGeographyComponent } from './pages/geography/admin-geography.component';
import { AdminPaymentsComponent } from './pages/payments/admin-payments.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';

// Admin Stores
import { AdminUsersState } from './store/users/admin-users.state';
import { AdminRolesState } from './store/roles/admin-roles.state';
import { AdminGeographyState } from './store/geography/admin-geography.state';
import { AdminPaymentsState } from './store/payments/admin-payments.state';
import { AdminSettingsState } from './store/settings/admin-settings.state';
import { AdminDashboardState } from './store/dashboard/admin-dashboard.state';

// Admin Services
import { AdminUsersService } from './services/admin-users.service';
import { AdminRolesService } from './services/admin-roles.service';
import { AdminGeographyService } from './services/admin-geography.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

// Admin Routing
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminRolesComponent,
    AdminGeographyComponent,
    AdminPaymentsComponent,
    AdminSettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AdminRoutingModule,
    
    
    // NGXS Store Modules
    NgxsModule.forFeature([
      AdminUsersState,
      AdminRolesState,
      AdminGeographyState,
      AdminPaymentsState,
      AdminSettingsState,
      AdminDashboardState
    ])
  ],
  providers: [
    AdminUsersService,
    AdminRolesService,
    AdminGeographyService,
    AdminPaymentsService,
    AdminSettingsService,
    AdminDashboardService
  ]
})
export class AdminModule { }
