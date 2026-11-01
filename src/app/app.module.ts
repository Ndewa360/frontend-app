import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorHandler, LOCALE_ID, NgModule } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import { HttpClient, HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// carbon-components-angular default imports
import { IconModule, ThemeModule } from 'carbon-components-angular';

// Icons
import { SharedModule } from './shared/shared.module';
import { NgxsModule } from '@ngxs/store';
import { environment } from 'src/environments/environment';
import { AuthTokenInterceptor, CorrelationIdInterceptor } from './shared/interceptors';
import { registerLocaleData } from '@angular/common';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { CustomTranslateLoader } from './shared/services/localization/custom-translate-loader';
import { GlobalErrorHandler } from './shared/services/global-error-handler.service';
import { KundaiModule } from '@kundai/angular';
import { DynamicLocaleId } from './shared/services/localization/app-locale';

registerLocaleData(localeFr);
registerLocaleData(localeEn);

export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

/**
 * Locale des dates et nombres (DatePipe, DecimalPipe...) : suit la langue
 * courante de l'interface (voir shared/services/localization/app-locale.ts).
 */
export function getDynamicLocale(): string {
  return new DynamicLocaleId() as unknown as string;
}

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		AppRoutingModule,
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
		ServiceWorkerModule.register('ngsw-worker.js', {
			enabled: environment.production
		}),
	],
	providers: [
		{ provide: HTTP_INTERCEPTORS, useClass: CorrelationIdInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
		{ provide: LOCALE_ID, useFactory: getDynamicLocale },
		{ provide: ErrorHandler, useClass: GlobalErrorHandler },
		KundaiModule.forRoot({
			baseUrl: environment.kundaiTrackingUrl,
			apiKey: environment.kundaiApiKey,
			appId: 'ndewa360-web',
		}),
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {}
}