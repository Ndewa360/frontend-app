import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShowBiilingComponent } from './components/show-biiling/show-biiling.component';
import { LoadingLocataireDataResolver } from 'src/app/shared/resolvers';

const routes: Routes = [
  { path: ':locataireID/billing/:billingID', 
    component: ShowBiilingComponent,
    resolve:{
      data:LoadingLocataireDataResolver
    },
    
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BiilingRoutingModule { }
