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

  public menu: Array<MenuType> = [
    {
      groupName: 'DASHBOARDS',
      opened: true,
      children: [
        {
          name: 'Acceuil',
          url: '/app/dashboard/default',
          prefix: {
            type: 'ibm-icon',
            name: 'home',
          },
        },
        {
          name: 'Tableau de bord',
          url: '/app/dashboard/analytics',
          prefix: {
            type: 'ibm-icon',
            name: 'activity',
          },
        },
      ],
    },
    {
      groupName: 'BIENS IMMOBILIER',
      opened: true,
      children: [
        {
          name: 'Biens',

          prefix: {
            type: 'ibm-icon',
            name: 'home',
          },
          url: '/app/properties/list',
        },
        {
          name: 'Locataire',
          prefix: {
             type: 'ibm-icon',
            name: 'userAvatar'
          },
          suffix: {
            type: 'badge',
            level: 'danger',
            text: 3,
          },
          url: '/app/tasks',
        },
      ]
    },
    {
      groupName: 'GESTION',
      opened: true,
      children: [
        {
          name: 'Modèles de contrats',
          prefix: {
            type: 'ibm-icon',
            name: 'document'
          },
          url: '/app/contract-templates',
        },
      ]
    },
  ]

  constructor(private settingsService: SettingsService,
              private appMenuService: AppMenuService,
              private store: Store,
              private router: Router) {
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
    
    // Filter menu based on user type and agent status
    this.filterMenuForUser();
    
    // Listen to user profile changes to update menu
    this.store.select(UserProfileState.selectStateUserProfile)
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => {
        this.filterMenuForUser();
      });
    
    // Listen to route changes to update menu
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.onDestroy)
      )
      .subscribe(() => {
        this.filterMenuForUser();
      });
  }

  private filterMenuForUser(): void {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const currentUrl = this.router.url;
    
    // If user is an agent, hide contract templates and properties sections
    if (user?.userType === 'AGENT') {
      // If agent is on profile completion or pending approval pages, show minimal menu
      if (currentUrl.includes('/agent/complete-profile') || currentUrl.includes('/agent/pending-approval')) {
        this.menu = [
          {
            groupName: 'PROFIL AGENT',
            opened: true,
            children: [
              {
                name: 'Compléter mon profil',
                url: '/app/agent/complete-profile',
                prefix: {
                  type: 'ibm-icon',
                  name: 'userAvatar',
                },
              }
            ]
          }
        ];
      } else {
        // For approved agents, show only dashboard
        this.menu = [
          {
            groupName: 'DASHBOARDS',
            opened: true,
            children: [
              {
                name: 'Acceuil',
                url: '/app/dashboard/default',
                prefix: {
                  type: 'ibm-icon',
                  name: 'home',
                },
              },
              {
                name: 'Tableau de bord',
                url: '/app/dashboard/analytics',
                prefix: {
                  type: 'ibm-icon',
                  name: 'activity',
                },
              },
            ],
          }
        ];
      }
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
