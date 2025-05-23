import {Component, EventEmitter, OnInit, Output} from '@angular/core'
import { Observable } from 'rxjs'
import {Router} from "@angular/router"
import { UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store'
import { Actions,Select, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'

@Component({
  selector: 'app-main-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  @Output() menuClick: EventEmitter<boolean> = new EventEmitter()
  @Output() itemClick: EventEmitter<any> = new EventEmitter()
  isAdmin=false;

  constructor( 
    private _store:Store,
    private _ngxsAction:Actions,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.userProfil$.subscribe((user)=>{if(user) this.isAdmin=user.email=='contact@ndewa-360.com'})
    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.LogoutUserProfile)).subscribe((value)=>{
      this.router.navigate(['/auth/signin']);
      }
    );
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
