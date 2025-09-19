import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Router } from '@angular/router'
import { Select, Store } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store'
import { AgentStatusService } from 'src/app/shared/services/agent-status.service'

@Component({
  selector: 'app-layout-mini-sidebar',
  templateUrl: './layout-mini-sidebar.component.html',
  styleUrls: ['./layout-mini-sidebar.component.scss']
})
export class LayoutMiniSidebarComponent implements OnInit {

  @Output() itemClick: EventEmitter<any> = new EventEmitter()
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>
  isAdmin=false;
  isAgent=false;
  canAccessProperties=true;
  routerLinkRoute="/support/home"

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

  constructor(
    private _store:Store,
    private _router:Router,
    private agentStatusService: AgentStatusService
  ) {
  }

  ngOnInit(): void {
    this.userProfile$.subscribe((user)=>{

      if(user) {
        // ✅ CORRECTION: Vérifier le rôle super-admin au lieu de l'email spécifique
        this.isAdmin = this.checkIfUserIsAdmin(user);
        this.isAgent = user.userType === 'AGENT';
        this.canAccessProperties = this.agentStatusService.canAccessProperties();

        this.routerLinkRoute="/app/welcome"
      }
    })

    // Écouter les changements de statut d'agent
    this.agentStatusService.agentStatus$.subscribe(() => {
      this.canAccessProperties = this.agentStatusService.canAccessProperties();
    });

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
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true))
    this._router.navigate(['/auth/signin'])
  }
  goToSearchPage()
  {
    this._router.navigate(
      ['/search/index'],
      { queryParams: { minPrice: 0,maxPrix:100000,  ville:"Bangangté"} }
    );
  }
}
