import { Injectable } from '@angular/core';

interface TourStep {
  id: string;
  title: string;
  text: string;
  element: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showSkip?: boolean;
  showPrevious?: boolean;
  showNext?: boolean;
  isLast?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PropertiesTourService {
  private currentTour: any = null;
  private tourSteps: TourStep[] = [];

  constructor() {}

  // Tour principal du module propriétés
  startPropertiesMainTour(): void {
    console.log('PropertiesTourService: startPropertiesMainTour called');
    
    if (this.hasTourBeenSeen('properties_main')) {
      console.log('Tour already seen, skipping...');
      return;
    }
    
    console.log('Starting properties main tour...');

    this.tourSteps = [
      {
        id: 'welcome',
        title: '✨ Bienvenue dans votre Tableau de Bord',
        text: 'Découvrez une gestion immobilière simplifiée et puissante. Ce guide vous accompagnera dans la découverte des fonctionnalités essentielles de Ndewa360.',
        element: 'body',
        position: 'center',
        showSkip: true,
        showNext: true
      },
      {
        id: 'metrics',
        title: '📈 Tableau de Bord Analytique',
        text: 'Visualisez instantanément vos performances : portfolio immobilier, taux d\'occupation, revenus mensuels et tendances. Ces métriques vous donnent une vue d\'ensemble de votre activité.',
        element: '.grid.grid-cols-2.md\\:grid-cols-4',
        position: 'bottom',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'properties-grid',
        title: '🏢 Portfolio de Propriétés',
        text: 'Chaque propriété est présentée avec ses indicateurs clés : statut d\'occupation, revenus générés, alertes importantes et actions rapides. Une vue synthétique pour une gestion optimale.',
        element: '.grid.grid-cols-1.md\\:grid-cols-2',
        position: 'top',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'property-card',
        title: '🎯 Gestion Détaillée',
        text: 'Cliquez sur n\'importe quelle propriété pour accéder à sa gestion complète : locataires, paiements, maintenance, historique. Tout est centralisé pour votre efficacité.',
        element: 'app-property-overview-card:first-child',
        position: 'right',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'completion',
        title: '🚀 Prêt à Démarrer !',
        text: 'Félicitations ! Vous maîtrisez maintenant les bases de votre tableau de bord. Explorez, expérimentez et optimisez votre gestion immobilière avec confiance.',
        element: 'body',
        position: 'center',
        showPrevious: true,
        isLast: true
      }
    ];

    this.startTour('properties_main');
  }

  // Tour pour les détails d'une propriété
  startPropertyDetailsTour(): void {
    if (this.hasTourBeenSeen('property_details')) {
      return;
    }

    this.tourSteps = [
      {
        id: 'property-header',
        title: '🏛️ Centre de Contrôle',
        text: 'Voici le centre de contrôle de votre propriété. Accédez rapidement aux informations essentielles : identité, localisation, statut global et actions prioritaires.',
        element: '.property-header',
        position: 'bottom',
        showSkip: true,
        showNext: true
      },
      {
        id: 'tabs-navigation',
        title: '🗂️ Navigation Intelligente',
        text: 'Organisez votre gestion avec ces onglets spécialisés : Vue d\'ensemble pour la synthèse, Unités pour la gestion locative, Locataires pour les relations, Finances pour la rentabilité.',
        element: '.tabs-container',
        position: 'bottom',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'units-list',
        title: '🏘️ Gestion Locative Avancée',
        text: 'Maîtrisez chaque unité de votre propriété : création, modification, attribution aux locataires, suivi des loyers et gestion des incidents. Tout est centralisé ici.',
        element: '.units-grid',
        position: 'top',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'financial-dashboard',
        title: '💎 Intelligence Financière',
        text: 'Transformez vos données en insights : analyse des revenus, suivi des dépenses, calcul de rentabilité, prévisions et rapports détaillés. Votre cockpit financier personnel.',
        element: '.financial-dashboard',
        position: 'top',
        showSkip: true,
        showPrevious: true,
        isLast: true
      }
    ];

    this.startTour('property_details');
  }

  // Tour pour l'ajout d'une propriété
  startAddPropertyTour(): void {
    if (this.hasTourBeenSeen('add_property')) {
      return;
    }

    this.tourSteps = [
      {
        id: 'form-intro',
        title: '🎯 Création de Propriété',
        text: 'Bienvenue dans l\'assistant de création ! En quelques étapes simples, vous allez enrichir votre portfolio immobilier. Chaque information compte pour optimiser votre gestion.',
        element: '.add-property-form',
        position: 'top',
        showSkip: true,
        showNext: true
      },
      {
        id: 'basic-info',
        title: '🏗️ Fondations de la Propriété',
        text: 'Établissez l\'identité de votre bien : nom distinctif, adresse précise, type de propriété. Ces informations formeront la base de toute votre gestion future.',
        element: '.basic-info-section',
        position: 'right',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'units-config',
        title: '🏠 Architecture Locative',
        text: 'Structurez votre propriété en unités locatives : nombre de logements, caractéristiques (chambres, superficie), tarification. Cette configuration déterminera votre potentiel de revenus.',
        element: '.units-config-section',
        position: 'left',
        showSkip: true,
        showPrevious: true,
        showNext: true
      },
      {
        id: 'save-property',
        title: '✅ Finalisation & Activation',
        text: 'Dernière étape ! Vérifiez soigneusement toutes vos informations puis activez votre propriété. Elle rejoindra immédiatement votre portfolio et sera prête pour la gestion locative.',
        element: '.save-button',
        position: 'top',
        showSkip: true,
        showPrevious: true,
        isLast: true
      }
    ];

    this.startTour('add_property');
  }

  private startTour(tourId: string): void {
    console.log('Starting tour with ID:', tourId);
    this.showTourStep(0, tourId);
  }

  private showTourStep(stepIndex: number, tourId: string): void {
    if (stepIndex >= this.tourSteps.length) {
      this.completeTour(tourId);
      return;
    }

    const step = this.tourSteps[stepIndex];
    const element = document.querySelector(step.element);

    if (!element && step.element !== 'body') {
      // Si l'élément n'existe pas, passer à l'étape suivante
      setTimeout(() => this.showTourStep(stepIndex + 1, tourId), 100);
      return;
    }

    this.createTourOverlay(step, stepIndex, tourId);
  }

  private createTourOverlay(step: TourStep, stepIndex: number, tourId: string): void {
    // Supprimer l'overlay existant
    this.removeTourOverlay();

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.innerHTML = `
      <div class="tour-backdrop"></div>
      <div class="tour-popup" id="tour-popup">
        <div class="tour-header">
          <h3 class="tour-title">${step.title}</h3>
          <button class="tour-close" onclick="window.tourService.skipTour('${tourId}')" title="Fermer le guide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="tour-content">
          <p class="tour-text">${step.text}</p>
        </div>
        <div class="tour-footer">
          <div class="tour-progress">
            <span class="tour-step-counter">${stepIndex + 1} / ${this.tourSteps.length}</span>
          </div>
          <div class="tour-buttons">
            ${step.showSkip ? `<button class="tour-btn tour-btn-skip" onclick="window.tourService.skipTour('${tourId}')">Ignorer</button>` : ''}
            ${step.showPrevious ? `<button class="tour-btn tour-btn-prev" onclick="window.tourService.previousStep(${stepIndex}, '${tourId}')">Précédent</button>` : ''}
            ${step.showNext ? `<button class="tour-btn tour-btn-next" onclick="window.tourService.nextStep(${stepIndex}, '${tourId}')">${step.isLast ? 'Terminer' : 'Suivant'}</button>` : ''}
            ${step.isLast ? `<button class="tour-btn tour-btn-finish" onclick="window.tourService.completeTour('${tourId}')">Terminer</button>` : ''}
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles
    this.addTourStyles();

    // Ajouter l'overlay au DOM
    document.body.appendChild(overlay);

    // Positionner le popup
    this.positionTourPopup(step);

    // Exposer les méthodes globalement pour les boutons
    (window as any).tourService = {
      nextStep: (currentIndex: number, tourId: string) => this.showTourStep(currentIndex + 1, tourId),
      previousStep: (currentIndex: number, tourId: string) => this.showTourStep(currentIndex - 1, tourId),
      skipTour: (tourId: string) => this.skipTour(tourId),
      completeTour: (tourId: string) => this.completeTour(tourId)
    };
  }

  private positionTourPopup(step: TourStep): void {
    const popup = document.getElementById('tour-popup');
    const element = step.element === 'body' ? null : document.querySelector(step.element);

    if (!popup) return;

    if (!element || step.element === 'body') {
      // Centrer le popup
      popup.style.position = 'fixed';
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = element.getBoundingClientRect();
    popup.style.position = 'fixed';

    switch (step.position) {
      case 'top':
        popup.style.top = `${rect.top - popup.offsetHeight - 10}px`;
        popup.style.left = `${rect.left + rect.width / 2 - popup.offsetWidth / 2}px`;
        break;
      case 'bottom':
        popup.style.top = `${rect.bottom + 10}px`;
        popup.style.left = `${rect.left + rect.width / 2 - popup.offsetWidth / 2}px`;
        break;
      case 'left':
        popup.style.top = `${rect.top + rect.height / 2 - popup.offsetHeight / 2}px`;
        popup.style.left = `${rect.left - popup.offsetWidth - 10}px`;
        break;
      case 'right':
        popup.style.top = `${rect.top + rect.height / 2 - popup.offsetHeight / 2}px`;
        popup.style.left = `${rect.right + 10}px`;
        break;
      default:
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }

    // Highlight de l'élément
    element.classList.add('tour-highlight');
  }

  private addTourStyles(): void {
    if (document.getElementById('tour-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'tour-styles';
    styles.textContent = `
      @keyframes tourFadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      @keyframes tourSlideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes tourPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      }
      
      .tour-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        pointer-events: none;
        animation: tourFadeIn 0.3s ease-out;
      }
      
