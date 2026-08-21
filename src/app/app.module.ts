import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import { HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// carbon-components-angular default imports
import { IconModule, ThemeModule, UIShellModule } from 'carbon-components-angular';

// Icons
import { SharedModule } from './shared/shared.module';
import { NgxsModule } from '@ngxs/store';
import { environment } from 'src/environments/environment';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthTokenInterceptor, CorrelationIdInterceptor } from './shared/interceptors';
import { registerLocaleData } from '@angular/common';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { CustomTranslateLoader } from './shared/services/localization/custom-translate-loader';
import { GlobalErrorHandler } from './shared/services/global-error-handler.service';

registerLocaleData(localeFr);
registerLocaleData(localeEn);

export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

/**
 * Locale dynamique basée sur la langue sauvegardée (ndiye-preferred-language).
 * Utilisée pour le formatage des dates/nombres (DatePipe, DecimalPipe...).
 */
export function getDynamicLocale(): string {
  try {
    const lang = localStorage.getItem('ndiye-preferred-language') || 'fr';
    return lang === 'en' ? 'en-US' : 'fr-FR';
  } catch {
    return 'fr-FR';
  }
}

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
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		}),
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: CorrelationIdInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
		{ provide: LOCALE_ID, useFactory: getDynamicLocale },
		{ provide: ErrorHandler, useClass: GlobalErrorHandler },
	],
	schemas: [
		CUSTOM_ELEMENTS_SCHEMA
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {}
}