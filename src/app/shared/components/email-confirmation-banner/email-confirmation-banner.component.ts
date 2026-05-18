import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { UserProfileState } from '../../store/user-profile/user-profile.state';

@Component({
  selector: 'app-email-confirmation-banner',
  templateUrl: './email-confirmation-banner.component.html',
  styleUrls: ['./email-confirmation-banner.component.scss'],
})
export class EmailConfirmationBannerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showBanner = false;
  userEmail = '';
  resending = false;
  dismissed = false;

  // Compte à rebours 24h
  hoursLeft = 24;
  minutesLeft = 0;
  private timerInterval: any;

  constructor(
    private store: Store,
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.store
      .select(UserProfileState.selectStateUserProfile)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user && !user.emailConfirmed && !this.dismissed) {
          this.showBanner = true;
          this.userEmail = user.email || '';
          this.startCountdown(user.createdAt);
        } else {
          this.showBanner = false;
          this.clearTimer();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimer();
  }

  private startCountdown(createdAt?: Date): void {
    this.clearTimer();
    if (!createdAt) return;

    const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;

    const update = () => {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        this.hoursLeft = 0;
        this.minutesLeft = 0;
        this.clearTimer();
        return;
      }
      this.hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      this.minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    };

    update();
    this.timerInterval = setInterval(update, 60000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resendEmail(): void {
    if (!this.userEmail || this.resending) return;
    this.resending = true;

    this.http
      .post(`${environment.apiUrl}/email/send-confirmation`, { email: this.userEmail })
      .subscribe({
        next: () => {
          this.resending = false;
          this.toastr.success(
            this.translate.instant('NOTIFICATIONS.EMAIL_SENT_SUCCESS'),
            'Ndewa360°'
          );
        },
        error: () => {
          this.resending = false;
          this.toastr.error(
            this.translate.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY'),
            'Ndewa360°'
          );
        },
      });
  }

  dismiss(): void {
    this.dismissed = true;
    this.showBanner = false;
    this.clearTimer();
  }
}
