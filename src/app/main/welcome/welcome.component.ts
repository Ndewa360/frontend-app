import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileModel, UserProfileState } from 'src/app/shared/store';
import { TranslatePipe } from '@ngx-translate/core';
import { ListModule } from 'carbon-components-angular';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: true,
  imports: [
    NgScrollbar,
    FlexModule,
    AppLogoComponent,
    NgIf,
    RouterLink,
    ListModule,
    NgFor,
    AsyncPipe,
    TranslatePipe
  ]
})
export class WelcomeComponent implements OnInit {
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>;
  
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
