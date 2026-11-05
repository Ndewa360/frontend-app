import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

export interface ConfirmDeleteDetail {
  label: string;
  value: string | number | null | undefined;
}

/**
 * Modèle unique de confirmation de suppression (et de retrait d'accès),
 * utilisé par toutes les fenêtres de suppression de l'application :
 *
 *  1. en-tête : icône, titre, sous-titre, fermeture ;
 *  2. phrase principale : ce qui va être supprimé, en gras ;
 *  3. détails de l'élément (liste libellé / valeur, ou contenu projeté) ;
 *  4. conséquences, puis note éventuelle ;
 *  5. saisie de confirmation facultative (nom à recopier) ;
 *  6. message d'erreur du serveur, affiché dans la fenêtre ;
 *  7. boutons « Annuler » (focus par défaut) et « Supprimer » (rouge, avec
 *     indicateur de chargement).
 *
 * Le composant ne fait qu'afficher : la fenêtre qui l'utilise garde sa logique
 * (appel au serveur, fermeture) et lui transmet `busy` et `error`.
 */
@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [NgIf, NgFor, NgTemplateOutlet, FormsModule, TranslatePipe],
  template: `
    <div class="cd-backdrop" *ngIf="overlay; else dialog" (click)="onBackdrop($event)">
      <ng-container *ngTemplateOutlet="dialog"></ng-container>
    </div>
    <ng-template #dialog>
    <div class="cd" role="alertdialog" aria-modal="true" [attr.aria-labelledby]="titleId" [attr.aria-describedby]="leadId">
      <header class="cd__header">
        <div class="cd__icon" [class.cd__icon--warning]="tone === 'warning'" aria-hidden="true">
          <i [class]="icon"></i>
        </div>
        <div class="cd__heading">
          <h2 class="cd__title" [id]="titleId">{{ title }}</h2>
          <p class="cd__subtitle">{{ subtitle || ('DELETE_DIALOG.IRREVERSIBLE' | translate) }}</p>
        </div>
        <button type="button" class="cd__close" (click)="cancel.emit()" [disabled]="busy"
                [attr.aria-label]="'DELETE_DIALOG.CLOSE' | translate">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </header>

      <div class="cd__body">
        <p class="cd__lead" [id]="leadId">
          {{ lead || ('DELETE_DIALOG.LEAD' | translate) }}
          <strong *ngIf="subject">{{ subject }}</strong><span *ngIf="subject">.</span>
        </p>

        <dl class="cd__details" *ngIf="details?.length">
          <div class="cd__detail" *ngFor="let d of visibleDetails">
            <dt>{{ d.label }}</dt>
            <dd>{{ d.value }}</dd>
          </div>
        </dl>
        <ng-content select="[confirmDeleteDetails]"></ng-content>

        <section class="cd__consequences" *ngIf="consequences?.length">
          <h3 class="cd__section-title">{{ 'DELETE_DIALOG.CONSEQUENCES' | translate }}</h3>
          <ul>
            <li *ngFor="let c of consequences">{{ c }}</li>
          </ul>
        </section>

        <p class="cd__note" *ngIf="note">
          <i class="fas fa-info-circle" aria-hidden="true"></i>
          <span>{{ note }}</span>
        </p>

        <label class="cd__typed" *ngIf="confirmText">
          <span [innerText]="'DELETE_DIALOG.TYPE_TO_CONFIRM' | translate: { text: confirmText }"></span>
          <input type="text" [(ngModel)]="typed" [disabled]="busy" autocomplete="off" spellcheck="false" />
        </label>

        <div class="cd__error" role="alert" *ngIf="error">
          <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
          <span>{{ error }}</span>
        </div>
      </div>

      <footer class="cd__footer">
        <button #cancelButton type="button" class="cd__btn cd__btn--cancel" (click)="cancel.emit()" [disabled]="busy">
          {{ cancelLabel || ('DELETE_DIALOG.CANCEL' | translate) }}
        </button>
        <button type="button" class="cd__btn cd__btn--danger" (click)="onConfirm()" [disabled]="!canConfirm">
          <span class="cd__spinner" *ngIf="busy" aria-hidden="true"></span>
          {{ busy ? (busyLabel || ('DELETE_DIALOG.IN_PROGRESS' | translate)) : (confirmLabel || ('DELETE_DIALOG.CONFIRM' | translate)) }}
        </button>
      </footer>
    </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .cd-backdrop { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center;
      padding: 16px; background: rgba(15, 23, 42, .55); }
    .cd-backdrop .cd { box-shadow: 0 20px 50px rgba(0, 0, 0, .3); }
    .cd { width: min(520px, 100%); max-height: 90vh; display: flex; flex-direction: column;
      background: var(--theme-appUIForegroundBg, #fff); color: var(--theme-appTextPrimary, #111827);
      border-radius: 14px; overflow: hidden; }
    .cd__header { display: flex; align-items: flex-start; gap: 14px; padding: 20px 20px 12px; }
    .cd__icon { flex: 0 0 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: #fee2e2; color: #dc2626; font-size: 18px; }
    .cd__icon--warning { background: #fef3c7; color: #b45309; }
    .cd__heading { flex: 1; min-width: 0; }
    .cd__title { margin: 0; font-size: 1.125rem; font-weight: 700; line-height: 1.3; }
    .cd__subtitle { margin: 2px 0 0; font-size: .8125rem; color: var(--theme-appTextSecondary, #6b7280); }
    .cd__close { flex: 0 0 auto; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent;
      color: var(--theme-appTextSecondary, #6b7280); cursor: pointer; }
    .cd__close:hover:not(:disabled) { background: var(--theme-appUIBg, #f3f4f6); }
    .cd__body { padding: 4px 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
    .cd__lead { margin: 0; font-size: .9375rem; line-height: 1.5; }
    .cd__details { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--theme-appUIBg, #f9fafb);
      border: 1px solid var(--theme-appBorderColor, #e5e7eb); display: grid; gap: 8px; }
    .cd__detail { display: flex; justify-content: space-between; gap: 12px; font-size: .875rem; }
    .cd__detail dt { color: var(--theme-appTextSecondary, #6b7280); }
    .cd__detail dd { margin: 0; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
    .cd__section-title { margin: 0 0 6px; font-size: .8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: .02em;
      color: var(--theme-appTextSecondary, #6b7280); }
    .cd__consequences ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: .875rem; }
    .cd__note { margin: 0; display: flex; gap: 8px; padding: 10px 12px; border-radius: 10px; font-size: .8125rem;
      background: #eff6ff; color: #1e3a8a; }
    .cd__typed { display: grid; gap: 6px; font-size: .875rem; }
    .cd__typed input { min-height: 40px; padding: 0 12px; border-radius: 8px; font: inherit;
      border: 1px solid var(--theme-appBorderColor, #d1d5db); background: var(--theme-appUIForegroundBg, #fff); color: inherit; }
    .cd__error { display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; font-size: .875rem;
      background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .cd__footer { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; padding: 14px 20px 18px;
      border-top: 1px solid var(--theme-appBorderColor, #e5e7eb); }
    .cd__btn { min-height: 44px; padding: 0 18px; border-radius: 8px; font-weight: 600; font-size: .9375rem; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px; border: 1px solid transparent; }
    .cd__btn:disabled { opacity: .55; cursor: not-allowed; }
    .cd__btn--cancel { background: transparent; color: inherit; border-color: var(--theme-appBorderColor, #d1d5db); }
    .cd__btn--cancel:hover:not(:disabled) { background: var(--theme-appUIBg, #f3f4f6); }
    .cd__btn--danger { background: #dc2626; color: #fff; }
    .cd__btn--danger:hover:not(:disabled) { background: #b91c1c; }
    .cd__btn:focus-visible, .cd__close:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
    .cd__spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
      animation: cd-spin .8s linear infinite; }
    @keyframes cd-spin { to { transform: rotate(360deg); } }
    @media (max-width: 480px) {
      .cd__footer { flex-direction: column-reverse; }
      .cd__btn { width: 100%; justify-content: center; }
    }
  `],
})
export class ConfirmDeleteComponent implements AfterViewInit {
  private static seq = 0;
  readonly titleId = `cd-title-${++ConfirmDeleteComponent.seq}`;
  readonly leadId = `cd-lead-${ConfirmDeleteComponent.seq}`;