      .tour-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
        backdrop-filter: blur(2px);
        pointer-events: auto;
      }
      
      .tour-popup {
        background: linear-gradient(145deg, #ffffff, #f8fafc);
        border-radius: 16px;
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.8),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
        max-width: 420px;
        min-width: 320px;
        pointer-events: auto;
        border: 1px solid rgba(16, 185, 129, 0.2);
        animation: tourSlideIn 0.4s ease-out;
        position: relative;
        overflow: hidden;
      }
      
      .tour-popup::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
      }
      
      .tour-header {
        padding: 24px 24px 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
      }
      
      .tour-title {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #10b981, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        line-height: 1.3;
        letter-spacing: -0.025em;
      }
      
      .tour-close {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 8px;
        font-size: 18px;
        color: #ef4444;
        cursor: pointer;
        padding: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .tour-close:hover {
        background: rgba(239, 68, 68, 0.15);
        transform: scale(1.05);
      }
      
      .tour-content {
        padding: 20px 24px;
      }
      
      .tour-text {
        color: #374151;
        line-height: 1.7;
        margin: 0;
        font-size: 15px;
        font-weight: 400;
      }
      
      .tour-footer {
        padding: 0 24px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(229, 231, 235, 0.5);
        margin-top: 16px;
        padding-top: 20px;
      }
      
      .tour-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }
      
      .tour-step-counter {
        background: linear-gradient(135deg, #10b981, #3b82f6);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .tour-buttons {
        display: flex;
        gap: 10px;
      }
      
      .tour-btn {
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .tour-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      .tour-btn:hover::before {
        left: 100%;
      }
      
      .tour-btn-skip {
        background: rgba(107, 114, 128, 0.1);
        color: #6b7280;
        border-color: rgba(107, 114, 128, 0.2);
      }
      
      .tour-btn-skip:hover {
        background: rgba(107, 114, 128, 0.15);
        color: #374151;
        transform: translateY(-1px);
      }
      
      .tour-btn-prev {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        color: #374151;
        border-color: #d1d5db;
      }
      
      .tour-btn-prev:hover {
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .tour-btn-next, .tour-btn-finish {
        background: linear-gradient(135deg, #10b981, #3b82f6);
        color: white;
        border-color: transparent;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      }
      
      .tour-btn-next:hover, .tour-btn-finish:hover {
        background: linear-gradient(135deg, #059669, #2563eb);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      }
      
      .tour-highlight {
        position: relative;
        z-index: 10001;
        border-radius: 12px;
        animation: tourPulse 2s infinite;
        transition: all 0.3s ease;
      }
      
      .tour-highlight::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: linear-gradient(135deg, #10b981, #3b82f6);
        border-radius: 16px;
        z-index: -1;
        opacity: 0.3;
      }
      
      /* Responsive design */
      @media (max-width: 640px) {
        .tour-popup {
          max-width: 90vw;
          min-width: 280px;
          margin: 20px;
        }
        
        .tour-header, .tour-content, .tour-footer {
          padding-left: 20px;
          padding-right: 20px;
        }
        
        .tour-buttons {
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .tour-btn {
          padding: 8px 14px;
          font-size: 13px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  private removeTourOverlay(): void {
    const overlay = document.querySelector('.tour-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Supprimer les highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  }

  private completeTour(tourId: string): void {
    this.markTourAsSeen(tourId);
    this.removeTourOverlay();
    this.removeTourStyles();
  }

  private skipTour(tourId: string): void {
    this.markTourAsSeen(tourId);
    this.removeTourOverlay();
    this.removeTourStyles();
  }

  private removeTourStyles(): void {
    const styles = document.getElementById('tour-styles');
    if (styles) {
      styles.remove();
    }
    // Nettoyer les références globales
    delete (window as any).tourService;
  }

  private hasTourBeenSeen(tourId: string): boolean {
    const seen = localStorage.getItem(`ndewa_tour_${tourId}`) === 'completed';
    console.log(`Tour ${tourId} has been seen:`, seen);
    return seen;
  }

  private markTourAsSeen(tourId: string): void {
    localStorage.setItem(`ndewa_tour_${tourId}`, 'completed');
  }

  // Méthodes publiques pour réinitialiser les tours
  resetTour(tourId: string): void {
    localStorage.removeItem(`ndewa_tour_${tourId}`);
  }

  resetAllTours(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('ndewa_tour_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
}