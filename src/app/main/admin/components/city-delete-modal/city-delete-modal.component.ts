import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';
import { NgIf, AsyncPipe } from '@angular/common';
import { ConfirmDeleteComponent, ConfirmDeleteDetail } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface CityToDelete {
  _id: string;
  fullName: string;
  country?: {
    _id: string;
    fullName: string;
  };
  isActive?: boolean;
  population?: number;
  propertyCount?: number;
  userCount?: number;
}

@Component({
  selector: 'app-city-delete-modal',
  standalone: true,
  imports: [TranslateModule, NgIf, AsyncPipe, ConfirmDeleteComponent],
  template: `
    <div *ngIf="isOpen" class="cdm-overlay" (click)="onOverlayClick($event)" (keydown)="onKeyDown($event)" tabindex="0">
      <app-confirm-delete *ngIf="city"
        [title]="'ADMIN.CITY_DELETE.SUPPRIMER_LA_VILLE' | translate"
        [subtitle]="'ADMIN.CITY_DELETE.CETTE_ACTION_EST_IRREVERSIBLE' | translate"
        [subject]="city.fullName"
        [details]="details"
        [consequences]="consequences"
        [note]="getWarningMessage()"
        [busy]="(isDeleting$ | async) || false"
        [error]="deleteError$ | async"
        [cancelLabel]="'ADMIN.CITY_DELETE.ANNULER' | translate"
        [confirmLabel]="'ADMIN.CITY_DELETE.SUPPRIMER_DEFINITIVEMENT' | translate"
        [busyLabel]="'ADMIN.CITY_DELETE.SUPPRESSION_EN_COURS' | translate"
        (cancel)="onCancel()"
        (confirm)="onConfirmDelete()">
      </app-confirm-delete>
    </div>
  `,
  styles: [`
    .cdm-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 16px; background: rgba(15, 23, 42, .55); }
    .cdm-overlay app-confirm-delete { width: min(520px, 100%); box-shadow: 0 20px 50px rgba(0,0,0,.3); border-radius: 14px; }
  `]
})
export class CityDeleteModalComponent implements OnInit {
  /** Traductions (textes construits dans le code). */
  private readonly i18n = inject(TranslateService);
  @Input() isOpen: boolean = false;
  @Input() city: CityToDelete | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() cityDeleted = new EventEmitter<string>();

  isDeleting$: Observable<boolean>;
  deleteError$: Observable<string | null>;

  constructor(private store: Store) {
    this.isDeleting$ = this.store.select(AdminGeographyState.isDeleting);
    this.deleteError$ = this.store.select(AdminGeographyState.getError);
  }

  ngOnInit(): void {}

  /** Détails de la ville (pays, statut, comptes et biens rattachés, population). */
  get details(): ConfirmDeleteDetail[] {
    const c = this.city;
    if (!c) return [];
    const t = (k: string) => this.i18n.instant(k);
    return [
      { label: t('ADMIN.CITY_DELETE.TS.COUNTRY'), value: c.country?.fullName },
      { label: t('ADMIN.CITY_DELETE.TS.STATUS'), value: c.isActive ? t('ADMIN.CITY_DELETE.ACTIVE') : t('ADMIN.CITY_DELETE.INACTIVE') },
      { label: t('ADMIN.CITY_DELETE.UTILISATEURS'), value: c.userCount || null },
      { label: t('ADMIN.CITY_DELETE.PROPRIETES'), value: c.propertyCount || null },
      { label: t('ADMIN.CITY_DELETE.POPULATION'), value: c.population ? c.population.toLocaleString() : null },
    ];
  }

  /** Conséquences selon l'état de la ville. */
  get consequences(): string[] {
    const c = this.city;
    if (!c) return [];
    const list = [
      this.i18n.instant('ADMIN.CITY_DELETE.LA_VILLE_SERA_MARQUEE_COMME'),
      this.i18n.instant('ADMIN.CITY_DELETE.LA_VILLE_SERA_RETIREE_DE'),
    ];
    if (c.isActive) list.push(this.i18n.instant('ADMIN.CITY_DELETE.LES_NOUVEAUX_UTILISATEURS_NE_POURRONT'));
    if ((c.userCount || 0) > 0) list.push(this.i18n.instant('ADMIN.CITY_DELETE.LES_UTILISATEUR_S_EXISTANT_S', { p0: c.userCount }));
    return list;
  }

  /**
   * Fermer le modal
   */
  onClose(): void {
    if (!this.store.selectSnapshot(AdminGeographyState.isDeleting)) {
      this.closeModal.emit();
    }
  }

  /**
   * Confirmer la suppression de la ville
   */
  onConfirmDelete(): void {
    if (!this.city) return;

    this.store.dispatch(new AdminGeographyAction.DeleteCity(this.city._id))
      .subscribe({
        next: () => {
          this.cityDeleted.emit(this.city!._id);
          this.closeModal.emit();
        },
        error: (error) => {
        }
      });
  }

  /**
   * Annuler la suppression
   */
  onCancel(): void {
    this.onClose();
  }

  /**
   * Gérer la fermeture par clic sur l'overlay
   */
  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Gérer la fermeture par touche Escape
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  /**
   * Obtenir le niveau de danger de la suppression
   */
  getDangerLevel(): 'low' | 'medium' | 'high' {
    if (!this.city) return 'low';

    const hasUsers = (this.city.userCount || 0) > 0;
    const hasProperties = (this.city.propertyCount || 0) > 0;
    const isActive = this.city.isActive;

    if (hasUsers || hasProperties) return 'high';
    if (isActive) return 'medium';
    return 'low';
  }

  /**
   * Obtenir le message d'avertissement selon le niveau de danger
   */
  getWarningMessage(): string {
    const dangerLevel = this.getDangerLevel();
    
    switch (dangerLevel) {
    case 'high':
      return this.i18n.instant('ADMIN.CITY_DELETE.TS.DANGER_HIGH');
    case 'medium':
      return this.i18n.instant('ADMIN.CITY_DELETE.TS.DANGER_MEDIUM');
    default:
      return this.i18n.instant('ADMIN.CITY_DELETE.TS.WARNING');
    }
  }

  /**
   * Obtenir l'icône d'avertissement selon le niveau de danger
   */
  getWarningIcon(): string {
    const dangerLevel = this.getDangerLevel();
    
    switch (dangerLevel) {
    case 'high':
      return 'fas fa-exclamation-triangle';
    case 'medium':
      return 'fas fa-exclamation-circle';
    default:
      return 'fas fa-info-circle';
    }
  }

  /**
   * Obtenir la classe CSS selon le niveau de danger
   */
  getWarningClass(): string {
    const dangerLevel = this.getDangerLevel();
    
    switch (dangerLevel) {
    case 'high':
      return 'warning-high';
    case 'medium':
      return 'warning-medium';
    default:
      return 'warning-low';
    }
  }
}
