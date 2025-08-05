/// <reference types="@angular/localize" />

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
	enableProdMode();
}

import { register as registerSwiperElements } from 'swiper/element/bundle'

registerSwiperElements();

// Configuration pour l'environnement Capacitor/Cordova (seulement en mode natif)
try {
  if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform()) {
    console.log('📱 Environnement natif détecté');
    // Le débogage WebView sera configuré automatiquement par Capacitor
  }
} catch (error) {
  // Ignorer silencieusement les erreurs de détection de plateforme
}

// // Fonction pour charger un style CSS
// function loadStyle(href: string): Promise<Event> {
//   return new Promise((resolve, reject) => {
//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = href;
//     link.onload = resolve;
//     link.onerror = reject;
//     document.head.appendChild(link);
//   });
// }

// Charger les styles essentiels avant le démarrage de l'application


// Promise.all([
//   loadStyle('theme-light.css'),
//   loadStyle('styles.css')
// ])
// .then(() => {
//   // Démarrer l'application une fois les styles chargés
//   return platformBrowserDynamic().bootstrapModule(AppModule);
// })
// .then(() => {
//   // Masquer l'écran de chargement
//   if (typeof window['appBootstrap'] === 'function') {
//     window['appBootstrap']();
//   }
// })
// .catch(err => console.error(err));

// Fonction pour masquer le loader - OPTIMISÉE
function hideLoader() {
  console.log('🔧 Tentative de masquage du loader...');

  // Utiliser la fonction appBootstrap si disponible (plus rapide)
  if (typeof window['appBootstrap'] === 'function') {
    window['appBootstrap']();
    console.log('✅ Loader supprimé via appBootstrap');
    return;
  }

  // Fallback manuel
  const loader = document.getElementById('app-loading-holder');
  if (loader) {
    console.log('✅ Loader trouvé, masquage en cours...');
    loader.style.transition = 'opacity 0.15s ease-out'; // Plus rapide
    loader.style.opacity = '0';

    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
        console.log('✅ Loader supprimé avec succès');
      }
    }, 150); // Réduit de 300ms à 150ms
  } else {
    console.log('ℹ️ Loader déjà supprimé ou non trouvé');
  }
}

// Démarrer l'application
console.log('🚀 Démarrage de l\'application Ndiye...');

// Détecter si on est sur mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isMobileRoute = window.location.pathname.startsWith('/mobile');

console.log('📱 Détection d\'appareil:', { isMobile, isMobileRoute, userAgent: navigator.userAgent.substring(0, 50) });

// Fonction de diagnostic détaillée
function checkAppState() {
  const appRoot = document.querySelector('app-root');
  const ionApp = document.querySelector('ion-app');
  const routerOutlet = document.querySelector('router-outlet');
  const mobileLayout = document.querySelector('app-mobile-layout');
  const loader = document.getElementById('app-loading-holder');

  console.log('🔍 État détaillé de l\'application:', {
    hasAppRoot: !!appRoot,
    hasIonApp: !!ionApp,
    hasRouterOutlet: !!routerOutlet,
    hasMobileLayout: !!mobileLayout,
    hasLoader: !!loader,
    currentUrl: window.location.href,
    isMobileRoute: window.location.pathname.startsWith('/mobile'),
    appRootContent: appRoot ? appRoot.innerHTML.substring(0, 100) + '...' : 'N/A',
    bodyClasses: document.body.className,
    documentTitle: document.title
  });

  // Vérifier les erreurs dans la console
  if ((window as any).startupErrors && (window as any).startupErrors.length > 0) {
    console.log('❌ Erreurs détectées:', (window as any).startupErrors);
  }

  // Vérifier si Angular est bien initialisé
  const hasAngularElements = document.querySelector('[ng-version]') ||
                            document.querySelector('app-root > *') ||
                            ionApp;

  console.log('🅰️ Angular initialisé:', !!hasAngularElements);

  // Si l'application semble chargée, supprimer le loader
  if (appRoot && (hasAngularElements || appRoot.innerHTML.trim() !== 'Loading...')) {
    console.log('✅ Application semble chargée, suppression du loader');
    hideLoader();
    return true;
  }

  return false;
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then((moduleRef) => {
    console.log('✅ Module Angular bootstrappé avec succès');

    // Vérification immédiate - OPTIMISÉE
    setTimeout(() => {
      if (!checkAppState()) {
        console.log('⏳ Application en cours de chargement...');

        // Vérifications périodiques plus fréquentes
        const checkInterval = setInterval(() => {
          if (checkAppState()) {
            clearInterval(checkInterval);
          }
        }, 200); // Réduit de 500ms à 200ms

        // Arrêter les vérifications après 5 secondes au lieu de 10
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('⚠️ Timeout des vérifications - Suppression forcée du loader');
          hideLoader();
        }, 5000); // Réduit de 10s à 5s
      }
    }, 50); // Réduit de 100ms à 50ms

    // Sécurité : forcer le masquage après un délai adapté à la plateforme - RÉDUIT
    const securityTimeout = isMobile ? 4000 : 2000; // Réduit : 4s mobile, 2s desktop
    setTimeout(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader) {
        console.log(`⚠️ Loader encore présent après ${securityTimeout/1000}s, suppression forcée`);
        hideLoader();

        // Sur mobile ET sur route mobile, vérifier si on doit rediriger vers une page de fallback
        if (isMobile && isMobileRoute) {
          console.log('📱 Redirection mobile vers fallback...');
          setTimeout(() => {
            window.location.href = '/mobile/fallback';
          }, 1000);
        }
      }
    }, securityTimeout);
  })
  .catch(err => {
    console.error('❌ Erreur critique lors du démarrage:', err);

    // Même en cas d'erreur, masquer le loader
    setTimeout(() => {
      hideLoader();

      // Sur mobile ET sur route mobile, rediriger vers la page de fallback
      if (isMobile && window.location.pathname.startsWith('/mobile')) {
        console.log('📱 Erreur de démarrage mobile - Redirection vers fallback');
        setTimeout(() => {
          window.location.href = '/mobile/fallback';
        }, 1000);
      }
    }, 1000);
  });