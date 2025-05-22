import { Component } from '@angular/core';
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

  ngOnInit(): void {
    // this.userProfil$.subscribe((user)=>{if(user) this.routingLink="/app/welcome"})
  }
}
