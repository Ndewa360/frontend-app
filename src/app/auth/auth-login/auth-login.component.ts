import {Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core'
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators
} from "@angular/forms"
import {ActivatedRoute, Router} from '@angular/router'
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import { UserProfileAction, UserProfileState } from 'src/app/shared/store'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'
import { TranslateService } from '@ngx-translate/core'
import { LanguagePreservationService } from 'src/app/shared/services/language-preservation.service'

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginComponent implements OnInit, OnDestroy {

  public formGroup: UntypedFormGroup
  waittingResponse = false;
  showPassword = false;
  private subscriptions: Subscription[] = [];

  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private _store: Store,
    private _ngxsAction: Actions,
    private _toastrService: ToastrService,
    private http: HttpClient,
    private languageUrlService: LanguageUrlService,
    private translate: TranslateService,
    private languagePreservation: LanguagePreservationService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    const successSub = this._ngxsAction.pipe(
      ofActionSuccessful(UserProfileAction.LoginUserProfile)
    ).subscribe(() => {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const reason = this.route.snapshot.queryParams['reason'];

      // Toast unique de bienvenue (le state ne l'affiche plus)
      if (reason === 'inactive' || reason === 'critical_inactive' || reason === 'token_expired') {
        this._toastrService.success(
          this.translate.instant('NOTIFICATIONS.WELCOME_LOGIN'),
          `Ndewa360° - ${this.translate.instant('COMMON.SUCCESS')}`,
          { timeOut: 6000, extendedTimeOut: 2000 }
        );
      } else {
        this._toastrService.success(
          this.translate.instant('NOTIFICATIONS.WELCOME_LOGIN'),
          'Ndewa360°',
          { timeOut: 4000, extendedTimeOut: 1000 }
        );
      }

      if (returnUrl) {
        const decodedUrl = decodeURIComponent(returnUrl);
        if (this.isValidReturnUrl(decodedUrl)) {
          this.router.navigateByUrl(decodedUrl);
        } else {
          this.redirectBasedOnUserType();
        }
      } else {
        this.redirectBasedOnUserType();
      }
    });
    this.subscriptions.push(successSub);

    const completedSub = this._ngxsAction.pipe(
      ofActionCompleted(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      this.waittingResponse = false;
      if (value?.result?.error?.['status'] == 406) {
        this.languagePreservation.navigateWithLanguage(`/auth/confirmation/${this.formGroup.value.email}`);
      }
    });
    this.subscriptions.push(completedSub);

    const errorSub = this._ngxsAction.pipe(
      ofActionErrored(UserProfileAction.LoginUserProfile)
    ).subscribe(() => {
      this.waittingResponse = false;
    });
    this.subscriptions.push(errorSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      this.waittingResponse = true;
      const email = this.formGroup.value.email.trim();
      const password = this.formGroup.value.password;
      this._store.dispatch(new UserProfileAction.LoginUserProfile(email, password));
    } else {
      this.formGroup.markAllAsTouched();
      this._toastrService.warning(this.translate.instant('VALIDATION.REQUIRED'), "Ndewa360°");
    }
  }

  isValid(name: string) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  goToSearchPage() {
    this.languagePreservation.navigateWithLanguage('/search/index', { minPrice: 0, maxPrix: 100000, ville: 'Bangangté' });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    // Rediriger vers l'endpoint OAuth2 Google du backend
    const currentLang = this.languageUrlService.getCurrentLanguage();
    const returnUrl = encodeURIComponent(`/${currentLang}/app/properties/home`);
    window.location.href = `${environment.apiUrl}/user/auth/google?returnUrl=${returnUrl}`;
  }

  private redirectBasedOnUserType(): void {
    const user = this._store.selectSnapshot(UserProfileState.selectStateUserProfile);
    if (!user) {
      setTimeout(() => {
        const retryUser = this._store.selectSnapshot(UserProfileState.selectStateUserProfile);
        if (retryUser) {
          this.performRedirection(retryUser);
        } else {
          const currentLang = this.languageUrlService.getCurrentLanguage();
          this.router.navigate([`/${currentLang}/app/welcome`]);
        }
      }, 800);
      return;
    }
    this.performRedirection(user);
  }

  private performRedirection(user: any): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();

    if (this.isAdmin(user)) {
      this.router.navigate([`/${currentLang}/app/properties/home`]);
      return;
    }

    if (user.userType === 'AGENT') {
      this.redirectAgent(user);
      return;
    }

    this.router.navigate([`/${currentLang}/app/properties/home`]);
  }

  private redirectAgent(user: any): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.http.get(`${environment.apiUrl}/agents/${user._id}`).subscribe({
      next: (response: any) => {
        const agentProfile = response?.data || response;
        if (!agentProfile || !agentProfile.isProfileCompleted) {
          this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
        } else if (agentProfile.status === 'PENDING' || agentProfile.status === 'ADMIN_REVIEW' || agentProfile.status === 'REJECTED') {
          this.router.navigate([`/${currentLang}/app/agent/pending-approval`]);
        } else if (agentProfile.status === 'APPROVED') {
          this.router.navigate([`/${currentLang}/app/properties/home`]);
        } else {
          this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
        }
      },
      error: () => {
        this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
      }
    });
  }

  private isAdmin(user: any): boolean {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role?.name;
      return roleName === 'super-admin' || roleName === 'admin';
    });
  }

  private isValidReturnUrl(url: string): boolean {
    try {
      if (url.startsWith('/')) return true;
      const urlObj = new URL(url);
      return urlObj.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}
