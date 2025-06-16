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

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));