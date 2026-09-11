import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

import { CountrySelectionModalComponent } from './components/country-selection-modal/country-selection-modal.component';
import { CountryDeleteModalComponent } from './components/country-delete-modal/country-delete-modal.component';
import { CountryViewModalComponent } from './components/country-view-modal/country-view-modal.component';
import { CountryEditModalComponent } from './components/country-edit-modal/country-edit-modal.component';
import { CitySelectionModalComponent } from './components/city-selection-modal/city-selection-modal.component';
import { CityDeleteModalComponent } from './components/city-delete-modal/city-delete-modal.component';
import { SubscriptionDetailsModalComponent } from './components/subscription-details-modal/subscription-details-modal.component';

@NgModule({
  declarations: [
    CountrySelectionModalComponent,
    CountryDeleteModalComponent,
    CountryViewModalComponent,
    CountryEditModalComponent,
    CitySelectionModalComponent,
    CityDeleteModalComponent,
    SubscriptionDetailsModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    SharedModule,
  ],
  exports: [
    CountrySelectionModalComponent,
    CountryDeleteModalComponent,
    CountryViewModalComponent,
    CountryEditModalComponent,
    CitySelectionModalComponent,
    CityDeleteModalComponent,
    SubscriptionDetailsModalComponent,
  ],
})
export class AdminSharedModule { }