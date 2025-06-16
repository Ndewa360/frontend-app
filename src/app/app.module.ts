import { IonicModule } from '@ionic/angular';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID, NgModule, APP_INITIALIZER } from '@angular/core';
import localeFr from '@angular/common/locales/fr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// carbon-components-angular default imports
import { IconModule, ThemeModule, UIShellModule } from 'carbon-components-angular';

// Icons
import { SharedModule } from './shared/shared.module';
import { NgxsModule } from '@ngxs/store';
import { environment } from 'src/environments/environment';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthTokenInterceptor } from './shared/interceptors';
import { registerLocaleData } from '@angular/common';

// Fonction pour s'assurer que les styles sont chargés
export function initStyles() {
  return () => {
    return new Promise<void>((resolve) => {
      // Vérifier si les styles sont chargés
      const checkStyles = () => {
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        let allLoaded = true;
        
        styles.forEach(style => {
          if (!(style as HTMLLinkElement).sheet) {
            allLoaded = false;
          }
        });
        
        if (allLoaded) {
          resolve();
        } else {
          setTimeout(checkStyles, 50);
        }
      };
      
      checkStyles();
    });
  };
}

registerLocaleData(localeFr);

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		AppRoutingModule,
		UIShellModule,
		IconModule,
		HttpClientModule,
		ThemeModule,
		SharedModule,
		NgxsModule.forRoot(
			[] , {
			  developmentMode: !environment.production
			}),
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
		{ provide: LOCALE_ID, useValue: "fr-FR" },
		// S'assurer que les styles sont chargés avant l'initialisation de l'application
		{
			provide: APP_INITIALIZER,
			useFactory: initStyles,
			multi: true
		}
	],
	schemas: [
		CUSTOM_ELEMENTS_SCHEMA
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {
		// Le constructeur est vide
	}
}