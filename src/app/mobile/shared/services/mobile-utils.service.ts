import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { MobileConfig } from '../../mobile.config';

@Injectable({
  providedIn: 'root'
})
export class MobileUtilsService {

  constructor(private platform: Platform) {}

  /**
   * Formater un prix en FCFA
   */
  formatPrice(price: number): string {
    if (!price) return '0 FCFA';
    
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Formater une date
   */
  formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'long':
        return dateObj.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
      
      case 'relative':
        return this.getRelativeTime(dateObj);
      
      default:
        return dateObj.toLocaleDateString('fr-FR');
    }
  }

  /**
   * Obtenir le temps relatif (il y a X jours)
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Générer un ID unique
   */
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Valider un email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un numéro de téléphone camerounais
   */
  isValidCameroonPhone(phone: string): boolean {
    // Format: +237XXXXXXXXX ou 6XXXXXXXX ou 2XXXXXXXX
    const phoneRegex = /^(\+237)?[62]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Formater un numéro de téléphone
   */
  formatPhone(phone: string): string {
    if (!phone) return '';
    
    // Nettoyer le numéro
    const cleaned = phone.replace(/\D/g, '');
    
    // Ajouter le code pays si nécessaire
    if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('2'))) {
      return `+237 ${cleaned.substring(0, 1)} ${cleaned.substring(1, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('237')) {
      const number = cleaned.substring(3);
      return `+237 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
    }
    
    return phone;
  }

  /**
   * Obtenir les initiales d'un nom
   */
  getInitials(firstName: string, lastName: string): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
  }

  /**
   * Tronquer un texte
   */
  truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Capitaliser la première lettre
   */
  capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Vérifier si on est en mode natif
   */
  isNativeApp(): boolean {
    return this.platform.is('cordova') || this.platform.is('capacitor');
  }

  /**
   * Vérifier si on est sur iOS
   */
  isIOS(): boolean {
    return this.platform.is('ios');
  }

  /**
   * Vérifier si on est sur Android
   */
  isAndroid(): boolean {
    return this.platform.is('android');
  }

  /**
   * Obtenir la couleur d'un statut
   */
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'active': 'success',
      'available': 'success',
      'occupied': 'primary',
      'pending': 'warning',
      'expired': 'danger',
      'terminated': 'medium',
      'maintenance': 'warning',
      'cancelled': 'danger'
    };
    
    return statusColors[status.toLowerCase()] || 'medium';
  }

  /**
   * Obtenir l'icône d'un statut
   */
  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'active': 'checkmark-circle',
      'available': 'checkmark-circle',
      'occupied': 'people',
      'pending': 'time',
      'expired': 'alert-circle',
      'terminated': 'close-circle',
      'maintenance': 'construct',
      'cancelled': 'close-circle'
    };
    
    return statusIcons[status.toLowerCase()] || 'help-circle';
  }

  /**
   * Calculer le pourcentage
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * Débouncer une fonction
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = MobileConfig.ui.debounceTime
  ): (...args: Parameters<T>) => void {
    let timeoutId: any;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Faire vibrer l'appareil (si supporté)
   */
  vibrate(pattern: number | number[] = 100): void {
    if (this.isNativeApp() && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Copier du texte dans le presse-papiers
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      return false;
    }
  }

  /**
   * Ouvrir un lien externe
   */
  openExternalLink(url: string): void {
    if (this.isNativeApp()) {
      // Utiliser le navigateur système sur mobile
      window.open(url, '_system');
    } else {
      // Ouvrir dans un nouvel onglet sur web
      window.open(url, '_blank');
    }
  }
}
