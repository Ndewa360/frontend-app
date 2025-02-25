import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProfileInfosComponent } from './components/user-profile-infos/user-profile-infos.component';

const routes: Routes = [
  { 
    path: '', 
    component: UserProfileComponent,
      children: [
        { path: 'infos', component: UserProfileInfosComponent },
        { path: '', redirectTo: 'infos', pathMatch: 'full' },
      ]
    },
    {
      path: '**',
      redirectTo: 'infos',
      pathMatch: 'full'
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
