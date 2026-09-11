import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxsModule } from '@ngxs/store';
import { SharedModule } from '../../shared/shared.module';

// ── Layout ───────────────────────────────────────────────────────────────────
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';

// ── NGXS States ───────────────────────────────────────────────────────────────
import { AdminUsersState } from './store/users/admin-users.state';
import { AdminRolesState } from './store/roles/admin-roles.state';
import { AdminGeographyState } from './store/geography/admin-geography.state';
import { AdminPaymentsState } from './store/payments/admin-payments.state';
import { AdminSettingsState } from './store/settings/admin-settings.state';
import { AdminDashboardState } from './store/dashboard/admin-dashboard.state';
import { AdminSubscriptionsState } from './store/subscriptions/admin-subscriptions.state';
import { PlatformFinanceState } from './store/platform-finance/platform-finance.state';

import { AdminBreachState } from './store/breach/admin-breach.state';

// ── Services ──────────────────────────────────────────────────────────────────
import { AdminUsersService } from './services/admin-users.service';
import { AdminRolesService } from './services/admin-roles.service';
import { AdminGeographyService } from './services/admin-geography.service';
import { AdminPaymentsService } from './services/admin-payments.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminSubscriptionsService } from './services/admin-subscriptions.service';
import { AdminPlatformFinanceService } from './services/admin-platform-finance.service';
import { AdminBreachService } from './services/admin-breach.service';
import { RestCountriesService } from './services/rest-countries.service';

// ── Routing ───────────────────────────────────────────────────────────────────
import { AdminRoutingModule } from './admin-routing.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    AdminRoutingModule,
    NgxsModule.forFeature([
      AdminUsersState,
      AdminRolesState,
      AdminGeographyState,
      AdminPaymentsState,
      AdminSettingsState,
      AdminDashboardState,
      AdminSubscriptionsState,
      PlatformFinanceState,
      AdminBreachState,
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
    AdminPlatformFinanceService,
    RestCountriesService,
    AdminBreachService,
  ],
})
export class AdminModule {}