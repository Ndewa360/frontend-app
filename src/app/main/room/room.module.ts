import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomRoutingModule } from './room-routing.module';
import { UpdateRoomComponent } from './components/update-room/update-room.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { GaleryComponent } from './components/galery/galery.component';


@NgModule({
  declarations: [
    UpdateRoomComponent,
    GaleryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RoomRoutingModule
  ],
  exports:[
    UpdateRoomComponent,
    GaleryComponent
  ]
})
export class RoomModule { }
