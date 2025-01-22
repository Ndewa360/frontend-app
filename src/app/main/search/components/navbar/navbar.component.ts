import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileModel, UserProfileState,AuthTokenState } from 'src/app/shared/store';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']

})
export class NavbarComponent implements OnInit {
  isMenuOpen=false;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  @Select(AuthTokenState.selectStateUserIsLogin)  isLogin$:Observable<boolean>

  constructor() { }
  
  ngOnInit(): void {
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
