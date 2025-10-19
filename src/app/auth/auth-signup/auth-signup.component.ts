import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {Router} from "@angular/router"
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import {UserProfileAction} from "src/app/shared/store"
import { TranslateService } from '@ngx-translate/core'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'

/**
 * Signup component
 */
@Component({
  selector: 'app-auth-signup',
  templateUrl: './auth-signup.component.html',
  styleUrls: ['./auth-signup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthSignupComponent implements OnInit {

  public formGroup: UntypedFormGroup

  waittingResponse = false;
  showPassword = false;

  profileTypes = [
    { 
      value: 'PROPERTY_OWNER', 
      label: 'Propriétaire de biens',
      description: 'Gérez vos propriétés, trouvez des locataires qualifiés et suivez vos revenus locatifs en toute simplicité.',
      iconClass: 'text-blue-600',
      iconPath: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'
    },
    { 
      value: 'AGENT', 
      label: 'Agent immobilier',
      description: 'Développez votre activité avec nos outils professionnels, profil vérifié et réseau de clients qualifiés.',
      iconClass: 'text-green-600',
      iconPath: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z'
    }
  ];

  constructor(protected formBuilder: UntypedFormBuilder,
              private router: Router,
            private _store:Store,
            private _ngxsAction:Actions,
            private translate: TranslateService,
            private languageUrlService: LanguageUrlService

          ) {
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      profileType: ['PROPERTY_OWNER', [Validators.required]], // Valeur par défaut
      fullName: ['', [Validators.required,]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phoneNumber:[null, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      // Champs spécifiques aux agents
      businessName: [''],
      condition: [true],
    })

    // Écouter les changements de type de profil
    this.formGroup.get('profileType')?.valueChanges.subscribe(type => {
      this.updateValidatorsForProfileType(type);
    });
    
    // Initialiser les validateurs pour le type par défaut
    this.updateValidatorsForProfileType(this.formGroup.get('profileType')?.value);

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.SignupSimpleUserProfile)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/auth/askto-valid-email`]);
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.SignupSimpleUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;
      }
    )

    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.SignupSimpleUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false; 
        // if()
        // this.router.navigate(["/auth/confirmation"])
      })
  }

  updateValidatorsForProfileType(profileType: string) {
    const businessName = this.formGroup.get('businessName');
    
    if (profileType === 'AGENT') {
      // Validateurs obligatoires pour les agents
      businessName?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
    } else {
      // Pas de validateurs pour les propriétaires sur ces champs
      businessName?.clearValidators();
      // Vider les champs agent si on passe en mode propriétaire
      businessName?.setValue('');
    }
    
    // Mettre à jour la validité de tous les champs
    businessName?.updateValueAndValidity();
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    
    if (this.formGroup.invalid) {
      this.waittingResponse = false;
      return;
    }
    
    this.waittingResponse = true;
    
    // Debug: vérifier les données envoyées
    console.log('📝 Données du formulaire d\'inscription:', {
      email: this.formGroup.value.email,
      profileType: this.formGroup.value.profileType,
      businessName: this.formGroup.value.businessName,
      fullName: this.formGroup.value.fullName,
      phoneNumber: this.formGroup.value.phoneNumber
    });
    
    // Utiliser la même action pour tous les types de comptes
    this._store.dispatch(new UserProfileAction.SignupSimpleUserProfile(
      this.formGroup.value.email,
      this.formGroup.value.password,
      this.formGroup.value.fullName,
      this.formGroup.value.phoneNumber,
      this.formGroup.value.profileType,
      this.formGroup.value.businessName
    ));
  }

  isAgentProfile(): boolean {
    return this.formGroup.get('profileType')?.value === 'AGENT';
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  getProfileTypeLabel(profileType: string): string {
    const key = profileType === 'PROPERTY_OWNER' ? 'AUTH.PROPERTY_OWNER' : 'AUTH.REAL_ESTATE_AGENT';
    return this.translate.instant(key);
  }

  getProfileTypeDescription(profileType: string): string {
    const key = profileType === 'PROPERTY_OWNER' ? 'AUTH.PROPERTY_OWNER_DESC' : 'AUTH.REAL_ESTATE_AGENT_DESC';
    return this.translate.instant(key);
  }

}
