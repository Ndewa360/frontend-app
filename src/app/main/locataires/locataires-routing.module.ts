import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocatairePageComponent } from './locataire-page/locataire-page.component';
import { LocataireProfilComponent } from './components/locataire-profil/locataire-profil.component';
import { LocataireRoomListComponent } from './components/locataire-room-list/locataire-room-list.component';
import { HistoryPaymentComponent } from './components/history-payment/history-payment.component';
import { LoadingLocataireDataResolver } from 'src/app/shared/resolvers/loading-property-data/loading-locataire-data-resolver.service';
import { HistoryRoomComponent } from './components/history-room/history-room.component';
import { HistoryComponent } from './components/history/history.component';
import { ShowContractComponent } from '../contract/components/show-contract/show-contract.component';

const routes: Routes = [
  { path: ':locataireID', 
    component: LocatairePageComponent,
    resolve:{
      data:LoadingLocataireDataResolver
    },
    children: [
      { path: 'profil', component: LocataireProfilComponent },
      { path: 'history', component: HistoryComponent },
      // {  path: 'contract/:locationID', component: ShowContractComponent }
      // { path: '**', redirectTo: 'profil', pathMatch: 'full' }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocatairesRoutingModule { }
