import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { silentHttp } from 'src/app/shared/http/http-error-context';

/**
 * Préférence « Recevoir les notifications WhatsApp » (reçus de loyer, résumé
 * mensuel, factures d'abonnement impayées). Enregistrée dans les réglages du
 * compte (PUT /user/settings, champ notifWhatsapp), comme sur le mobile.
 * Les messages partent au numéro WhatsApp du profil, sinon au téléphone.
 */
@Component({
  selector: 'app-whatsapp-notifications-toggle',
  standalone: true,
  imports: [NgIf, TranslatePipe],
  template: `
    <div class="wa-toggle">
      <label class="wa-toggle__row">
        <input type="checkbox" [checked]="enabled" [disabled]="loading || saving" (change)="toggle($any($event.target).checked)">
        <span class="wa-toggle__label">{{ 'PROFILE.WHATSAPP_NOTIFICATIONS.LABEL' | translate }}</span>
      </label>
      <p class="wa-toggle__hint">{{ 'PROFILE.WHATSAPP_NOTIFICATIONS.HINT' | translate }}</p>
      <p class="wa-toggle__hint" *ngIf="!enabled && !loading">{{ 'PROFILE.WHATSAPP_NOTIFICATIONS.DISABLED' | translate }}</p>
    </div>
  `,
  styles: [`
    .wa-toggle { margin-top: 8px; }
    .wa-toggle__row { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: .875rem; font-weight: 500; }
    .wa-toggle__row input { width: 18px; height: 18px; accent-color: #25D366; }
    .wa-toggle__hint { margin: 4px 0 0; font-size: .75rem; color: var(--cds-text-02, #6b7280); }
  `],
})
export class WhatsappNotificationsToggleComponent implements OnInit {
  enabled = true;
  loading = true;
  saving = false;
  private readonly api = `${environment.apiUrl}/user/settings`;

  constructor(private http: HttpClient, private toastr: ToastrService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.http.get<{ data?: { notifWhatsapp?: boolean } }>(this.api, { context: silentHttp() }).subscribe({
      next: (res) => { this.enabled = res?.data?.notifWhatsapp !== false; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  toggle(value: boolean): void {
    const previous = this.enabled;
    this.enabled = value;
    this.saving = true;
    this.http.put(this.api, { notifWhatsapp: value }, { context: silentHttp() }).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant(value ? 'PROFILE.WHATSAPP_NOTIFICATIONS.ON' : 'PROFILE.WHATSAPP_NOTIFICATIONS.OFF'), 'Ndewa360°');
      },
      error: () => {
        this.saving = false;
        this.enabled = previous;
        this.toastr.error(this.translate.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY'), 'Ndewa360°');
      },
    });
  }
}
