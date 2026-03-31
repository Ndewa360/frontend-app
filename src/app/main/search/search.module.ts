import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';

import { SearchRoutingModule } from './search-routing.module';
import { SearchPageComponent } from './search-page';
import { SharedModule } from './../../shared/shared.module';
import { UnitDetailDialogComponent } from './components/unit-detail-dialog/unit-detail-dialog.component';
import { PremiumAccessModalComponent } from './components/premium-access-modal/premium-access-modal.component';
import { PremiumAccessButtonComponent } from './components/premium-access-button/premium-access-button.component';
import { PremiumSuccessComponent } from './components/premium-success/premium-success.component';

@NgModule({
  declarations: [
    SearchPageComponent,
    UnitDetailDialogComponent,
    PremiumAccessModalComponent,
    PremiumAccessButtonComponent,
    PremiumSuccessComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    SearchRoutingModule,
    OverlayModule,
  ]
})
export class SearchModule { }
