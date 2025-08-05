import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxsModule } from '@ngxs/store';

// Translation
import { TranslateModule } from '@ngx-translate/core';


// Shared
import { SharedModule } from '../../../shared/shared.module';

// Routing
import { MobileSearchRoutingModule } from './mobile-search-routing.module';

// Store
import { SearchState, CityState } from '../../../shared/store';

// Components
import { MobileSearchPageComponent } from './pages/mobile-search-page/mobile-search-page.component';
import { MobileUnitCardComponent } from './components/mobile-unit-card/mobile-unit-card.component';
import { MobileSearchFiltersComponent } from './components/mobile-search-filters/mobile-search-filters.component';
import { MobileUnitDetailsComponent } from './components/mobile-unit-details/mobile-unit-details.component';
import { MobileMapViewComponent } from './components/mobile-map-view/mobile-map-view.component';

// Shared Mobile Components


// Services
import { MobileSearchStatsService } from '../../shared/services/mobile-search-stats.service';

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
    SharedModule,
    TranslateModule,
    NgxsModule.forFeature([SearchState, CityState]),
    MobileSearchRoutingModule
  ],
  providers: [
    MobileSearchStatsService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileSearchModule { }
