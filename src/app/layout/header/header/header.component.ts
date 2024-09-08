import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Select, Store } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'

@Component({
  selector: 'app-main-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  @Output() menuClick: EventEmitter<boolean> = new EventEmitter()
  @Output() itemClick: EventEmitter<any> = new EventEmitter()
  

  constructor( private _store:Store) {
  }

  ngOnInit(): void {
  }

  onSideBarToggle($event) {
    this.menuClick.next(true)
  }

  onItemClick(event) {
    this.itemClick.next(event)
  }

  logout()
  {
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true))
  }
}
