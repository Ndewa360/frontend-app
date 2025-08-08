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

console.log('🚀 Application web Ndiye');

// Fonction de diagnostic simplifiée
function checkAppState() {
  const appRoot = document.querySelector('app-root');
  const routerOutlet = document.querySelector('router-outlet');
  const loader = document.getElementById('app-loading-holder');

  console.log('🔍 État de l\'application:', {
    hasAppRoot: !!appRoot,
    hasRouterOutlet: !!routerOutlet,
    hasLoader: !!loader,
    currentUrl: window.location.href
  });

  // Vérifier si Angular est bien initialisé
  const hasAngularElements = document.querySelector('[ng-version]') ||
                            document.querySelector('app-root > *');

  console.log('🅰️ Angular initialisé:', !!hasAngularElements);

  // Si l'application semble chargée, supprimer le loader
  if (appRoot && (hasAngularElements || appRoot.innerHTML.trim() !== 'Loading...')) {
    console.log('✅ Application chargée, suppression du loader');
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

    // Sécurité : forcer le masquage après 2 secondes
    setTimeout(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader) {
        console.log('⚠️ Loader encore présent après 2s, suppression forcée');
        hideLoader();
      }
    }, 2000);
  })
  .catch(err => {
    console.error('❌ Erreur critique lors du démarrage:', err);

    // Même en cas d'erreur, masquer le loader
    setTimeout(() => {
      hideLoader();
    }, 1000);
  });