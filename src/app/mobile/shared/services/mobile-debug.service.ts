import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileDebugService {

  constructor() {}

  /**
   * Forcer la suppression du loader si il reste bloqué
   */
  forceRemoveLoader(): void {
    console.log('🔧 Tentative de suppression forcée du loader...');
    
    const loader = document.getElementById('app-loading-holder');
    if (loader) {
      console.log('✅ Loader trouvé, suppression en cours...');
      
      // Ajouter une transition
      loader.style.transition = 'opacity 0.3s ease-out';
      loader.style.opacity = '0';
      
      // Supprimer après la transition
      setTimeout(() => {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
          console.log('✅ Loader supprimé avec succès');
        }
      }, 300);
    } else {
      console.log('ℹ️ Aucun loader trouvé');
    }
  }

  /**
   * Vérifier l'état du loader
   */
  checkLoaderStatus(): void {
    const loader = document.getElementById('app-loading-holder');
    
    if (loader) {
      console.log('⚠️ Le loader est encore présent !');
      console.log('Styles du loader:', {
        display: loader.style.display,
        opacity: loader.style.opacity,
        visibility: loader.style.visibility
      });
      
      // Forcer la suppression après 2 secondes
      setTimeout(() => {
        this.forceRemoveLoader();
      }, 2000);
    } else {
      console.log('✅ Le loader a été correctement supprimé');
    }
  }

  /**
   * Diagnostiquer les problèmes de démarrage
   */
  diagnoseStartupIssues(): void {
    console.log('🔍 Diagnostic de démarrage mobile...');
    
    // Vérifier l'état du DOM
    console.log('État du DOM:', {
      readyState: document.readyState,
      hasAppRoot: !!document.querySelector('app-root'),
      hasIonApp: !!document.querySelector('ion-app'),
      hasRouterOutlet: !!document.querySelector('ion-router-outlet')
    });
    
    // Vérifier les erreurs JavaScript
    const errors = (window as any).startupErrors || [];
    if (errors.length > 0) {
      console.error('❌ Erreurs de démarrage détectées:', errors);
    }
    
    // Vérifier l'état du loader
    this.checkLoaderStatus();
    
    // Vérifier l'état d'Angular
    const ngZone = (window as any).ng?.getZone?.();
    if (ngZone) {
      console.log('✅ Zone Angular détectée');
    } else {
      console.log('⚠️ Zone Angular non détectée');
    }
  }

  /**
   * Initialiser le debug mobile
   */
  initializeMobileDebug(): void {
    console.log('🚀 Initialisation du debug mobile...');
    
    // Capturer les erreurs de démarrage
    if (!(window as any).startupErrors) {
      (window as any).startupErrors = [];
    }
    
    const originalError = console.error;
    console.error = (...args: any[]) => {
      (window as any).startupErrors.push(args);
      originalError.apply(console, args);
    };
    
    // Diagnostiquer après un délai
    setTimeout(() => {
      this.diagnoseStartupIssues();
    }, 3000);
    
    // Vérification périodique du loader
    const checkInterval = setInterval(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader) {
        console.log('⚠️ Loader encore présent après 5 secondes, suppression forcée...');
        this.forceRemoveLoader();
        clearInterval(checkInterval);
      } else {
        clearInterval(checkInterval);
      }
    }, 5000);
  }

  /**
   * Afficher les informations de debug dans la console
   */
  showDebugInfo(): void {
    console.log('📱 Informations de debug mobile:');
    console.log('- URL actuelle:', window.location.href);
    console.log('- User Agent:', navigator.userAgent);
    console.log('- Taille de l\'écran:', {
      width: window.innerWidth,
      height: window.innerHeight
    });
    console.log('- État du réseau:', navigator.onLine ? 'En ligne' : 'Hors ligne');
    
    // Vérifier les modules Angular
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      console.log('✅ app-root trouvé');
    } else {
      console.log('❌ app-root non trouvé');
    }
    
    const ionApp = document.querySelector('ion-app');
    if (ionApp) {
      console.log('✅ ion-app trouvé');
    } else {
      console.log('❌ ion-app non trouvé');
    }
  }
}
