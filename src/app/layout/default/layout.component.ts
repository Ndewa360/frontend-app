import {Component, OnDestroy, OnInit} from '@angular/core'
import {takeUntil} from 'rxjs/operators'
import {Subject} from "rxjs"
import {defaultRouterTransition, MenuType} from "../../../@youpez"
import {SettingsService} from "../../../@youpez"
import {AppMenuService} from "../../../@youpez"
import { ModeType, SizeType } from 'src/@youpez/components/app-sidenav/app-sidenav/app-sidenav.component'
import { Store } from '@ngxs/store'
import { UserProfileState } from 'src/app/shared/store/user-profile/user-profile.state'
import { Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  animations: [
    defaultRouterTransition,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly onDestroy = new Subject<void>()

  public mainSidebarOpts:{
    breakpoint: SizeType,
    opened: boolean,
    hoverAble: boolean,
    mode: ModeType,
    toggleableBtn: boolean,
    size: SizeType,
  } = {
    breakpoint: 'md',
    opened: true,
    hoverAble: true,
    mode: 'side',
    toggleableBtn: false,
    size: 'sideBar1',
  }
  public miniSidebarOpts = {}
  public settingsVisible: boolean = false
  public searchVisible: boolean = false
  public lockScreenVisible: boolean = false

  public menu: Array<MenuType> = []

  constructor(private settingsService: SettingsService,
              private appMenuService: AppMenuService,
              private store: Store,
              private router: Router,
              private translate: TranslateService,
              private languageUrlService: LanguageUrlService) {
  }

  ngOnInit(): void {
    this.appMenuService
      .$callbackClick
      .pipe(takeUntil(this.onDestroy))
      .subscribe((params) => {
        if (params === 'lock') {
          this.lockScreenVisible = true
        }
      })
    
    // Initialize menu with translations
    this.initializeMenu();
    
    // Listen to language changes to update menu
    this.translate.onLangChange
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => {
        this.initializeMenu();
      });
    
    // Listen to user profile changes to update menu
    this.store.select(UserProfileState.selectStateUserProfile)
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => {
        this.initializeMenu();
      });
    
    // Listen to route changes to update menu
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.onDestroy)
      )
      .subscribe(() => {
        this.initializeMenu();
      });
  }

  private initializeMenu(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const currentUrl = this.router.url;
    
    // Default menu for property owners
    let defaultMenu = [
      {
        groupName: this.translate.instant('NAVIGATION.DASHBOARD'),
        opened: true,
        children: [
          {
            name: this.translate.instant('NAVIGATION.DASHBOARD'),
            url: `/${currentLang}/app/welcome`,
            prefix: {
              type: 'ibm-icon',
              name: 'home',
            },
          },
        ],
      },
      {
        groupName: this.translate.instant('NAVIGATION.PROPERTIES'),
        opened: true,
        children: [
          {
            name: this.translate.instant('NAVIGATION.PROPERTIES'),
            prefix: { type: 'ibm-icon', name: 'home' },
            url: `/${currentLang}/app/properties/home`,
          },
          {
            name: 'Liste des biens',
            prefix: { type: 'ibm-icon', name: 'list' },
            url: `/${currentLang}/app/properties/list`,
          },
        ]
      },
      {
        groupName: 'Finances',
        opened: true,
        children: [
          {
            name: 'Facturation',
            prefix: { type: 'ibm-icon', name: 'receipt' },
            url: `/${currentLang}/app/facturation/plan/dashboard`,
          },
          {
            name: 'Mon Portefeuille',
            prefix: { type: 'ibm-icon', name: 'money' },
            url: `/${currentLang}/app/portefeuille`,
          },
        ]
      },
      {
        groupName: this.translate.instant('COMMON.SETTINGS'),
        opened: true,
        children: [
          {
            name: 'Modèles de contrats',
            prefix: { type: 'ibm-icon', name: 'document' },
            url: `/${currentLang}/app/contract-templates`,
          },
          {
            name: this.translate.instant('NAVIGATION.PROFILE'),
            prefix: { type: 'ibm-icon', name: 'userAvatar' },
            url: `/${currentLang}/app/profile`,
          },
        ]
      },
    ];
    
    // If user is an agent, customize menu
    if (user?.userType === 'AGENT') {
      // If agent is on profile completion or pending approval pages, show minimal menu
      if (currentUrl.includes('/agent/complete-profile') || currentUrl.includes('/agent/pending-approval')) {
        this.menu = [
          {
            groupName: this.translate.instant('NAVIGATION.PROFILE'),
            opened: true,
            children: [
              {
                name: 'Compléter mon profil',
                url: `/${currentLang}/app/agent/complete-profile`,
                prefix: {
                  type: 'ibm-icon',
                  name: 'userAvatar',
                },
              }
            ]
          }
        ];
      } else {
        // For approved agents, show dashboard and properties
        this.menu = [
          {
            groupName: this.translate.instant('NAVIGATION.DASHBOARD'),
            opened: true,
            children: [
              {
                name: this.translate.instant('NAVIGATION.DASHBOARD'),
                url: `/${currentLang}/app/welcome`,
                prefix: {
                  type: 'ibm-icon',
                  name: 'home',
                },
              },
            ],
          },
          {
            groupName: this.translate.instant('NAVIGATION.PROPERTIES'),
            opened: true,
            children: [
              {
                name: 'Mes Biens Gérés',
                prefix: { type: 'ibm-icon', name: 'home' },
                url: `/${currentLang}/app/properties/home`,
              }
            ]
          },
          {
            groupName: 'Finances',
            opened: true,
            children: [
              {
                name: 'Mon Portefeuille',
                prefix: { type: 'ibm-icon', name: 'money' },
                url: `/${currentLang}/app/portefeuille`,
              },
            ]
          },
        ];
      }
    } else {
      this.menu = defaultMenu;
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
  }

  onMiniSidebarItemClick(event) {
    if (event.key === 'theme') {
      this.settingsVisible = !this.settingsVisible
    }
    if (event.key === 'search') {
      this.searchVisible = true
    }
  }

  onToggleThemeSettings() {
    this.settingsVisible = true
  }

  onSideBarOpen(event) {
    this.mainSidebarOpts.opened = true
  }

  onSideBarToggle(event) {
    this.mainSidebarOpts.opened = !this.mainSidebarOpts.opened
  }

  onCloseSettings(event) {
    this.settingsVisible = false
  }

  onSearchClose(event) {
    this.searchVisible = false
  }

  onLockClose(event) {
    this.lockScreenVisible = false
  }

  onCloseSidebar() {
    this.mainSidebarOpts.opened = false
  }

  onVisibilityChange(event){
    this.mainSidebarOpts.opened=event
  }
}
