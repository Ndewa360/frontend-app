import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MobileDebugService } from '../../services/mobile-debug.service';

@Component({
  selector: 'app-mobile-fallback',
  template: `
    <ion-content class="fallback-content">
      <div class="fallback-container">
        <div class="fallback-icon">
          <ion-icon name="construct-outline" size="large"></ion-icon>
        </div>
        
        <h2>Chargement en cours...</h2>
        <p>Initialisation de l'application mobile</p>
        
        <div class="loading-spinner">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
        
        <div class="fallback-actions" *ngIf="showActions">
          <ion-button 
            fill="outline" 
            (click)="retryInitialization()"
            class="retry-btn">
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Réessayer
          </ion-button>
          
          <ion-button 
            fill="clear" 
            (click)="goToWebVersion()"
            class="web-btn">
            <ion-icon name="desktop-outline" slot="start"></ion-icon>
            Version Web
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .fallback-content {
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .fallback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 2rem;
      text-align: center;
      color: white;
    }
    
    .fallback-icon {
      margin-bottom: 2rem;
      opacity: 0.8;
    }
    
    h2 {
      color: white;
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }
    
    p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }
    
    .loading-spinner {
      margin-bottom: 3rem;
    }
    
    .fallback-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 300px;
    }
    
    .retry-btn {
      --color: white;
      --border-color: white;
    }
    
    .web-btn {
      --color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class MobileFallbackComponent implements OnInit {
  showActions = false;

  constructor(
    private router: Router,
    private debugService: MobileDebugService
  ) {}

  ngOnInit(): void {
    // Afficher les actions après 5 secondes si toujours sur cette page
    setTimeout(() => {
      this.showActions = true;
    }, 5000);

    // Essayer de rediriger automatiquement après 3 secondes
    setTimeout(() => {
      this.attemptAutoRedirect();
    }, 3000);
  }

  /**
   * Tentative de redirection automatique
   */
  private attemptAutoRedirect(): void {
    try {
      // Essayer de naviguer vers la recherche
      this.router.navigate(['/mobile/search']).catch(error => {
        console.error('❌ Erreur de navigation automatique:', error);
        this.showActions = true;
      });
    } catch (error) {
      console.error('❌ Erreur lors de la redirection automatique:', error);
      this.showActions = true;
    }
  }

  /**
   * Réessayer l'initialisation
   */
  retryInitialization(): void {
    console.log('🔄 Nouvelle tentative d\'initialisation...');
    
    // Supprimer le loader s'il existe
    this.debugService.forceRemoveLoader();
    
    // Recharger la page
    window.location.reload();
  }

  /**
   * Aller vers la version web
   */
  goToWebVersion(): void {
    console.log('🌐 Redirection vers la version web...');
    
    // Rediriger vers la version web
    const webUrl = window.location.origin + '/search';
    window.location.href = webUrl;
  }
}
