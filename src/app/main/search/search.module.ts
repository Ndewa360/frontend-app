import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchPageComponent } from './search-page/search-page.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LayoutComponent } from './components/layout/layout.component';
import { SharedModule } from './../../shared/shared.module';
import { FilterZoneComponent } from './components/filter-zone/filter-zone.component';
import { RoomFilteredFoundComponent } from './components/room-filtered-found/room-filtered-found.component';

@NgModule({
  declarations: [
    SearchPageComponent,
    FooterComponent,
    NavbarComponent,
    LayoutComponent,
    FilterZoneComponent,
    RoomFilteredFoundComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SearchRoutingModule
  ]
})
export class SearchModule { }
