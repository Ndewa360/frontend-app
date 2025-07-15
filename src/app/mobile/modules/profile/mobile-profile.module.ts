import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobileProfileRoutingModule } from './mobile-profile-routing.module';

// Pages - Temporairement commentées
// import { MobileProfilePageComponent } from './pages/mobile-profile-page/mobile-profile-page.component';
// import { MobileEditProfilePageComponent } from './pages/mobile-edit-profile-page/mobile-edit-profile-page.component';
// import { MobileSettingsPageComponent } from './pages/mobile-settings-page/mobile-settings-page.component';
// import { MobileNotificationsPageComponent } from './pages/mobile-notifications-page/mobile-notifications-page.component';

// Components - Temporairement commentées
// import { MobileProfileHeaderComponent } from './components/mobile-profile-header/mobile-profile-header.component';
// import { MobileProfileStatsComponent } from './components/mobile-profile-stats/mobile-profile-stats.component';
// import { MobileProfileMenuComponent } from './components/mobile-profile-menu/mobile-profile-menu.component';
// import { MobileAvatarUploadComponent } from './components/mobile-avatar-upload/mobile-avatar-upload.component';

// Shared Mobile Components
import { MobileModule } from '../../mobile.module';

@NgModule({
  declarations: [
    // Pages - Temporairement vides
    // MobileProfilePageComponent,
    // MobileEditProfilePageComponent,
    // MobileSettingsPageComponent,
    // MobileNotificationsPageComponent,

    // Components - Temporairement vides
    // MobileProfileHeaderComponent,
    // MobileProfileStatsComponent,
    // MobileProfileMenuComponent,
    // MobileAvatarUploadComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobileProfileRoutingModule,
    MobileModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileProfileModule { }
