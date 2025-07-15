import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-empty-state',
  template: `
    <div class="mobile-empty-state-container">
      <ion-icon [name]="icon" color="medium"></ion-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ion-button *ngIf="buttonText" (click)="onButtonClick()" fill="outline" color="primary">
        <ion-icon [name]="buttonIcon" slot="start"></ion-icon>
        {{ buttonText }}
      </ion-button>
    </div>
  `,
  styles: [`
    .mobile-empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }
    
    ion-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--ion-color-dark);
      font-size: 1.25rem;
    }
    
    p {
      margin: 0 0 1.5rem 0;
      color: var(--ion-color-medium);
      max-width: 300px;
      line-height: 1.5;
    }
  `]
})
export class MobileEmptyStateComponent {
  @Input() icon = 'document';
  @Input() title = 'Aucun élément';
  @Input() message = 'Il n\'y a rien à afficher pour le moment';
  @Input() buttonText = '';
  @Input() buttonIcon = 'add';

  onButtonClick(): void {
    // Émettre un événement ou naviguer
    console.log('Empty state button clicked');
  }
}
