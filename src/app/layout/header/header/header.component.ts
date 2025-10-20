import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Observable } from 'rxjs'
import { takeUntil, filter } from 'rxjs/operators'
import {Router, NavigationEnd} from "@angular/router"
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'
import { Actions,Select, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import { BaseComponent } from 'src/app/shared/utils/base-component'
import { NotificationManagerService } from 'src/app/shared/services/notification-manager.service'
import { AuthStateService } from 'src/app/shared/services/auth-state.service'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'
import { LanguagePreservationService } from 'src/app/shared/services/language-preservation.service'

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
  currentRoute = '';
 
  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private router: Router,
    private notificationManager: NotificationManagerService,
    private authStateService: AuthStateService,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService
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

    // Les redirections de déconnexion sont gérées par le DisconnectionService

    // Surveiller le nombre de notifications non lues
    this.notificationManager.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });

    // Écouter les changements de route pour mettre à jour l'état actif
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Initialiser la route courante
    this.currentRoute = this.router.url;
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
    // Préserver la langue avant la déconnexion
    this.languagePreservation.preserveCurrentLanguage();
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }

  navigateToProperties(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/home`]);
  }

  navigateToBilling(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/facturation/plan`]);
  }

  navigateToAdmin(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/admin/dashboard`]);
  }

  navigateToProfile(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/profile`]);
  }

  navigateToSearch(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/search/index`]);
  }

  navigateToSettings(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/user/settings`]);
  }

  navigateToLogin(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/auth/signin`]);
  }

  isRouteActive(route: string): boolean {
    if (!route) return false;
    
    // Normaliser les routes pour la comparaison
    const normalizedCurrentRoute = this.currentRoute.replace(/\/[a-z]{2}\//g, '/').replace(/\/$/, '');
    const normalizedRoute = route.replace(/\/[a-z]{2}\//g, '/').replace(/\/$/, '');
    
    return normalizedCurrentRoute.startsWith(normalizedRoute);
  }
}
