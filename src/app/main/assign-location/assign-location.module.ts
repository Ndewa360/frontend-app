import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignLocationComponent } from './assign-location/assign-location.component';
import { AssignLocationFormComponent } from './assign-location-form/assign-location-form.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AssignLocationRoutingModule } from './assig-location-routing.module';


@NgModule({
  declarations: [
    AssignLocationComponent,
    AssignLocationFormComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AssignLocationRoutingModule
  ],
  exports:[
    AssignLocationComponent,
    AssignLocationFormComponent
  ]
})
export class AssignLocationModule { }