  /** Titre (déjà traduit). */
  @Input() title = '';
  @Input() subtitle?: string;
  /** Phrase principale ; par défaut « Vous allez supprimer définitivement ». */
  @Input() lead?: string;
  /** Élément supprimé, affiché en gras. */
  @Input() subject?: string | null;
  @Input() details: ConfirmDeleteDetail[] = [];
  @Input() consequences: string[] = [];
  @Input() note?: string | null;
  /** Texte à recopier pour confirmer (suppressions lourdes). */
  @Input() confirmText?: string | null;
  @Input() confirmLabel?: string;
  @Input() busyLabel?: string;
  @Input() cancelLabel?: string;
  @Input() icon = 'fas fa-trash-alt';
  @Input() tone: 'danger' | 'warning' = 'danger';
  @Input() busy = false;
  /** Suppression impossible (dépendances) : bouton désactivé. */
  @Input() blocked = false;
  /** Message d'erreur (serveur), affiché dans la fenêtre. */
  @Input() error: string | null = null;
  /**
   * Affichage autonome, sur fond assombri (fenêtres écrites dans une page
   * plutôt qu'ouvertes par MatDialog) : clic sur le fond et Échap annulent.
   */
  @Input() overlay = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  typed = '';

  get visibleDetails(): ConfirmDeleteDetail[] {
    return (this.details || []).filter((d) => d.value !== null && d.value !== undefined && d.value !== '');
  }

  get canConfirm(): boolean {
    if (this.busy || this.blocked) return false;
    if (!this.confirmText) return true;
    return this.typed.trim().toLowerCase() === String(this.confirmText).trim().toLowerCase();
  }

  ngAfterViewInit(): void {
    // Focus sur « Annuler » : un appui sur Entrée ne supprime pas par erreur.
    setTimeout(() => this.cancelButton?.nativeElement.focus());
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.busy) this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.overlay && !this.busy) this.cancel.emit();
  }

  onConfirm(): void {
    if (this.canConfirm) this.confirm.emit();
  }
}

/** Message lisible d'une erreur HTTP (message du serveur, sinon [fallback]). */
export function deleteErrorMessage(error: any, fallback: string): string {
  const message = error?.error?.message ?? error?.message;
  const text = Array.isArray(message) ? message[0] : message;
  return typeof text === 'string' && text.trim() && !/^Http failure/i.test(text) ? text : fallback;
}
