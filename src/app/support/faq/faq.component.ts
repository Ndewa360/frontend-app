import {Component, OnInit} from '@angular/core'
import { Select } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileState, UserProfileModel } from 'src/app/shared/store'
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  
  public faq: any[] = [];

  constructor(
    private location: Location,
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.buildFaqData();
    this.translate.onLangChange.subscribe(() => {
      this.buildFaqData();
    });
  }

  private buildFaqData() {
    this.faq = [
      {
        groupName: this.translate.instant('SUPPORT.FAQ.GROUPS.GENERAL'),
        children: [
          {
            title: this.translate.instant('SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.GENERAL.WHAT_IS_NDEWA.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.GENERAL.IS_FREE.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.GENERAL.IS_FREE.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.GENERAL.TRAINING_VIDEOS.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.GENERAL.TRAINING_VIDEOS.ANSWER')
          }
        ]
      },
      {
        groupName: this.translate.instant('SUPPORT.FAQ.GROUPS.OWNERS'),
        children: [
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_REGISTER.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_REGISTER.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_CREATE_PROPERTY.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_CREATE_PROPERTY.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.PROPERTY_VS_UNIT.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.PROPERTY_VS_UNIT.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_ADD_UNIT.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_ADD_UNIT.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.ADD_360_TOUR.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.ADD_360_TOUR.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_ADD_TENANT.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_ADD_TENANT.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_RECORD_PAYMENT.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.HOW_TO_RECORD_PAYMENT.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.TENANT_NOTIFICATION.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.TENANT_NOTIFICATION.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.MONTHLY_REVENUE_TRACKING.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.MONTHLY_REVENUE_TRACKING.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.OWNERS.DOWNLOAD_DOCUMENTS.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.OWNERS.DOWNLOAD_DOCUMENTS.ANSWER')
          }
        ]
      },
      {
        groupName: this.translate.instant('SUPPORT.FAQ.GROUPS.TENANTS'),
        children: [
          {
            title: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_SEARCH.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_SEARCH.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TENANTS.WHAT_IS_360_TOUR.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TENANTS.WHAT_IS_360_TOUR.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TENANTS.IS_360_TOUR_FREE.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TENANTS.IS_360_TOUR_FREE.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_CONTACT_OWNER.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_CONTACT_OWNER.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_KNOW_AVAILABILITY.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TENANTS.HOW_TO_KNOW_AVAILABILITY.ANSWER')
          }
        ]
      },
      {
        groupName: this.translate.instant('SUPPORT.FAQ.GROUPS.TECHNICAL_SUPPORT'),
        children: [
          {
            title: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.NO_EMAIL_RECEIVED.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.NO_EMAIL_RECEIVED.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.PAYMENT_ACCESS_ISSUE.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.PAYMENT_ACCESS_ISSUE.ANSWER')
          },
          {
            title: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.HOW_TO_CONTACT_SUPPORT.QUESTION'),
            content: this.translate.instant('SUPPORT.FAQ.TECHNICAL_SUPPORT.HOW_TO_CONTACT_SUPPORT.ANSWER')
          }
        ]
      }
    ];
  }

  goBack()
  {
    // Naviguer vers la page d'accueil du support avec la langue courante
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/support/welcome`]);
  }
}