import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { ButtonModule } from 'carbon-components-angular/button';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgIf } from '@angular/common';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { ExtendedModule } from '@angular/flex-layout/extended';

@Component({
  selector: 'auth-askto-valid-email',
  templateUrl: './auth-askto-valid-email.component.html',
  styleUrls: ['./auth-askto-valid-email.component.css'],
  standalone: true,
  imports: [ExtendedModule, AppLogoComponent, NgIf, FlexModule, ButtonModule, RouterLink, IbmIconComponent, TranslatePipe]
})
export class AuthAsktoValidEmailComponent implements OnInit, OnDestroy {

  userEmail = '';
  isExpired = false;
  resending = false;
  resendSuccess = false;
  currentLang = 'fr';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService
  ) {}

  ngOnInit(): void {
    this.currentLang = this.languageUrlService.getCurrentLanguage();
    this.userEmail = this.route.snapshot.queryParams['email'] || '';
    this.isExpired = this.route.snapshot.queryParams['expired'] === 'true';
  }

  ngOnDestroy(): void {}

  resendEmail(): void {
    if (!this.userEmail || this.resending) return;
    this.resending = true;
    this.resendSuccess = false;

    this.http
      .post(`${environment.apiUrl}/email/send-confirmation`, { email: this.userEmail })
      .subscribe({
        next: () => {
          this.resending = false;
          this.resendSuccess = true;
          this.toastr.success(
            this.translate.instant('NOTIFICATIONS.EMAIL_SENT_SUCCESS'),
            'Ndewa360°',
            { timeOut: 6000 }
          );
        },
        error: () => {
          this.resending = false;
          this.toastr.error(
            this.translate.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY'),
            'Ndewa360°'
          );
        }
      });
  }
}
