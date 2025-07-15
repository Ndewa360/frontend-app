import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-error',
  template: `
    <div class="mobile-error-container">
      <ion-icon name="alert-circle" color="danger"></ion-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ion-button *ngIf="showRetry" (click)="onRetry()" fill="outline" color="primary">
        <ion-icon name="refresh" slot="start"></ion-icon>
        Réessayer
      </ion-button>
    </div>
  `,
  styles: [`
    .mobile-error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    
    ion-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--ion-color-danger);
    }
    
    p {
      margin: 0 0 1.5rem 0;
      color: var(--ion-color-medium);
    }
  `]
})
export class MobileErrorComponent {
  @Input() title = 'Erreur';
  @Input() message = 'Une erreur est survenue';
  @Input() showRetry = true;

  onRetry(): void {
    // Émettre un événement ou appeler une fonction de retry
    window.location.reload();
  }
}
