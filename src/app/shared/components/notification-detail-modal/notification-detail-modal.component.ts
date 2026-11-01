import { Component, Inject } from '@angular/core';
import { DatePipe, DecimalPipe, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationManagerService, SmartNotification } from '../../services/notification-manager.service';
import { LanguageUrlService } from '../../services/language-url.service';

/**
 * Détail d'une notification ouvert depuis la barre latérale : message complet,
 * contexte (montant, bien, unité, locataire, période, référence) et actions
 * (marquer comme lue, ouvrir la page ou le document lié, supprimer).
 */
@Component({
  selector: 'app-notification-detail-modal',
  standalone: true,
  imports: [NgIf, DatePipe, DecimalPipe, TranslatePipe],
  template: `
    <div class="ndm" role="dialog" [attr.aria-labelledby]="'ndm-title-' + notification.id">
      <header class="ndm__header">
        <span class="ndm__icon" [class.ndm__icon--urgent]="isUrgent" aria-hidden="true">
          <i class="fas" [class.fa-exclamation-triangle]="isUrgent" [class.fa-bell]="!isUrgent"></i>
        </span>
        <div class="ndm__heading">
          <h2 class="ndm__title" [id]="'ndm-title-' + notification.id">{{ notification.title }}</h2>
          <p class="ndm__meta">
            {{ notification.createdAt | date:'EEEE d MMMM y, HH:mm':'':lang }}
            <span class="ndm__status" [class.ndm__status--unread]="!isRead">
              {{ (isRead ? 'NOTIFICATION_DETAIL.READ' : 'NOTIFICATION_DETAIL.UNREAD') | translate }}
            </span>
          </p>
        </div>
        <button type="button" class="ndm__close" (click)="close()" [attr.aria-label]="'COMMON.CLOSE' | translate">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </header>

      <div class="ndm__body">
        <p class="ndm__message">{{ notification.message }}</p>

        <dl class="ndm__details" *ngIf="hasDetails">
          <ng-container *ngIf="details.amount > 0">
            <dt>{{ 'NOTIFICATION_DETAIL.AMOUNT' | translate }}</dt>
            <dd>{{ details.amount | number:'1.0-0':'fr' }} {{ details.currency === 'XAF' ? 'FCFA' : details.currency }}</dd>
          </ng-container>
          <ng-container *ngIf="details.propertyName">
            <dt>{{ 'NOTIFICATION_DETAIL.PROPERTY' | translate }}</dt><dd>{{ details.propertyName }}</dd>
          </ng-container>
          <ng-container *ngIf="details.roomLabel">
            <dt>{{ 'NOTIFICATION_DETAIL.UNIT' | translate }}</dt><dd>{{ details.roomLabel }}</dd>
          </ng-container>
          <ng-container *ngIf="details.locataireName">
            <dt>{{ 'NOTIFICATION_DETAIL.TENANT' | translate }}</dt><dd>{{ details.locataireName }}</dd>
          </ng-container>
          <ng-container *ngIf="details.period">
            <dt>{{ 'NOTIFICATION_DETAIL.PERIOD' | translate }}</dt><dd>{{ details.period }}</dd>
          </ng-container>
          <ng-container *ngIf="details.paymentMethod">
            <dt>{{ 'NOTIFICATION_DETAIL.PAYMENT_METHOD' | translate }}</dt><dd>{{ details.paymentMethod }}</dd>
          </ng-container>
          <ng-container *ngIf="details.reference">
            <dt>{{ 'NOTIFICATION_DETAIL.REFERENCE' | translate }}</dt><dd class="ndm__ref">{{ details.reference }}</dd>
          </ng-container>
        </dl>
      </div>

      <footer class="ndm__footer">
        <button type="button" class="ndm__btn ndm__btn--danger" (click)="remove()">
          <i class="fas fa-trash-alt" aria-hidden="true"></i> {{ 'NOTIFICATION_DETAIL.DELETE' | translate }}
        </button>
        <span class="ndm__spacer"></span>
        <button *ngIf="!isRead" type="button" class="ndm__btn" (click)="markAsRead()">
          <i class="fas fa-check" aria-hidden="true"></i> {{ 'NOTIFICATION_DETAIL.MARK_AS_READ' | translate }}
        </button>
        <button *ngIf="details.docUrl" type="button" class="ndm__btn" (click)="openDocument()">
          <i class="fas fa-file-pdf" aria-hidden="true"></i> {{ 'NOTIFICATION_DETAIL.ACTIONS.OPEN_DOCUMENT' | translate }}
        </button>
        <button *ngIf="notification.actionRoute" type="button" class="ndm__btn ndm__btn--primary" (click)="openLink()">
          {{ (notification.actionLabel || 'NOTIFICATION_DETAIL.ACTIONS.OPEN') | translate }}
          <i class="fas fa-arrow-right" aria-hidden="true"></i>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .ndm { display: flex; flex-direction: column; max-height: 85vh; color: var(--cds-text-01, #161616);
      background: var(--cds-ui-01, #fff); }
    .ndm__header { display: flex; gap: 12px; align-items: flex-start; padding: 20px 20px 12px; }
    .ndm__icon { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px;
      border-radius: 50%; background: #e0ecff; color: #0f62fe; }
    .ndm__icon--urgent { background: #fff1e6; color: #b45309; }
    .ndm__heading { flex: 1; min-width: 0; }
    .ndm__title { margin: 0; font-size: 1.05rem; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
    .ndm__meta { margin: 4px 0 0; font-size: .8rem; color: var(--cds-text-02, #525252); display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .ndm__status { padding: 1px 8px; border-radius: 10px; background: #e8e8e8; font-size: .72rem; }
    .ndm__status--unread { background: #0f62fe; color: #fff; }
    .ndm__close { flex-shrink: 0; width: 36px; height: 36px; border: 0; border-radius: 50%; background: transparent;
      color: inherit; cursor: pointer; }
    .ndm__close:hover { background: rgba(0,0,0,.06); }
    .ndm__body { padding: 0 20px 16px; overflow-y: auto; }
    .ndm__message { margin: 0 0 16px; line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere; }
    .ndm__details { display: grid; grid-template-columns: minmax(110px, auto) 1fr; gap: 8px 16px; margin: 0;
      padding: 12px 14px; border-radius: 8px; background: var(--cds-ui-02, #f4f4f4); font-size: .875rem; }
    .ndm__details dt { color: var(--cds-text-02, #525252); }
    .ndm__details dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
    .ndm__ref { font-family: monospace; }
    .ndm__footer { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px 20px 20px;
      border-top: 1px solid var(--cds-ui-03, #e0e0e0); }
    .ndm__spacer { flex: 1; }
    .ndm__btn { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 6px;
      border: 1px solid var(--cds-ui-04, #c6c6c6); background: transparent; color: inherit; font-weight: 500; cursor: pointer; }
    .ndm__btn:hover { background: rgba(0,0,0,.05); }
    .ndm__btn--primary { border-color: #0f62fe; background: #0f62fe; color: #fff; }
    .ndm__btn--primary:hover { background: #0353e9; }
    .ndm__btn--danger { border-color: transparent; color: #da1e28; }
    @media (max-width: 480px) {
      .ndm__details { grid-template-columns: 1fr; gap: 2px; }
      .ndm__details dd { margin-bottom: 8px; }
      .ndm__spacer { display: none; }
      .ndm__btn { flex: 1 1 auto; justify-content: center; }
    }
    :host-context(.dark) .ndm__details { background: rgba(255,255,255,.06); }
    :host-context(.dark) .ndm__close:hover, :host-context(.dark) .ndm__btn:hover { background: rgba(255,255,255,.08); }
  `],
})
export class NotificationDetailModalComponent {
  isRead: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public notification: SmartNotification,
    private dialogRef: MatDialogRef<NotificationDetailModalComponent>,
    private notificationManager: NotificationManagerService,
    private router: Router,
    private languageUrlService: LanguageUrlService,
  ) {
    this.isRead = !!notification.isRead;
  }

  get lang(): string {
    return this.languageUrlService.getCurrentLanguage();
  }

  get details(): any {
    return this.notification.data || {};
  }

  get isUrgent(): boolean {
    return this.notification.priority === 'high' || this.notification.priority === 'critical';
  }

  get hasDetails(): boolean {
    const d = this.details;
    return d.amount > 0 || !!(d.propertyName || d.roomLabel || d.locataireName || d.period || d.paymentMethod || d.reference);
  }

  markAsRead(): void {
    this.notificationManager.markAsRead(this.notification.id);
    this.isRead = true;
  }

  remove(): void {
    this.notificationManager.removeNotification(this.notification.id);
    this.dialogRef.close('removed');
  }

  openDocument(): void {
    this.markAsRead();
    window.open(this.details.docUrl, '_blank', 'noopener');
  }

  /** Ouvre la page liée (route sans langue ou déjà préfixée) et marque la notification comme lue. */
  openLink(): void {
    this.markAsRead();
    const route = this.notification.actionRoute!;
    const lang = this.lang;
    const url = route.startsWith(`/${lang}/`) ? route : `/${lang}${route.startsWith('/') ? '' : '/'}${route}`;
    this.dialogRef.close('opened');
    this.router.navigateByUrl(url);
  }

  close(): void {
    this.dialogRef.close();
  }
}
