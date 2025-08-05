import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';

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
  styleUrls: ['./city-delete-modal.component.scss']
})
export class CityDeleteModalComponent implements OnInit {
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
    })
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
          console.error('Erreur lors de la suppression de la ville:', error);
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
        return 'Cette ville contient des utilisateurs ou des propriétés. La suppression peut affecter des données importantes.';
      case 'medium':
        return 'Cette ville est actuellement active. Sa suppression la rendra indisponible pour les nouveaux utilisateurs.';
      default:
        return 'Cette action supprimera définitivement la ville de la base de données.';
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
