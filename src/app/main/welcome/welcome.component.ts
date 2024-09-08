import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileModel, UserProfileState } from 'src/app/shared/store';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>
  constructor() { }

  ngOnInit(): void {
  }

}
