import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { UserProfileAction, UserProfileState } from 'src/app/shared/store';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

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
    private http: HttpClient,
    private languageUrlService: LanguageUrlService
  ){}

  ngOnInit(): void {
    if(!this.route.snapshot.queryParamMap.has("token"))
    {
      this._toastrService.error(`Token non fournis! `, 'Ndewa360°');
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/auth/signin`])
      return;
    }

    let token =  this.route.snapshot.queryParamMap.get("token");
    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ValidateUserProfileWithToken)).subscribe((value)=>{
        this.resultState ='success';
        // Redirection automatique après validation réussie
        setTimeout(() => {
          this.redirectAfterValidation();
        }, 2000); // Attendre 2 secondes pour que l'utilisateur voie le message de succès
      }
    );


    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.ValidateUserProfileWithToken)).subscribe(
      (value) => {
        this.resultState='error';        
      })

      this._store.dispatch(new UserProfileAction.ValidateUserProfileWithToken(token))
  }

  private async redirectAfterValidation(): Promise<void> {
    try {
      // Attendre que le profil utilisateur soit chargé
      setTimeout(async () => {
        const user = this._store.selectSnapshot(UserProfileState.selectStateUserProfile);
        
        if (!user) {
          const currentLang = this.languageUrlService.getCurrentLanguage();
          this.router.navigate([`/${currentLang}/auth/signin`]);
          return;
        }

        // Vérifier si c'est un admin
        if (this.isAdmin(user)) {
          const currentLang = this.languageUrlService.getCurrentLanguage();
          this.router.navigate([`/${currentLang}/admin/dashboard`]);
          return;
        }

        // Vérifier si c'est un agent
        if (user.userType === 'AGENT') {
          await this.redirectAgent(user);
          return;
        }

        // Utilisateur normal
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/app/properties`]);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la redirection:', error);
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/auth/signin`]);
    }
  }

  private async redirectAgent(user: any): Promise<void> {
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      
      if (!response) {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
        return;
      }
      
      const agentProfile = response.data || response;

      const currentLang = this.languageUrlService.getCurrentLanguage();
      if (!agentProfile || !agentProfile.isProfileCompleted) {
        this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
      } else if (agentProfile.status === 'PENDING' || agentProfile.status === 'ADMIN_REVIEW') {
        this.router.navigate([`/${currentLang}/app/agent/pending-approval`]);
      } else if (agentProfile.status === 'REJECTED') {
        this.router.navigate([`/${currentLang}/app/agent/pending-approval`]);
      } else if (agentProfile.status === 'APPROVED') {
        this.router.navigate([`/${currentLang}/app/properties`]);
      } else {
        this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du profil agent:', error);
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/app/agent/complete-profile`]);
    }
  }

  private isAdmin(user: any): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    return user.roles.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName === 'super-admin' || roleName === 'admin';
    });
  }

}
