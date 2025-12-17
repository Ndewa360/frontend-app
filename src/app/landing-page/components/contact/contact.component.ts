import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContactComponent {
  
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private translationService: TranslationService,
    private languageUrlService: LanguageUrlService
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

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Formulaire soumis:', this.contactForm.value);
      // Ici vous pouvez ajouter la logique d'envoi du formulaire
    } else {
      console.log('Formulaire invalide');
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