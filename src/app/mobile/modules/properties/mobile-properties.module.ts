import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobilePropertiesRoutingModule } from './mobile-properties-routing.module';

// Pages
import { MobilePropertiesListPageComponent } from './pages/mobile-properties-list-page/mobile-properties-list-page.component';
import { MobilePropertyDetailsPageComponent } from './pages/mobile-property-details-page/mobile-property-details-page.component';
import { MobileAddPropertyPageComponent } from './pages/mobile-add-property-page/mobile-add-property-page.component';
import { MobilePropertyUnitsPageComponent } from './pages/mobile-property-units-page/mobile-property-units-page.component';

// Components
import { MobilePropertyCardComponent } from './components/mobile-property-card/mobile-property-card.component';
import { MobileUnitManagementComponent } from './components/mobile-unit-management/mobile-unit-management.component';
import { MobilePropertyStatsComponent } from './components/mobile-property-stats/mobile-property-stats.component';
import { MobilePropertyFormComponent } from './components/mobile-property-form/mobile-property-form.component';
import { MobileMediaGalleryComponent } from './components/mobile-media-gallery/mobile-media-gallery.component';

// Shared Mobile Components


@NgModule({
  declarations: [
    // Pages
    MobilePropertiesListPageComponent,
    MobilePropertyDetailsPageComponent,
    MobileAddPropertyPageComponent,
    MobilePropertyUnitsPageComponent,
    
    // Components
    MobilePropertyCardComponent,
    MobileUnitManagementComponent,
    MobilePropertyStatsComponent,
    MobilePropertyFormComponent,
    MobileMediaGalleryComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobilePropertiesRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobilePropertiesModule { }
