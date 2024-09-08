import {Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild} from '@angular/core'
import { Select } from '@ngxs/store'
import { Observable } from 'rxjs'
import { UserProfileModel, UserProfileState } from 'src/app/shared/store'

@Component({
  selector: 'youpez-lock-screen',
  templateUrl: './app-lock-screen.component.html',
  styleUrls: ['./app-lock-screen.component.scss']
})
export class AppLockScreenComponent implements OnInit {
  @Output() close = new EventEmitter()
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  public loading: boolean = true

  constructor() {
  }

  ngOnInit(): void {

  }

  onClose() {
    this.close.next(true)
  }

}
