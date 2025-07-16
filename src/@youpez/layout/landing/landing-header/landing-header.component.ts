import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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

  /**
   * Fermer le menu mobile quand on redimensionne vers desktop
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 768 && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  navigateToSearchPage()
  {
    this.router.navigate(
      ['/search/index'],
      { queryParams: { ville:"Bangangté"} }
    );
  }
}
