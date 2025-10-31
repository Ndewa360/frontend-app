import {Component, EventEmitter, OnInit, OnDestroy, Output} from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { Select, Store } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store'
import { AgentStatusService } from 'src/app/shared/services/agent-status.service'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'
import { LanguagePreservationService } from 'src/app/shared/services/language-preservation.service'
import { TranslateService } from '@ngx-translate/core'
import { filter, takeUntil } from 'rxjs/operators'
import { Subject } from 'rxjs'

@Component({
  selector: 'app-layout-mini-sidebar',
  templateUrl: './layout-mini-sidebar.component.html',
  styleUrls: ['./layout-mini-sidebar.component.scss']
})
export class LayoutMiniSidebarComponent implements OnInit, OnDestroy {

  @Output() itemClick: EventEmitter<any> = new EventEmitter()
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>
  isAdmin=false;
  isAgent=false;
  canAccessProperties=true;
  routerLinkRoute="/support/home"
  currentRoute = '';
  private destroy$ = new Subject<void>();

  public notifications = [
    // {
    //   level: 'bug',
    //   text: 'Failed to get shared datastores in kubernetes cluster',
    //   date: '20m',
    // },
   
  ]
  public messages = [
    // {
    //   avatar: 'assets/img/avatar/avatarinit.png',
    //   name: 'John Belinda',
    //   text: 'Cannot start service web: error while creating mount source path ',
    //   date: '5 mins ago',
    //   read: false,
    // },
  ]

  public loading: boolean = false
  public loadingAdmin: boolean = false

  constructor(
    private _store:Store,
    private _router:Router,
    private agentStatusService: AgentStatusService,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService,
    private translate: TranslateService
  ) {
  }

  ngOnInit(): void {
    this.userProfile$.subscribe((user)=>{

      if(user) {
        // ✅ CORRECTION: Vérifier le rôle super-admin au lieu de l'email spécifique
        this.isAdmin = this.checkIfUserIsAdmin(user);
        this.isAgent = user.userType === 'AGENT';
        this.canAccessProperties = this.agentStatusService.canAccessProperties();

        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.routerLinkRoute=`/${currentLang}/app/welcome`
      }
    })

    // Écouter les changements de statut d'agent
    this.agentStatusService.agentStatus$.subscribe(() => {
      this.canAccessProperties = this.agentStatusService.canAccessProperties();
    });

    // Écouter les changements de route pour mettre à jour l'état actif
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Initialiser la route courante
    this.currentRoute = this._router.url;
  }

  /**
   * Vérifier si l'utilisateur a le rôle admin ou super-admin
   */
  private checkIfUserIsAdmin(user: any): boolean {
    // Vérifier uniquement les rôles de l'utilisateur (plus de vérification par email)
    if (!user.roles || !Array.isArray(user.roles)) {
      console.log('❌ Admin access denied - No roles found for user:', user.email);
      return false;
    }

    const hasAdminRole = user.roles.some((role: any) => {
      // Vérifier différentes variantes du nom de rôle
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName === 'super-admin' || roleName === 'admin'
    });

    if (hasAdminRole) {
      console.log('✅ Admin access granted via role for user:', {
        email: user.email,
        roles: user.roles.map((role: any) => typeof role === 'string' ? role : role.name)
      });
      return true;
    }

    console.log('❌ Admin access denied - No admin role found for user:', {
      email: user.email,
      roles: user.roles.map((role: any) => typeof role === 'string' ? role : role.name)
    });
    return false;
  }

  onItemClick(event) {
    this.itemClick.next(event)
  }

  onFakeLoading() {
    this.loading = true
    setTimeout(() => {
      this.loading = false
    }, 500)
  }

  logout()
  {
    // Préserver la langue avant la déconnexion
    this.languagePreservation.preserveCurrentLanguage();
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }
  goToSearchPage()
  {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate(
      [`/${currentLang}/search/index`],
      { queryParams: { minPrice: 0,maxPrix:100000,  ville:"Bangangté"} }
    );
  }

  navigateToProperties(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/properties/home`]);
  }

  navigateToBilling(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/facturation/plan`]);
  }

  navigateToContractTemplates(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/contract-templates`]);
  }

  navigateToAdmin(): void {
    this.loadingAdmin = true;
    const currentLang = this.languageUrlService.getCurrentLanguage();
    
    setTimeout(() => {
      this._router.navigate([`/${currentLang}/admin/dashboard`]).then(() => {
        setTimeout(() => {
          this.loadingAdmin = false;
        }, 500);
      }).catch(() => {
        this.loadingAdmin = false;
      });
    }, 300);
  }

  navigateToProfile(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/profile`]);
  }

  navigateToSupport(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/support/welcome`]);
  }

  navigateToAbout(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/application/welcome`]);
  }

  navigateToPricing(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/app/pricing/modern`]);
  }

  navigateToHome(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/`]);
  }

  navigateToLogin(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/auth/signin`]);
  }

  isRouteActive(route: string): boolean {
    if (!route) return false;
    
    console.log('🔍 Checking route active:', {
      currentRoute: this.currentRoute,
      checkingRoute: route
    });
    
    // Normaliser les routes pour la comparaison - amélioration de la regex
    const normalizedCurrentRoute = this.currentRoute
      .replace(/^\/[a-z]{2}(\/|$)/, '/') // Supprimer le code langue au début
      .replace(/\/$/, '') // Supprimer le slash final
      .replace(/\?.*$/, '') // Supprimer les query params
      .replace(/#.*$/, ''); // Supprimer les fragments
    
    const normalizedRoute = route
      .replace(/^\/[a-z]{2}(\/|$)/, '/')
      .replace(/\/$/, '');
    
    const isActive = normalizedCurrentRoute.startsWith(normalizedRoute) && normalizedRoute !== '/';
    
    console.log('🎯 Route comparison:', {
      normalizedCurrent: normalizedCurrentRoute,
      normalizedCheck: normalizedRoute,
      isActive
    });
    
    return isActive;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
