import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchPageComponent, SearchPageRedesignedComponent } from './search-page';
import { SharedModule } from './../../shared/shared.module';
import { FilterZoneComponent } from './components/filter-zone/filter-zone.component';
import { RoomFilteredFoundComponent } from './components/room-filtered-found/room-filtered-found.component';
import { RoomPageOverviewComponent } from './components/room-page-overview/room-page-overview.component';
import { ContactProprietaireComponent } from './components/contact-proprietaire/contact-proprietaire.component';
import { RoomAssociatedComponent } from './components/room-associated/room-associated.component';
import { AdvancedSearchFiltersComponent, AdvancedSearchFiltersRedesignedComponent } from './components/advanced-search-filters';
import { SearchResultsWrapperComponent } from './components/search-results-wrapper/search-results-wrapper.component';
import { ModernSearchComponent } from './components/modern-search/modern-search.component';

@NgModule({
  declarations: [
    SearchPageComponent,
    SearchPageRedesignedComponent,
    FilterZoneComponent,
    RoomFilteredFoundComponent,
    RoomPageOverviewComponent,
    ContactProprietaireComponent,
    RoomAssociatedComponent,
    AdvancedSearchFiltersComponent,
    AdvancedSearchFiltersRedesignedComponent,
    SearchResultsWrapperComponent,
    ModernSearchComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SearchRoutingModule
  ]
})
export class SearchModule { }
