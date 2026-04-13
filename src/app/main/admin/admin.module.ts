import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule } from '@ngxs/store';
import { SharedModule } from '../../shared/shared.module';

// ── Pages ────────────────────────────────────────────────────────────────────
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { UserDetailsComponent } from './pages/user-details/user-details.component';
import { AdminRolesComponent } from './pages/roles/admin-roles.component';
import { AdminGeographyComponent } from './pages/geography/admin-geography.component';
import { AdminPaymentsComponent } from './pages/payments/admin-payments.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';
import { AgentManagementComponent } from './pages/agent-management/agent-management.component';
import { AdminSubscriptionsComponent } from './pages/subscriptions/admin-subscriptions.component';

// ── Modals / Components ───────────────────────────────────────────────────────
import { CountrySelectionModalComponent } from './components/country-selection-modal/country-selection-modal.component';
import { CountryDeleteModalComponent } from './components/country-delete-modal/country-delete-modal.component';
import { CountryViewModalComponent } from './components/country-view-modal/country-view-modal.component';
import { CountryEditModalComponent } from './components/country-edit-modal/country-edit-modal.component';
import { CitySelectionModalComponent } from './components/city-selection-modal/city-selection-modal.component';
import { CityDeleteModalComponent } from './components/city-delete-modal/city-delete-modal.component';
import { SubscriptionDetailsModalComponent } from './components/subscription-details-modal/subscription-details-modal.component';

// ── NGXS States ───────────────────────────────────────────────────────────────
import { AdminUsersState } from './store/users/admin-users.state';
import { AdminRolesState } from './store/roles/admin-roles.state';
import { AdminGeographyState } from './store/geography/admin-geography.state';
import { AdminPaymentsState } from './store/payments/admin-payments.state';
import { AdminSettingsState } from './store/settings/admin-settings.state';
import { AdminDashboardState } from './store/dashboard/admin-dashboard.state';
import { AdminSubscriptionsState } from './store/subscriptions/admin-subscriptions.state';

// ── Services ──────────────────────────────────────────────────────────────────
import { AdminUsersService } from './services/admin-users.service';
import { AdminRolesService } from './services/admin-roles.service';
import { AdminGeographyService } from './services/admin-geography.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminSubscriptionsService } from './services/admin-subscriptions.service';
import { RestCountriesService } from './services/rest-countries.service';

// ── Routing ───────────────────────────────────────────────────────────────────
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    UserDetailsComponent,
    AdminRolesComponent,
    AdminGeographyComponent,
    AdminPaymentsComponent,
    AdminSettingsComponent,
    AgentManagementComponent,
    AdminSubscriptionsComponent,
    CountrySelectionModalComponent,
    CountryDeleteModalComponent,
    CountryViewModalComponent,
    CountryEditModalComponent,
    CitySelectionModalComponent,
    CityDeleteModalComponent,
    SubscriptionDetailsModalComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AdminRoutingModule,
    MatDialogModule,
    NgxsModule.forFeature([
      AdminUsersState,
      AdminRolesState,
      AdminGeographyState,
      AdminPaymentsState,
      AdminSettingsState,
      AdminDashboardState,
      AdminSubscriptionsState,
    ]),
  ],
  providers: [
    AdminUsersService,
    AdminRolesService,
    AdminGeographyService,
    AdminPaymentsService,
    AdminSettingsService,
    AdminDashboardService,
    AdminSubscriptionsService,
    RestCountriesService,
  ],
})
export class AdminModule {}
