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

// ✅ SUPPRESSION de la fonction hideLoader automatique
// Le DataDrivenLoaderService gère maintenant le masquage du loader
// Cette fonction causait la page blanche en masquant le loader trop tôt

function logAppState() {
  console.log('🔧 État de l\'application après bootstrap Angular...');

  const appRoot = document.querySelector('app-root');
  const routerOutlet = document.querySelector('router-outlet');
  const loader = document.getElementById('app-loading-holder');

  console.log('🔍 État de l\'application:', {
    hasAppRoot: !!appRoot,
    hasRouterOutlet: !!routerOutlet,
    hasLoader: !!loader,
    currentUrl: window.location.href
  });
}

// Démarrer l'application
console.log('🚀 Démarrage de l\'application Ndiye...');

console.log('🚀 Application web Ndiye');

// Fonction de diagnostic simplifiée
function checkAppState() {
  const appRoot = document.querySelector('app-root');
  const routerOutlet = document.querySelector('router-outlet');
  const loader = document.getElementById('app-loading-holder');



  // Vérifier si Angular est bien initialisé
  const hasAngularElements = document.querySelector('[ng-version]') ||
                            document.querySelector('app-root > *');



  // Si l'application semble chargée, laisser DataDrivenLoader gérer
  if (appRoot && (hasAngularElements || appRoot.innerHTML.trim() !== 'Loading...')) {
    // ✅ Ne plus masquer automatiquement le loader ici
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

        // Arrêter les vérifications après 5 secondes
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log('⚠️ Timeout des vérifications - DataDrivenLoader prendra le relais');
          // ✅ Ne plus masquer automatiquement le loader
          // Le DataDrivenLoaderService gère maintenant le timing
        }, 5000);
      }
    }, 50);

    // ✅ SUPPRESSION du timeout de sécurité qui causait la page blanche
    // Le DataDrivenLoaderService gère maintenant le masquage du loader
    console.log('✅ Bootstrap Angular terminé - DataDrivenLoader prend le relais');
  })
  .catch(err => {
    console.error('❌ Erreur critique lors du démarrage:', err);

    // ✅ En cas d'erreur, laisser le timeout de sécurité d'index.html gérer
    // Ne pas masquer automatiquement pour éviter la page blanche
    console.log('🔧 Erreur de bootstrap - timeout de sécurité d\'index.html actif');
  });