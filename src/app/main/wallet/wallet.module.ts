import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { WalletDashboardComponent } from './wallet-dashboard/wallet-dashboard.component';
import { WithdrawalModalComponent } from './components/withdrawal-modal/withdrawal-modal.component';

const routes: Routes = [
  { path: '', component: WalletDashboardComponent },
];

@NgModule({
  declarations: [
    WalletDashboardComponent,
    WithdrawalModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes),
  ],
})
export class WalletModule {}
