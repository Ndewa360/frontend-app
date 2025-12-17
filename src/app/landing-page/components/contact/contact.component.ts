import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ContactComponent {
  
  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
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
}