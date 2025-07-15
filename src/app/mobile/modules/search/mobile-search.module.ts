import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobileSearchRoutingModule } from './mobile-search-routing.module';

// Components
import { MobileSearchPageComponent } from './pages/mobile-search-page/mobile-search-page.component';
import { MobileUnitCardComponent } from './components/mobile-unit-card/mobile-unit-card.component';
import { MobileSearchFiltersComponent } from './components/mobile-search-filters/mobile-search-filters.component';
import { MobileUnitDetailsComponent } from './components/mobile-unit-details/mobile-unit-details.component';
import { MobileMapViewComponent } from './components/mobile-map-view/mobile-map-view.component';

// Shared Mobile Components
import { MobileModule } from '../../mobile.module';

@NgModule({
  declarations: [
    MobileSearchPageComponent,
    MobileUnitCardComponent,
    MobileSearchFiltersComponent,
    MobileUnitDetailsComponent,
    MobileMapViewComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobileSearchRoutingModule,
    MobileModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileSearchModule { }
