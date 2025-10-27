import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileModel, UserProfileState } from 'src/app/shared/store';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  // encapsulation: ViewEncapsulation.None
})
export class WelcomeComponent implements OnInit {
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>
  
  guides = [
    { key: 'INTRODUCTION', durationKey: 'INTRODUCTION' },
    { key: 'ADVANCED_TOPICS', durationKey: 'ADVANCED_TOPICS' },
    { key: 'FINANCIAL_MANAGEMENT', durationKey: 'FINANCIAL_MANAGEMENT' },
    { key: 'LISTING_MANAGEMENT', durationKey: 'LISTING_MANAGEMENT' },
    { key: 'ADMINISTRATION', durationKey: 'ADMINISTRATION' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
