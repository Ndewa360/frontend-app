import {Component, OnInit} from '@angular/core'
import {DomSanitizer} from '@angular/platform-browser'
import { Observable } from 'rxjs'
import { Select, Store } from '@ngxs/store'
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-getting-started',
  templateUrl: './getting-started.component.html',
  styleUrls: ['./getting-started.component.css']
})
export class GettingStartedComponent implements OnInit {
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  public videos: any[] = [];

  private buildVideosData() {
    return [
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.TOPIC'),
      url: 'https://www.youtube.com/embed/F4xu5FXW62k',
      seen: true,
      steps: [],
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.INTRODUCTION.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.TOPIC'),
      url: 'https://www.youtube.com/embed/gyin31wzg4Q',
      seen: true,
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.ACCOUNT_CREATION.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.PROPERTY_ADDITION.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.PROPERTY_ADDITION.TOPIC'),
      url: 'https://www.youtube.com/embed/WBhNszyc_Ks',
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.PROPERTY_ADDITION.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.PROPERTY_ADDITION.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.PROPERTY_ADDITION.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.UNIT_ADDITION.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.UNIT_ADDITION.TOPIC'),
      url: 'https://www.youtube.com/embed/7rkeORD4jSw',
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.UNIT_ADDITION.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.UNIT_ADDITION.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.UNIT_ADDITION.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ADDITION.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ADDITION.TOPIC'),
      url: 'https://www.youtube.com/embed/Bsq5cKkS33I',
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ADDITION.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ADDITION.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ADDITION.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ASSIGNMENT.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ASSIGNMENT.TOPIC'),
      url: 'https://www.youtube.com/embed/PH-2FfFD2PU',
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ASSIGNMENT.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ASSIGNMENT.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.TENANT_ASSIGNMENT.INFO'),
    },
    {
      title: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.FINANCIAL_ANALYSIS.TITLE'),
      topic: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.FINANCIAL_ANALYSIS.TOPIC'),
      url: 'https://www.youtube.com/embed/PH-2FfFD2PU',
      steps: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.FINANCIAL_ANALYSIS.STEPS'),
      page: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.FINANCIAL_ANALYSIS.PAGE'),
      info: this.translate.instant('SUPPORT.GETTING_STARTED.VIDEOS.FINANCIAL_ANALYSIS.INFO'),
    }
  ];
  }

  constructor(
    private sanitizer: DomSanitizer,
    private location: Location,
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.videos = this.buildVideosData();
    this.translate.onLangChange.subscribe(() => {
      this.videos = this.buildVideosData();
    });
  }

  getUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }

  trackByFn(index, row) {
    return row.title
  }

  goBack()
    {
      // Naviguer vers la page d'accueil du support avec la langue courante
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/support/welcome`]);
    }
}