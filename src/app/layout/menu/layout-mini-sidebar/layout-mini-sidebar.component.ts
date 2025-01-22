import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Router } from '@angular/router'
import { Select, Store } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store'

@Component({
  selector: 'app-layout-mini-sidebar',
  templateUrl: './layout-mini-sidebar.component.html',
  styleUrls: ['./layout-mini-sidebar.component.scss']
})
export class LayoutMiniSidebarComponent implements OnInit {

  @Output() itemClick: EventEmitter<any> = new EventEmitter()
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>
  isAdmin=false;

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
    private _router:Router
  ) {
  }

  ngOnInit(): void {
    this.userProfile$.subscribe((user)=>{ if(user) this.isAdmin=user.email=='contact@ndewa-360.com'})

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
}
