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
   * Initialiser le debug mobile avec timeout de sécurité
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

    // Timeout de sécurité : forcer la suppression du loader après 10 secondes
    setTimeout(() => {
      console.log('⚠️ Timeout de sécurité - Suppression forcée du loader');
      this.forceRemoveLoader();
    }, 10000);

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

  /**
   * Vérifier et corriger les problèmes de loader mobile
   */
  checkAndFixMobileLoader(): void {
    console.log('🔧 Vérification du loader mobile...');

    // Vérifier si le loader est toujours présent après 5 secondes
    setTimeout(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader) {
        console.log('⚠️ Loader encore présent après 5s - Diagnostic...');

        // Vérifier l'état d'Angular
        const ngZone = (window as any).ng?.getZone?.();
        const hasAngularBootstrapped = !!document.querySelector('app-root ion-app');

        console.log('État du diagnostic:', {
          hasLoader: !!loader,
          hasAngularZone: !!ngZone,
          hasAngularBootstrapped,
          currentUrl: window.location.href,
          readyState: document.readyState
        });

        // Si Angular est démarré mais le loader est toujours là, le supprimer
        if (hasAngularBootstrapped) {
          console.log('✅ Angular démarré - Suppression du loader');
          this.forceRemoveLoader();
        } else {
          console.log('❌ Angular non démarré - Problème de démarrage détecté');
          // Essayer de redémarrer l'application
          this.attemptAppRestart();
        }
      } else {
        console.log('✅ Loader correctement supprimé');
      }
    }, 5000);
  }

  /**
   * Tentative de redémarrage de l'application
   */
  private attemptAppRestart(): void {
    console.log('🔄 Tentative de redémarrage de l\'application...');

    // Supprimer le loader d'abord
    this.forceRemoveLoader();

    // Afficher un message d'erreur à l'utilisateur
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        text-align: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
      ">
        <h3 style="color: #e74c3c; margin-bottom: 10px;">Problème de chargement</h3>
        <p style="margin-bottom: 15px;">L'application a rencontré un problème lors du démarrage.</p>
        <button onclick="window.location.reload()" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">Recharger l'application</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}
