import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignLocationComponent } from './assign-location/assign-location.component';

const routes: Routes = [
  {
    path: '',
    component: AssignLocationComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssignLocationRoutingModule { }
