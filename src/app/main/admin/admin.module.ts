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
import { AgentManagementComponent } from './pages/agent-management/agent-management.component';
import { CountrySelectionModalComponent } from './components/country-selection-modal/country-selection-modal.component';
import { CountryDeleteModalComponent } from './components/country-delete-modal/country-delete-modal.component';
import { CountryViewModalComponent } from './components/country-view-modal/country-view-modal.component';
import { CountryEditModalComponent } from './components/country-edit-modal/country-edit-modal.component';
import { CitySelectionModalComponent } from './components/city-selection-modal/city-selection-modal.component';
import { CityDeleteModalComponent } from './components/city-delete-modal/city-delete-modal.component';

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
import { RestCountriesService } from './services/rest-countries.service';

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
    AdminSettingsComponent,
    AgentManagementComponent,
    CountrySelectionModalComponent,
    CountryDeleteModalComponent,
    CountryViewModalComponent,
    CountryEditModalComponent,
    CitySelectionModalComponent,
    CityDeleteModalComponent
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
    AdminDashboardService,
    RestCountriesService
  ]
})
export class AdminModule { }
