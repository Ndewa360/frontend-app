import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Nouveaux modals modernes
import { ModernTenantModalComponent } from '../modern-tenant-modal/modern-tenant-modal.component';
import { ModernUnitModalComponent } from '../modern-unit-modal/modern-unit-modal.component';
import { ModernPaymentModalComponent } from '../modern-payment-modal/modern-payment-modal.component';
import { ModernDeletePaymentModalComponent } from '../modern-delete-payment-modal/modern-delete-payment-modal.component';
import { ModernContractTerminationModalComponent } from '../modern-contract-termination-modal/modern-contract-termination-modal.component';
import { ModernDeleteTenantModalComponent } from '../modern-delete-tenant-modal/modern-delete-tenant-modal.component';
import { ModernDeleteUnitModalComponent } from '../modern-delete-unit-modal/modern-delete-unit-modal.component';

@NgModule({
  declarations: [
    ModernTenantModalComponent,
    ModernUnitModalComponent,
    ModernPaymentModalComponent,
    ModernDeletePaymentModalComponent,
    ModernContractTerminationModalComponent,
    ModernDeleteTenantModalComponent,
    ModernDeleteUnitModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [
    ModernTenantModalComponent,
    ModernUnitModalComponent,
    ModernPaymentModalComponent,
    ModernDeletePaymentModalComponent,
    ModernContractTerminationModalComponent,
    ModernDeleteTenantModalComponent,
    ModernDeleteUnitModalComponent
  ]
})
export class ModernModalsModule { }
