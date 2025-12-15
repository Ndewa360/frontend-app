import { Component, Input, OnInit } from '@angular/core';
import { PropertiesTourService } from '../../services/properties-tour.service';

@Component({
  selector: 'app-tour-help-button',
  template: `
    <!-- Bouton d'aide flottant moderne -->
    <div class="tour-help-container">
      <button 
        (click)="testClick()"
        class="tour-help-floating"
        type="button"
        title="Guide interactif - Découvrez les fonctionnalités">
        <div class="tour-help-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="tour-help-pulse"></div>
      </button>
      <div class="tour-help-tooltip">
        <span>Guide interactif</span>
        <div class="tour-help-arrow"></div>
      </div>
    </div>
    
    <!-- Debug info -->
    <div *ngIf="showDebug" class="debug-info">
      <p>Tour Type: {{tourType}}</p>
      <p>Service: {{!!propertiesTourService}}</p>
      <p>Click Count: {{clickCount}}</p>
    </div>
  `,
  styles: [`
    @keyframes helpPulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes helpFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-3px); }
    }
    
    .tour-help-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }
    
    .tour-help-floating {
      position: relative;
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #10b981, #3b82f6);
      color: white;
      border: none;
      border-radius: 50%;
      box-shadow: 
        0 8px 32px rgba(16, 185, 129, 0.3),
        0 0 0 0 rgba(16, 185, 129, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      animation: helpFloat 3s ease-in-out infinite;
      overflow: hidden;
    }
    
    .tour-help-floating::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .tour-help-floating:hover::before {
      opacity: 1;
    }
    
    .tour-help-icon {
      position: relative;
      z-index: 2;
      transition: transform 0.3s ease;
    }
    
    .tour-help-floating:hover .tour-help-icon {
      transform: scale(1.1) rotate(5deg);
    }
    
    .tour-help-pulse {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #3b82f6);
      opacity: 0.6;
      animation: helpPulse 2s ease-in-out infinite;
    }
    
    .tour-help-floating:hover {
      transform: scale(1.05) translateY(-2px);
      box-shadow: 
        0 12px 40px rgba(16, 185, 129, 0.4),
        0 0 0 8px rgba(16, 185, 129, 0.1);
    }
    
    .tour-help-floating:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
    
    .tour-help-tooltip {
      position: absolute;
      bottom: 80px;
      right: 0;
      background: rgba(17, 24, 39, 0.95);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tour-help-container:hover .tour-help-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    
    .tour-help-arrow {
      position: absolute;
      top: 100%;
      right: 20px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(17, 24, 39, 0.95);
    }
    
    /* Debug info */
    .debug-info {
      position: fixed;
      bottom: 100px;
      right: 24px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 999;
    }
    
    /* Responsive */
    @media (max-width: 640px) {
      .tour-help-container {
        bottom: 20px;
        right: 20px;
      }
      
      .tour-help-floating {
        width: 56px;
        height: 56px;
      }
      
      .tour-help-floating svg {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class TourHelpButtonComponent implements OnInit {
  @Input() tourType: 'main' | 'details' | 'add' = 'main';
  @Input() showDebug: boolean = false;
  
  clickCount = 0;

  ngOnInit() {
    console.log('TourHelpButtonComponent ngOnInit - tourType:', this.tourType);
    
    // Test si le service est disponible
    if (!this.propertiesTourService) {
      console.error('PropertiesTourService not available!');
    } else {
      console.log('PropertiesTourService is available');
    }
  }

  constructor(public propertiesTourService: PropertiesTourService) {
    console.log('TourHelpButtonComponent initialized with service:', this.propertiesTourService);
  }

  testClick(): void {
    this.clickCount++;
    console.log('Button clicked! Count:', this.clickCount);
    
    // Tester d'abord si le clic fonctionne
    if (this.clickCount === 1) {
      alert('Le bouton fonctionne ! Clic suivant démarrera le tour.');
      return;
    }
    
    // Ensuite tester le service
    this.startTour();
  }
  
  startTour(): void {
    console.log('TourHelpButton: startTour called with tourType:', this.tourType);
    
    if (!this.propertiesTourService) {
      console.error('PropertiesTourService is not available!');
      alert('Service de tour non disponible');
      return;
    }

    try {
      // Forcer le reset du tour pour les tests
      this.propertiesTourService.resetTour('properties_main');
      
      // Démarrer le tour approprié (pour l'instant, toujours le tour principal)
      console.log('Starting main tour...');
      this.propertiesTourService.startPropertiesMainTour();
      
    } catch (error) {
      console.error('Error starting tour:', error);
      alert('Erreur lors du démarrage du tour: ' + error.message);
    }
  }
}