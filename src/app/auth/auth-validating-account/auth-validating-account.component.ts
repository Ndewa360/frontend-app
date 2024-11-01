import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { UserProfileAction } from 'src/app/shared/store';

@Component({
  selector: 'auth-validating-account',
  templateUrl: './auth-validating-account.component.html',
  styleUrls: ['./auth-validating-account.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class AuthValidatingAccountComponent implements OnInit {
  
  resultState: 'loading' | 'success' | 'error'='loading'

  constructor(
    private _store:Store,
    private _toastrService:ToastrService,
    private _ngxsAction:Actions,
    private router:Router,
    private route: ActivatedRoute,
  ){}

  ngOnInit(): void {
    if(!this.route.snapshot.queryParamMap.has("token"))
    {
      this._toastrService.error(`Token non fournis! `, 'Ndewa360°');
      this.router.navigate(["/auth/signin"])
      return;
    }

    let token =  this.route.snapshot.queryParamMap.get("token");
    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ValidateUserProfileWithToken)).subscribe((value)=>{
        this.resultState ='success';
      }
    );


    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.ValidateUserProfileWithToken)).subscribe(
      (value) => {
        this.resultState='error';        
      })

      this._store.dispatch(new UserProfileAction.ValidateUserProfileWithToken(token))
  }

}
