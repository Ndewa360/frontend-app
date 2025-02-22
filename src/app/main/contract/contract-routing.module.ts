import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ShowContractComponent } from './components/show-contract/show-contract.component';
import { LoadingContractDataResolver } from 'src/app/shared/resolvers';

const routes: Routes = [
  {
      path: 'location/:locationID/locataire/:locataireID', 
      component: ShowContractComponent,
      resolve:{
        data:LoadingContractDataResolver
      },
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SharedModule
  ],
  exports: [RouterModule]
})
export class ContractRoutingModule { }
