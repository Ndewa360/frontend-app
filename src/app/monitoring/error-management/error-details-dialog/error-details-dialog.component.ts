import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorLog, ErrorLevel, ErrorSource, ErrorStatus } from '../../../shared/models/monitoring.models';

@Component({
  selector: 'app-error-details-dialog',
  templateUrl: './error-details-dialog.component.html',
  styleUrls: ['./error-details-dialog.component.scss']
})
export class ErrorDetailsDialogComponent {
  
  // Exposer les enums pour le template
  ErrorStatus = ErrorStatus;

  constructor(
    public dialogRef: MatDialogRef<ErrorDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public error: ErrorLog
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  updateStatus(status: ErrorStatus): void {
    this.dialogRef.close({ action: 'updateStatus', status, errorId: this.error._id });
  }

  deleteError(): void {
    this.dialogRef.close({ action: 'delete', errorId: this.error._id });
  }

  // Méthodes utilitaires pour l'affichage
  getErrorLevelClass(level: ErrorLevel): string {
    switch (level) {
      case ErrorLevel.LOW:
        return 'level-low';
      case ErrorLevel.MEDIUM:
        return 'level-medium';
      case ErrorLevel.HIGH:
        return 'level-high';
      case ErrorLevel.CRITICAL:
        return 'level-critical';
      default:
        return 'level-unknown';
    }
  }

  getErrorLevelLabel(level: ErrorLevel): string {
    switch (level) {
      case ErrorLevel.LOW:
        return 'Faible';
      case ErrorLevel.MEDIUM:
        return 'Moyen';
      case ErrorLevel.HIGH:
        return 'Élevé';
      case ErrorLevel.CRITICAL:
        return 'Critique';
      default:
        return 'Inconnu';
    }
  }

  getErrorSourceLabel(source: ErrorSource): string {
    switch (source) {
      case ErrorSource.FRONTEND:
        return 'Frontend';
      case ErrorSource.BACKEND:
        return 'Backend';
      case ErrorSource.DATABASE:
        return 'Base de données';
      case ErrorSource.EXTERNAL_API:
        return 'API externe';
      case ErrorSource.AUTHENTICATION:
        return 'Authentification';
      case ErrorSource.AUTHORIZATION:
        return 'Autorisation';
      case ErrorSource.VALIDATION:
        return 'Validation';
      case ErrorSource.NETWORK:
        return 'Réseau';
      default:
        return 'Inconnu';
    }
  }

  getErrorStatusClass(status: ErrorStatus): string {
    switch (status) {
      case ErrorStatus.NEW:
        return 'status-new';
      case ErrorStatus.ACKNOWLEDGED:
        return 'status-acknowledged';
      case ErrorStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ErrorStatus.RESOLVED:
        return 'status-resolved';
      case ErrorStatus.IGNORED:
        return 'status-ignored';
      default:
        return 'status-unknown';
    }
  }

  getErrorStatusLabel(status: ErrorStatus): string {
    switch (status) {
      case ErrorStatus.NEW:
        return 'Nouvelle';
      case ErrorStatus.ACKNOWLEDGED:
        return 'Acquittée';
      case ErrorStatus.IN_PROGRESS:
        return 'En cours';
      case ErrorStatus.RESOLVED:
        return 'Résolue';
      case ErrorStatus.IGNORED:
        return 'Ignorée';
      default:
        return 'Inconnu';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Non disponible';
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatStackTrace(stackTrace: string): string {
    if (!stackTrace) return 'Aucune stack trace disponible';
    return stackTrace;
  }

  formatJson(data: any): string {
    if (!data) return 'Aucune donnée disponible';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Données non valides';
    }
  }
}
