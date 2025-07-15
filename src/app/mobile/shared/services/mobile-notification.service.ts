import { Injectable } from '@angular/core';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Platform } from '@ionic/angular';

export interface ToastOptions {
  message: string;
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  icon?: string;
  buttons?: any[];
}

export interface AlertOptions {
  header?: string;
  subHeader?: string;
  message: string;
  buttons?: any[];
  inputs?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MobileNotificationService {
  private currentLoading: HTMLIonLoadingElement | null = null;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private platform: Platform
  ) {}

  /**
   * Initialiser le service de notifications
   */
  async initialize(): Promise<void> {
    console.log('🔔 Service de notifications mobile initialisé');
  }

  /**
   * Afficher un toast
   */
  async showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): Promise<void> {
    const colorMap = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'primary'
    };

    const iconMap = {
      success: 'checkmark-circle',
      error: 'close-circle',
      warning: 'warning',
      info: 'information-circle'
    };

    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color: colorMap[type],
      icon: iconMap[type],
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel'
        }
      ],
      cssClass: 'mobile-toast'
    });

    await toast.present();
  }

  /**
   * Afficher un toast personnalisé
   */
  async showCustomToast(options: ToastOptions): Promise<void> {
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration || 3000,
      position: options.position || 'top',
      color: options.color || 'primary',
      icon: options.icon,
      buttons: options.buttons || [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel'
        }
      ],
      cssClass: 'mobile-toast'
    });

    await toast.present();
  }

  /**
   * Afficher une alerte
   */
  async showAlert(title: string, message: string, buttons: string[] = ['OK']): Promise<string> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message,
        buttons: buttons.map(button => ({
          text: button,
          handler: () => resolve(button)
        })),
        cssClass: 'mobile-alert'
      });

      await alert.present();
    });
  }

  /**
   * Afficher une alerte de confirmation
   */
  async showConfirm(title: string, message: string, confirmText: string = 'Confirmer', cancelText: string = 'Annuler'): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: confirmText,
            handler: () => resolve(true)
          }
        ],
        cssClass: 'mobile-alert'
      });

      await alert.present();
    });
  }

  /**
   * Afficher une alerte avec saisie
   */
  async showPrompt(title: string, message: string, placeholder: string = '', inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text'): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message,
        inputs: [
          {
            name: 'input',
            type: inputType,
            placeholder
          }
        ],
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'OK',
            handler: (data) => resolve(data.input)
          }
        ],
        cssClass: 'mobile-alert'
      });

      await alert.present();
    });
  }

  /**
   * Afficher un indicateur de chargement
   */
  async showLoading(message: string = 'Chargement...', duration?: number): Promise<void> {
    // Fermer le loading précédent s'il existe
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
    }

    this.currentLoading = await this.loadingController.create({
      message,
      duration,
      spinner: 'crescent',
      cssClass: 'mobile-loading'
    });

    await this.currentLoading.present();
  }

  /**
   * Masquer l'indicateur de chargement
   */
  async hideLoading(): Promise<void> {
    if (this.currentLoading) {
      await this.currentLoading.dismiss();
      this.currentLoading = null;
    }
  }

  /**
   * Afficher une notification de succès
   */
  async showSuccess(message: string): Promise<void> {
    await this.showToast(message, 'success');
    
    // Vibration pour le feedback tactile (si supporté)
    if (this.platform.is('capacitor') && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }

  /**
   * Afficher une notification d'erreur
   */
  async showError(message: string): Promise<void> {
    await this.showToast(message, 'error', 5000);
    
    // Vibration d'erreur (si supporté)
    if (this.platform.is('capacitor') && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  /**
   * Afficher une notification d'avertissement
   */
  async showWarning(message: string): Promise<void> {
    await this.showToast(message, 'warning', 4000);
  }

  /**
   * Afficher une notification d'information
   */
  async showInfo(message: string): Promise<void> {
    await this.showToast(message, 'info');
  }

  /**
   * Afficher une notification de synchronisation
   */
  async showSyncNotification(type: 'start' | 'success' | 'error', message?: string): Promise<void> {
    const messages = {
      start: 'Synchronisation en cours...',
      success: 'Synchronisation terminée',
      error: 'Erreur de synchronisation'
    };

    const types = {
      start: 'info' as const,
      success: 'success' as const,
      error: 'error' as const
    };

    await this.showToast(message || messages[type], types[type]);
  }

  /**
   * Afficher une notification de connexion réseau
   */
  async showNetworkNotification(isOnline: boolean): Promise<void> {
    if (isOnline) {
      await this.showToast('Connexion rétablie', 'success', 2000);
    } else {
      await this.showToast('Mode hors ligne activé', 'warning', 3000);
    }
  }

  /**
   * Demander la permission pour les notifications push (si en mode natif)
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.platform.is('capacitor')) {
      return false;
    }

    try {
      // Logique pour demander la permission des notifications push
      // À implémenter avec Capacitor Push Notifications plugin
      console.log('🔔 Demande de permission pour les notifications push');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permission:', error);
      return false;
    }
  }
}
