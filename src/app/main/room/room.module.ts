import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RoomRoutingModule } from './room-routing.module';
import { UpdateRoomComponent } from './components/update-room/update-room.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UpdateRoomComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RoomRoutingModule
  ],
  exports:[
    UpdateRoomComponent
  ]
})
export class RoomModule { }
