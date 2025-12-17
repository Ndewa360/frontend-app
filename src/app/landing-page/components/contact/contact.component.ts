import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';
import { Store, Actions, Select, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ProspectionAction, ProspectionState } from 'src/app/shared/store';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContactComponent implements OnInit {
  
  contactForm: FormGroup;
  @Select(ProspectionState.selectStateLoadingProspection) prospectionLoading: Observable<boolean>;
  waittingResponse = false;

  constructor(
    private fb: FormBuilder,
    private translationService: TranslationService,
    private languageUrlService: LanguageUrlService,
    private store: Store,
    private actions: Actions
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: [''],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.actions.pipe(ofActionCompleted(ProspectionAction.CreateNewProspection)).subscribe(() => {
      this.waittingResponse = false;
    });

    this.actions.pipe(ofActionSuccessful(ProspectionAction.CreateNewProspection)).subscribe(() => {
      this.contactForm.reset();
      this.waittingResponse = false; // S'assurer que le loader est désactivé
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.waittingResponse = true;
      const formData = this.contactForm.value;
      
      // Adapter les données au format attendu par l'API
      const prospectionData = {
        name: formData.name,
        email: formData.email,
        tel: formData.phone || '',
        object: formData.subject,
        message: `${formData.company ? 'Entreprise: ' + formData.company + '\n\n' : ''}${formData.message}`
      };
      
      this.store.dispatch(new ProspectionAction.CreateNewProspection(prospectionData));
    }
  }

  /**
   * Obtient la traduction d'une clé
   */
  t(key: string, params?: any): string {
    return this.translationService.instant(key, params);
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}