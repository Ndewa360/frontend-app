import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { UserProfileAction } from 'src/app/shared/store';

@Component({
  selector: 'app-auth-confirmation',
  templateUrl: './auth-confirmation.component.html',
  styleUrls: ['./auth-confirmation.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AuthConfirmationComponent implements OnInit {
  waittingResponse=false;
  email:string=''

  constructor(
    private route: ActivatedRoute,
    private _ngxsAction:Actions,
    private _store:Store,
    private router:Router
  ) {}

  ngOnInit(): void {
    
    this.email = this.route.snapshot.paramMap.get('email');

    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ResentLinkForUserProfilePassWord)).subscribe((value)=>{
      this.waittingResponse =false;
    });

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ResentLinkForUserProfilePassWord)).subscribe((value)=>{
      this.router.navigate(['/auth/askto-valid-email']);
    });
  }

  onResendEmailConfirmation()
  {
    this._store.dispatch(new UserProfileAction.ResentLinkForUserProfilePassWord(this.email))
    this.waittingResponse=true;
  }

}
