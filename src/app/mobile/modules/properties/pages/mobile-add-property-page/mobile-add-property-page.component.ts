import { Component } from '@angular/core';

@Component({
  selector: 'app-mobile-add-property-page',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>Ajouter une propriété</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="add-property">
        <p>Page d'ajout de propriété à implémenter</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .add-property {
      padding: 1rem;
    }
  `]
})
export class MobileAddPropertyPageComponent {}
