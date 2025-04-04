import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store';

@Component({
  selector: 'landing-header-profil-data',
  templateUrl: './landing-header-profil-data.component.html',
  styleUrls: ['./landing-header-profil-data.component.css']
})
export class LandingHeaderProfilDataComponent {
  constructor(private _store:Store){}

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  logout()
  {
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true))
  }
}
