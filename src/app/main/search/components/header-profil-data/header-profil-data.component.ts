import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store';

@Component({
  selector: 'header-profil-data',
  templateUrl: './header-profil-data.component.html',
  styleUrls: ['./header-profil-data.component.css']
})
export class HeaderProfilDataComponent {
  constructor(private _store:Store){}

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  logout()
  {
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true))
  }
}
