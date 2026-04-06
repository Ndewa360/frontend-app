/// <reference types="@angular/localize" />

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from '@vercel/speed-insights';
import { register as registerSwiperElements } from 'swiper/element/bundle';

if (environment.production) {
  enableProdMode();
}

registerSwiperElements();
inject();
injectSpeedInsights();

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .then(() => {
    // Angular est bootstrappé — retirer le loader HTML immédiatement.
    // Le DataDrivenLoaderService affiche son propre overlay Angular
    // pendant le chargement des données, évitant la page blanche.
    if (typeof window['appBootstrap'] === 'function') {
      window['appBootstrap']();
    } else {
      const loader = document.getElementById('app-loading-holder');
      if (loader?.parentNode) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => loader.parentNode?.removeChild(loader), 200);
      }
    }
  })
  .catch(err => {
    console.error('Erreur critique au démarrage:', err);
    // En cas d'erreur, retirer quand même le loader après 3s
    setTimeout(() => {
      const loader = document.getElementById('app-loading-holder');
      if (loader?.parentNode) loader.parentNode.removeChild(loader);
    }, 3000);
  });
