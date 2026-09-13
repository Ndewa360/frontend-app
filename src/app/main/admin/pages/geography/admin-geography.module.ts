import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { AdminSharedModule } from '../../admin-shared.module';
import { AdminGeographyComponent } from './admin-geography.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule,
    SharedModule,
    AdminSharedModule,
    AdminGeographyComponent
  ]
})
export class AdminGeographyModule { }