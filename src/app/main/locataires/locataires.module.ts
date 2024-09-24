import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocatairesRoutingModule } from './locataires-routing.module';
import { LocatairePageComponent } from './locataire-page/locataire-page.component';
import { LocataireProfilComponent } from './components/locataire-profil/locataire-profil.component';
import { LocataireRoomListComponent } from './components/locataire-room-list/locataire-room-list.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    LocatairePageComponent,
    LocataireProfilComponent,
    LocataireRoomListComponent
  ],
  imports: [
    CommonModule,
    LocatairesRoutingModule,
    SharedModule
  ]
})
export class LocatairesModule { }
