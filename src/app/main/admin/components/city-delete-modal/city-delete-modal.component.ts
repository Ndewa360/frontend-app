import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';
import { NgIf, AsyncPipe, DecimalPipe } from '@angular/common';

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
  templateUrl: './city-delete-modal.component.html',
  styleUrls: ['./city-delete-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgIf, AsyncPipe, DecimalPipe]
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

  /**
   * Fermer le modal
   */
  onClose(): void {
    this.isDeleting$.pipe().subscribe(isDeleting => {
      if (!isDeleting) {
        this.closeModal.emit();
      }
    });
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
