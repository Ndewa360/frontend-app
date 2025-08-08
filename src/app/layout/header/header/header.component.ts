import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Observable } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import {Router} from "@angular/router"
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'
import { Actions,Select, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import { BaseComponent } from 'src/app/shared/utils/base-component'
import { NotificationManagerService } from 'src/app/shared/services/notification-manager.service'
import { AuthStateService } from 'src/app/shared/services/auth-state.service'

@Component({
  selector: 'app-main-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent extends BaseComponent implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  @Output() menuClick: EventEmitter<boolean> = new EventEmitter()
  @Output() itemClick: EventEmitter<any> = new EventEmitter()

  isAdmin = false;
  showNotifications = false;
  unreadNotificationsCount = 0;
  isAuthenticated$ = this.authStateService.isAuthenticated();
  authState$ = this.authStateService.getAuthState();
 
  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private router: Router,
    private notificationManager: NotificationManagerService,
    private authStateService: AuthStateService
  ) {
    super();
  }

  ngOnInit(): void {
    // Surveiller le profil utilisateur
    this.userProfil$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) this.isAdmin = user.email === 'support@ndewa-360.com';
      });

    // Surveiller les actions de déconnexion
    this._ngxsAction
      .pipe(
        ofActionSuccessful(UserProfileAction.LogoutUserProfile),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.router.navigate(['/auth/signin']);
      });

    // Surveiller le nombre de notifications non lues
    this.notificationManager.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });
  }

  onSideBarToggle($event: any): void {
    this.menuClick.next(true);
  }

  onItemClick(event: any): void {
    this.itemClick.next(event);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  logout(): void {
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }
}
