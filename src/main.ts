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

// Fonction pour masquer le loader
function hideLoader() {
  console.log('🔧 Tentative de masquage du loader...');

  const loader = document.getElementById('app-loading-holder');
  if (loader) {
    console.log('✅ Loader trouvé, masquage en cours...');
    loader.style.transition = 'opacity 0.3s ease-out';
    loader.style.opacity = '0';

    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
        console.log('✅ Loader supprimé avec succès');
      }
    }, 300);
  } else {
    console.log('ℹ️ Loader déjà supprimé ou non trouvé');
  }
}

// Démarrer l'application
console.log('🚀 Démarrage de l\'application Ndiye...');

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    console.log('✅ Application Angular démarrée avec succès');

    // Attendre un peu pour que les composants se chargent
    setTimeout(() => {
      // Essayer d'abord la fonction globale
      if (typeof (window as any)['appBootstrap'] === 'function') {
        console.log('🔧 Utilisation de appBootstrap()');
        (window as any)['appBootstrap']();
      } else {
        console.log('🔧 appBootstrap() non disponible, masquage manuel');
        hideLoader();
      }
    }, 100);

    // Sécurité : forcer le masquage après 3 secondes
    setTimeout(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader) {
        console.log('⚠️ Loader encore présent après 3s, suppression forcée');
        hideLoader();
      }
    }, 3000);
  })
  .catch(err => {
    console.error('❌ Erreur critique lors du démarrage:', err);

    // Même en cas d'erreur, masquer le loader
    setTimeout(() => {
      hideLoader();
    }, 1000);
  });