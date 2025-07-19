import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Shared
import { SharedModule } from '../shared/shared.module';

// Routing
import { MobileRoutingModule } from './mobile-routing.module';

// Layout
import { MobileLayoutComponent } from './layout/mobile-layout.component';
import { MobileTabsComponent } from './layout/components/mobile-tabs/mobile-tabs.component';
import { MobileHeaderComponent } from './layout/components/mobile-header/mobile-header.component';

// Shared Mobile Components
import { MobileLoadingComponent } from './shared/components/mobile-loading/mobile-loading.component';
import { MobileErrorComponent } from './shared/components/mobile-error/mobile-error.component';
import { MobileEmptyStateComponent } from './shared/components/mobile-empty-state/mobile-empty-state.component';
import { MobileOfflineStatusComponent } from './shared/components/mobile-offline-status/mobile-offline-status.component';

// Services
import { MobileCacheService } from './shared/services/mobile-cache.service';
import { MobileSyncService } from './shared/services/mobile-sync.service';
import { MobileNotificationService } from './shared/services/mobile-notification.service';
import { MobilePushNotificationsService } from './shared/services/mobile-push-notifications.service';
import { MobileAuthStorageService } from './shared/services/mobile-auth-storage.service';
import { MobileOfflineManagerService } from './shared/services/mobile-offline-manager.service';
import { MobileSearchStatsService } from './shared/services/mobile-search-stats.service';

@NgModule({
  declarations: [
    // Layout
    MobileLayoutComponent,
    MobileTabsComponent,
    MobileHeaderComponent,

    // Shared Components
    MobileLoadingComponent,
    MobileErrorComponent,
    MobileEmptyStateComponent,
    MobileOfflineStatusComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MobileRoutingModule
  ],
  providers: [
    MobileCacheService,
    MobileSyncService,
    MobileNotificationService,
    MobilePushNotificationsService,
    MobileAuthStorageService,
    MobileOfflineManagerService,
    MobileSearchStatsService
  ],
  exports: [
    // Export shared components for use in child modules
    MobileLoadingComponent,
    MobileErrorComponent,
    MobileEmptyStateComponent,
    MobileOfflineStatusComponent,
    // Export TranslateModule for child modules
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileModule { }
