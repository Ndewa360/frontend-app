import {Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core'
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from "@angular/forms"
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router'
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import { UserProfileAction } from 'src/app/shared/store'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginComponent implements OnInit, OnDestroy {

  public formGroup: UntypedFormGroup
  waittingResponse = false;
  private subscriptions: Subscription[] = [];

  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private _store: Store,
    private _ngxsAction: Actions,
    private _toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // S'abonner aux actions réussies
    const successSub = this._ngxsAction.pipe(
      ofActionSuccessful(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      // Récupérer les paramètres de requête
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const reason = this.route.snapshot.queryParams['reason'];

      // Message spécifique selon la raison de la reconnexion
      if (reason === 'inactive') {
        this._toastrService.success(
          '✅ Reconnexion réussie ! Vous reprenez votre session là où vous l\'aviez laissée.',
          'Ndewa360° - Session restaurée',
          { timeOut: 6000, extendedTimeOut: 2000 }
        );
      } else if (reason === 'critical_inactive') {
        this._toastrService.success(
          '🔒 Reconnexion sécurisée réussie ! Vos données sont protégées.',
          'Ndewa360° - Sécurité',
          { timeOut: 6000, extendedTimeOut: 2000 }
        );
      } else if (reason === 'token_expired') {
        this._toastrService.success(
          '🔑 Session renouvelée avec succès ! Vous pouvez continuer.',
          'Ndewa360° - Authentification',
          { timeOut: 5000, extendedTimeOut: 2000 }
        );
      } else {
        this._toastrService.success(
          '🎉 Bienvenue sur Ndewa360° ! Votre session est active.',
          'Ndewa360°',
          { timeOut: 4000, extendedTimeOut: 1000 }
        );
      }

      // Redirection après connexion réussie
      if (returnUrl) {
        this.router.navigateByUrl(decodeURIComponent(returnUrl));
      } else {
        // Redirection par défaut vers les propriétés pour les utilisateurs connectés
        this.router.navigate(['/app/properties']);
      }
    });
    this.subscriptions.push(successSub);

    // S'abonner aux actions complétées (succès ou échec)
    const completedSub = this._ngxsAction.pipe(
      ofActionCompleted(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      this.waittingResponse = false;
      
      // Vérifier si c'est une erreur 406 (compte inactif)
      if (value?.result?.error?.['status'] == 406) {
        this.router.navigate(['/auth/confirmation', this.formGroup.value.email]);
      }
    });
    this.subscriptions.push(completedSub);

    // S'abonner aux erreurs
    const errorSub = this._ngxsAction.pipe(
      ofActionErrored(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      this.waittingResponse = false;
      
      // Afficher un message d'erreur générique si aucun message spécifique n'est fourni
      // if (!value?.error?.message) {
      //   this._toastrService.error("Échec de la connexion. Veuillez vérifier vos identifiants.", "Ndewa360°");
      // }
    });
    this.subscriptions.push(errorSub);
  }

  ngOnDestroy(): void {
    // Se désabonner de tous les observables pour éviter les fuites de mémoire
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSubmit() {
    // Ne soumettre que si le formulaire est valide
    if (this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      this.waittingResponse = true;
      
      // Trim des valeurs pour éviter les espaces
      const email = this.formGroup.value.email.trim();
      const password = this.formGroup.value.password;
      
      this._store.dispatch(new UserProfileAction.LoginUserProfile(email, password));
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.formGroup.markAllAsTouched();
      this._toastrService.warning("Veuillez remplir correctement tous les champs", "Ndewa360°");
    }
  }

  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  goToSearchPage() {
    this.router.navigateByUrl("/search/index?minPrice=0&maxPrix=100000&ville=Bangangté");
  }
}
