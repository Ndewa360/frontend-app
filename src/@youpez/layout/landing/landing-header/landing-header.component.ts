import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, AuthTokenState } from 'src/app/shared/store';

@Component({
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.scss']
})
export class LandingHeaderComponent implements OnInit {
  isMenuOpen=false;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  @Select(AuthTokenState.selectStateUserIsLogin)  isLogin$:Observable<boolean>

  constructor(
    private router:Router
  ) { }
  
  ngOnInit(): void {
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToSearchPage()
  {
    // 
    this.router.navigate(
      ['/search/index'],
      { queryParams: { minPrice: 0,maxPrix:100000,  ville:"Bangangté"} }
    );
  }
}
