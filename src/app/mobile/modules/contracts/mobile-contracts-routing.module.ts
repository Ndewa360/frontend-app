import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileContractsListPageComponent } from './pages/mobile-contracts-list-page/mobile-contracts-list-page.component';
// import { MobileContractDetailsPageComponent } from './pages/mobile-contract-details-page/mobile-contract-details-page.component';
// import { MobileCreateContractPageComponent } from './pages/mobile-create-contract-page/mobile-create-contract-page.component';

const routes: Routes = [
  {
    path: '',
    component: MobileContractsListPageComponent
  },
  // {
  //   path: 'create',
  //   component: MobileCreateContractPageComponent
  // },
  // {
  //   path: ':id',
  //   component: MobileContractDetailsPageComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileContractsRoutingModule { }
