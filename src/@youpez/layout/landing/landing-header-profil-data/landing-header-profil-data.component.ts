import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store';
import { Actions,Select, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import {Router} from "@angular/router"

@Component({
  selector: 'landing-header-profil-data',
  templateUrl: './landing-header-profil-data.component.html',
  styleUrls: ['./landing-header-profil-data.component.css']
})
export class LandingHeaderProfilDataComponent implements OnInit{
  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private router: Router,
){}

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  ngOnInit(): void {
    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.LogoutUserProfile)).subscribe((value)=>{
      this.router.navigate(['/auth/signin']);
      }
    );
  }

  logout()
  {
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true))
  }
}
