import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';

import { SearchRoutingModule } from './search-routing.module';
import { SearchPageComponent } from './search-page';
import { SharedModule } from './../../shared/shared.module';
import { UnitDetailDialogComponent } from './components/unit-detail-dialog/unit-detail-dialog.component';

@NgModule({
  declarations: [
    SearchPageComponent,
    UnitDetailDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SearchRoutingModule,
    OverlayModule
  ]
})
export class SearchModule { }
