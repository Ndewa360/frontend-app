import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mobile-property-units-page',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>Unités de la propriété</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="property-units">
        <p>Page des unités de la propriété à implémenter</p>
        <p>ID Propriété: {{ propertyId }}</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .property-units {
      padding: 1rem;
    }
  `]
})
export class MobilePropertyUnitsPageComponent implements OnInit {
  propertyId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id') || '';
  }
}
