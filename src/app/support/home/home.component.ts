import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel } from 'src/app/shared/store';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  routerLink="/auth/signin?returnUrl=/app/properties/home"
  constructor(
    private _router:Router
  ){}
  ngOnInit(): void {
    this.userProfil$.subscribe((user)=>{if(user) this.routerLink="/app/properties"})
  }

  goToCreateHome()
  {
    this._router.navigateByUrl(this.routerLink);
  }
}
