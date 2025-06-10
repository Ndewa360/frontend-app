import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocatairesRoutingModule } from './locataires-routing.module';
import { LocatairePageComponent } from './locataire-page/locataire-page.component';
import { LocataireProfilComponent } from './components/locataire-profil/locataire-profil.component';
import { LocataireRoomListComponent } from './components/locataire-room-list/locataire-room-list.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { HistoryPaymentComponent } from './components/history-payment/history-payment.component';
import { HistoryRoomComponent } from './components/history-room/history-room.component';
import { HistoryComponent } from './components/history/history.component';
import { ContractModule } from '../contract/contract.module';
import { UpdateLocataireComponent } from './components/update-locataire/update-locataire.component';


@NgModule({
  declarations: [
    LocatairePageComponent,
    LocataireProfilComponent,
    LocataireRoomListComponent,
    HistoryPaymentComponent,
    HistoryRoomComponent,
    HistoryComponent,
    UpdateLocataireComponent
  ],
  imports: [
    CommonModule,
    LocatairesRoutingModule,
    SharedModule,
  ],
  exports:[
    UpdateLocataireComponent
  ]
})
export class LocatairesModule { }
