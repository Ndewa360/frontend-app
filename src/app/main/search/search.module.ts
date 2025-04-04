import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchPageComponent } from './search-page/search-page.component';
import { SharedModule } from './../../shared/shared.module';
import { FilterZoneComponent } from './components/filter-zone/filter-zone.component';
import { RoomFilteredFoundComponent } from './components/room-filtered-found/room-filtered-found.component';
import { RoomPageOverviewComponent } from './components/room-page-overview/room-page-overview.component';
import { ContactProprietaireComponent } from './components/contact-proprietaire/contact-proprietaire.component';
import { RoomAssociatedComponent } from './components/room-associated/room-associated.component';

@NgModule({
  declarations: [
    SearchPageComponent,
    FilterZoneComponent,
    RoomFilteredFoundComponent,
    RoomPageOverviewComponent,
    ContactProprietaireComponent,
    RoomAssociatedComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SearchRoutingModule
  ]
})
export class SearchModule { }
