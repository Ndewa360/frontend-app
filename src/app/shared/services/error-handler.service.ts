import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private toastr: ToastrService) {}

  /**
   * Gère les erreurs HTTP de manière centralisée
   */
  handleHttpError(error: HttpErrorResponse, context?: string): Observable<never> {
    const errorInfo = this.parseHttpError(error);
    
    // Log pour le debugging
    console.error(`[${context || 'HTTP Error'}]`, {
      status: error.status,
      message: errorInfo.message,
      url: error.url,
      error: error.error
    });

    // Afficher le message à l'utilisateur
    this.showErrorToast(errorInfo, context);

    return throwError(() => errorInfo);
  }

  /**
   * Parse les erreurs HTTP en messages utilisateur
   */
  private parseHttpError(error: HttpErrorResponse): ErrorInfo {
    switch (error.status) {
      case 0:
        return {
          message: 'Aucune connexion internet. Vérifiez votre connexion.',
          code: 'NO_INTERNET'
        };
      
      case 400:
        return {
          message: error.error?.message || 'Données invalides',
          code: 'BAD_REQUEST',
          details: error.error?.details
        };
      
      case 401:
        return {
          message: 'Session expirée. Veuillez vous reconnecter.',
          code: 'UNAUTHORIZED'
        };
      
      case 403:
        return {
          message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
          code: 'FORBIDDEN'
        };
      
      case 404:
        return {
          message: 'Ressource non trouvée',
          code: 'NOT_FOUND'
        };
      
      case 409:
        return {
          message: error.error?.message || 'Conflit de données',
          code: 'CONFLICT'
        };
      
      case 422:
        return {
          message: 'Données de validation incorrectes',
          code: 'VALIDATION_ERROR',
          details: error.error?.errors
        };
      
      case 500:
        return {
          message: 'Erreur serveur. Veuillez réessayer plus tard.',
          code: 'SERVER_ERROR'
        };
      
      case 503:
        return {
          message: 'Service temporairement indisponible',
          code: 'SERVICE_UNAVAILABLE'
        };
      
      default:
        return {
          message: error.error?.message || 'Une erreur inattendue s\'est produite',
          code: 'UNKNOWN_ERROR'
        };
    }
  }

  /**
   * Affiche un toast d'erreur
   */
  private showErrorToast(errorInfo: ErrorInfo, context?: string): void {
    const title = context ? `Erreur - ${context}` : 'Erreur';
    
    this.toastr.error(errorInfo.message, title, {
      timeOut: 5000,
      closeButton: true,
      progressBar: true
    });
  }

  /**
   * Gère les erreurs de validation de formulaire
   */
  handleFormValidationError(errors: any): string[] {
    const messages: string[] = [];
    
    if (typeof errors === 'object') {
      Object.keys(errors).forEach(field => {
        const fieldErrors = errors[field];
        if (Array.isArray(fieldErrors)) {
          messages.push(...fieldErrors);
        } else if (typeof fieldErrors === 'string') {
          messages.push(fieldErrors);
        }
      });
    }
    
    return messages;
  }

  /**
   * Affiche les erreurs de validation
   */
  showValidationErrors(errors: string[]): void {
    errors.forEach(error => {
      this.toastr.warning(error, 'Validation', {
        timeOut: 4000
      });
    });
  }
}
