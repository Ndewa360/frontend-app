import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AppTab } from 'src/@youpez';
import { LocataireModel, UserProfileModel, UserProfileState } from 'src/app/shared/store';
import { Location } from '@angular/common';

@Component({
  selector: 'user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit{
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>;
  @Select(UserProfileState.selectStateLoading) profileStateLoading$:Observable<boolean>

  public tabs: AppTab[] = []
  title = 'Page de profil'
  locataire:LocataireModel=null;
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store,
    private location: Location
  ){}

  ngOnInit(): void {

    this.tabs = [
      {
        name: 'Profil',
        url: `/app/profile/infos`,
      },       
    ]
  }

  goBack() {
    this.location.back();
  }
}
