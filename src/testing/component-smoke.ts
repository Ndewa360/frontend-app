import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxsModule } from '@ngxs/store';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr';
import { provideServiceWorker } from '@angular/service-worker';
import { KundaiModule } from '@kundai/angular';

/**
 * Environnement de test commun aux tests de démarrage des composants :
 * HTTP simulé, routeur, store NGXS, traductions, notifications, dialogues.
 *
 * Les tests générés à la création des composants déclaraient des composants
 * devenus standalone, sans aucune de ces dépendances : ils échouaient tous.
 */
export function configureSmokeTest(component: Type<unknown>, options: { standalone: boolean }): Promise<unknown> {
  return TestBed.configureTestingModule({
    imports: [
      ...(options.standalone ? [component] : []),
      NgxsModule.forRoot([]),
      TranslateModule.forRoot(),
      ToastrModule.forRoot(),
      MatDialogModule,
      NoopAnimationsModule,
    ],
    declarations: options.standalone ? [] : [component],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      provideServiceWorker('ngsw-worker.js', { enabled: false }),
      KundaiModule.forRoot({ baseUrl: '', apiKey: '', appId: 'ndewa360-web-test' }),
      { provide: MAT_DIALOG_DATA, useValue: {} },
      { provide: MatDialogRef, useValue: { close: () => undefined, afterClosed: () => ({ subscribe: () => undefined }) } },
    ],
    schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  }).compileComponents();
}
