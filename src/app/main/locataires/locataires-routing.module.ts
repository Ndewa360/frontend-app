import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocatairePageComponent } from './locataire-page/locataire-page.component';
import { LocataireProfilComponent } from './components/locataire-profil/locataire-profil.component';
import { LocataireRoomListComponent } from './components/locataire-room-list/locataire-room-list.component';

const routes: Routes = [
  { path: ':locataireID', 
    component: LocatairePageComponent,
    children: [
      { path: 'profil', component: LocataireProfilComponent },
      { path: 'rooms', component: LocataireRoomListComponent },
      { path: '**', redirectTo: 'profil', pathMatch: 'full' }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocatairesRoutingModule { }
