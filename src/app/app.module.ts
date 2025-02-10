import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID, NgModule } from '@angular/core';
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


  

registerLocaleData(localeFr);

// Components

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
		// {
		// 	provide: LOCALE_ID,
		// 	deps: [SettingsService],      //some service handling global settings
		// 	useFactory: (settingsService) => settingsService.getLanguage()  //returns locale string
		// }
		
	],
	schemas: [
		CUSTOM_ELEMENTS_SCHEMA
	  ],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {
		
	}
}
