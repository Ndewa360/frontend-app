import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { AdminSubscriptionsComponent } from './admin-subscriptions.component';
import { AdminSharedModule } from '../../admin-shared.module';

@NgModule({
  declarations: [AdminSubscriptionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule,
    SharedModule,
    AdminSharedModule,
  ],
})
export class AdminSubscriptionsModule { }