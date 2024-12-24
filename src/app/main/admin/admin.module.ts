import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'src/app/shared/shared.module';
import { UsersListComponent } from './components/users-list/users-list.component';
import { CountryCityListComponent } from './components/country-city-list/country-city-list.component';
import { CountryCityComponent } from './components/country-city/country-city.component';
import { AddCountryComponent } from './components/add-country/add-country.component';
import { AddCityComponent } from './components/add-city/add-city.component';


@NgModule({
  declarations: [
    AdminComponent,
    UsersListComponent,
    CountryCityListComponent,
    CountryCityComponent,
    AddCountryComponent,
    AddCityComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    CommonModule,
    SharedModule,
    NgxPrintModule
  ]
})
export class AdminModule { }
