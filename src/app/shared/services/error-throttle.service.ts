import { Injectable } from '@angular/core';

interface ErrorRecord {
  message: string;
  count: number;
  lastOccurrence: number;
  firstOccurrence: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorThrottleService {
  private errorMap = new Map<string, ErrorRecord>();
  private readonly THROTTLE_DURATION = 30000; // 30 secondes
  private readonly MAX_SAME_ERROR = 3; // Maximum 3 fois le même message

  constructor() {}

  /**
   * Vérifier si une erreur doit être affichée
   */
  shouldShowError(errorMessage: string, errorType: string = 'general'): boolean {
    const key = `${errorType}:${errorMessage}`;
    const now = Date.now();
    
    const existing = this.errorMap.get(key);
    
    if (!existing) {
      // Première occurrence de cette erreur
      this.errorMap.set(key, {
        message: errorMessage,
        count: 1,
        lastOccurrence: now,
        firstOccurrence: now
      });
      return true;
    }
    
    // Vérifier si assez de temps s'est écoulé
    if (now - existing.lastOccurrence > this.THROTTLE_DURATION) {
      // Réinitialiser le compteur après la période de throttle
      existing.count = 1;
      existing.lastOccurrence = now;
      existing.firstOccurrence = now;
      return true;
    }
    
    // Vérifier si on a dépassé le maximum
    if (existing.count >= this.MAX_SAME_ERROR) {
      existing.lastOccurrence = now;
      return false;
    }
    
    // Incrémenter le compteur
    existing.count++;
    existing.lastOccurrence = now;
    
    return true;
  }

  /**
   * Logger une erreur avec throttling
   */
  logError(errorMessage: string, errorType: string = 'general', logLevel: 'error' | 'warn' | 'info' = 'error'): void {
    if (this.shouldShowError(errorMessage, errorType)) {
      const existing = this.errorMap.get(`${errorType}:${errorMessage}`);
      const suffix = existing && existing.count > 1 ? ` (${existing.count}x)` : '';
      
      switch (logLevel) {
        case 'error':
          console.error(`[${errorType.toUpperCase()}] ${errorMessage}${suffix}`);
          break;
        case 'warn':
          console.warn(`[${errorType.toUpperCase()}] ${errorMessage}${suffix}`);
          break;
        case 'info':
          console.info(`[${errorType.toUpperCase()}] ${errorMessage}${suffix}`);
          break;
      }
    }
  }

  /**
   * Nettoyer les anciennes erreurs
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.errorMap.forEach((record, key) => {
      if (now - record.lastOccurrence > this.THROTTLE_DURATION * 2) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.errorMap.delete(key));
  }

  /**
   * Obtenir les statistiques d'erreurs
   */
  getErrorStats(): { [key: string]: ErrorRecord } {
    const stats: { [key: string]: ErrorRecord } = {};
    this.errorMap.forEach((record, key) => {
      stats[key] = { ...record };
    });
    return stats;
  }

  /**
   * Réinitialiser toutes les erreurs
   */
  reset(): void {
    this.errorMap.clear();
  }
}
