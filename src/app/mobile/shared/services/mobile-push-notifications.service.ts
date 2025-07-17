import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

// Import conditionnel pour Toast
let Toast: any = null;

// Tentative d'import dynamique
(async () => {
  try {
    const toastModule = await import('@capacitor/toast');
    Toast = toastModule.Toast;
  } catch (error) {
    console.warn('⚠️ @capacitor/toast non disponible, utilisation du fallback');
  }
})();

import { environment } from '../../../../environments/environment';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  type?: 'payment_reminder' | 'subscription_expiry' | 'contract_update' | 'general';
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MobilePushNotificationsService {
  private readonly API_URL = environment.apiUrl;
  private isInitialized = false;
  private deviceToken: string | null = null;
  
  // Observable pour suivre les notifications reçues
  private notificationsSubject = new BehaviorSubject<PushNotificationSchema | null>(null);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private platform: Platform,
    private http: HttpClient
  ) {}

  /**
   * Initialiser le service de notifications push
   */
  async initializePushNotifications(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔔 Initialisation des notifications push...');

    try {
      // Vérifier si on est sur une plateforme native
      if (!this.platform.is('capacitor')) {
        console.log('⚠️ Notifications push disponibles uniquement sur mobile natif');
        await this.initializeWebNotifications();
        return;
      }

      // Demander la permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        console.log('✅ Permission accordée pour les notifications push');
        
        // Enregistrer pour recevoir les notifications
        await PushNotifications.register();
        
        // Configurer les listeners
        this.setupPushNotificationListeners();
        
        this.isInitialized = true;
      } else {
        console.log('❌ Permission refusée pour les notifications push');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  /**
   * Configurer les listeners pour les notifications push
   */
  private setupPushNotificationListeners(): void {
    // Listener pour l'enregistrement réussi
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('📱 Token de notification reçu:', token.value);
      this.deviceToken = token.value;
      
      // Envoyer le token au backend
      await this.registerDeviceToken(token.value);
    });

    // Listener pour les erreurs d'enregistrement
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Erreur d\'enregistrement des notifications:', error);
    });

    // Listener pour les notifications reçues (app ouverte)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('🔔 Notification reçue (app ouverte):', notification);
      
      // Émettre la notification pour les composants qui écoutent
      this.notificationsSubject.next(notification);
      
      // Afficher une notification locale si nécessaire
      this.showLocalNotification(notification);
    });

    // Listener pour les actions sur les notifications (tap, etc.)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('👆 Action sur notification:', action);
      
      // Gérer l'action selon le type de notification
      this.handleNotificationAction(action);
    });
  }

  /**
   * Initialiser les notifications web (pour le navigateur)
   */
  private async initializeWebNotifications(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notifications web activées');
        this.isInitialized = true;
      }
    }
  }

  /**
   * Enregistrer le token de l'appareil sur le backend
   */
  private async registerDeviceToken(token: string): Promise<void> {
    try {
      const deviceInfo = {
        token: token,
        platform: this.platform.platforms().join(','),
        appVersion: environment.version || '1.0.0',
        registeredAt: new Date().toISOString()
      };

      await this.http.post(`${this.API_URL}/notifications/register-device`, deviceInfo).toPromise();
      
      console.log('✅ Token d\'appareil enregistré sur le backend');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  }

  /**
   * Afficher une notification locale
   */
  private async showLocalNotification(notification: PushNotificationSchema): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'Ndiye',
            body: notification.body || 'Nouvelle notification',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // Dans 1 seconde
            sound: 'default',
            attachments: notification.data?.imageUrl ? [{ id: 'image', url: notification.data.imageUrl }] : undefined,
            extra: notification.data
          }
        ]
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la notification locale:', error);
    }
  }

  /**
   * Gérer les actions sur les notifications
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const notification = action.notification;
    const data = notification.data;

    // Rediriger selon le type de notification
    if (data?.type) {
      switch (data.type) {
        case 'payment_reminder':
          this.navigateToPayments(data);
          break;
        case 'subscription_expiry':
          this.navigateToSubscription(data);
          break;
        case 'contract_update':
          this.navigateToContracts(data);
          break;
        default:
          this.navigateToHome();
      }
    } else if (data?.actionUrl) {
      // URL personnalisée
      window.open(data.actionUrl, '_blank');
    } else {
      // Par défaut, aller à l'accueil
      this.navigateToHome();
    }
  }

  /**
   * Envoyer une notification de test
   */
  async sendTestNotification(): Promise<void> {
    if (!this.deviceToken) {
      console.log('❌ Aucun token d\'appareil disponible');
      return;
    }

    try {
      const testNotification = {
        title: 'Test Ndiye',
        body: 'Ceci est une notification de test',
        data: {
          type: 'general',
          timestamp: new Date().toISOString()
        }
      };

      await this.http.post(`${this.API_URL}/notifications/send-test`, {
        deviceToken: this.deviceToken,
        notification: testNotification
      }).toPromise();

      console.log('✅ Notification de test envoyée');

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification de test:', error);
    }
  }

  /**
   * Obtenir le statut des notifications
   */
  async getNotificationStatus(): Promise<any> {
    try {
      const status = await PushNotifications.checkPermissions();
      return {
        isEnabled: status.receive === 'granted',
        deviceToken: this.deviceToken,
        platform: this.platform.platforms()
      };
    } catch (error) {
      return {
        isEnabled: false,
        deviceToken: null,
        platform: this.platform.platforms()
      };
    }
  }

  /**
   * Désactiver les notifications pour cet appareil
   */
  async unregisterDevice(): Promise<void> {
    try {
      if (this.deviceToken) {
        await this.http.delete(`${this.API_URL}/notifications/unregister-device/${this.deviceToken}`).toPromise();
        console.log('✅ Appareil désenregistré des notifications');
      }
      
      this.deviceToken = null;
      
    } catch (error) {
      console.error('❌ Erreur lors du désenregistrement:', error);
    }
  }

  // Méthodes de navigation (à adapter selon votre routing)
  private navigateToPayments(data: any): void {
    // Implémenter la navigation vers les paiements
    console.log('Navigation vers paiements:', data);
  }

  private navigateToSubscription(data: any): void {
    // Implémenter la navigation vers l'abonnement
    console.log('Navigation vers abonnement:', data);
  }

  private navigateToContracts(data: any): void {
    // Implémenter la navigation vers les contrats
    console.log('Navigation vers contrats:', data);
  }

  private navigateToHome(): void {
    // Implémenter la navigation vers l'accueil
    console.log('Navigation vers accueil');
  }

  /**
   * Programmer une notification de rappel de paiement
   */
  async schedulePaymentReminder(
    contractId: string,
    dueDate: Date,
    amount: number,
    tenantName: string
  ): Promise<void> {
    const notificationDate = new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 jours avant

    const notification: LocalNotificationSchema = {
      title: '💰 Rappel de Paiement',
      body: `Bonjour ${tenantName}, votre loyer de ${amount} FCFA est dû dans 3 jours.`,
      id: parseInt(contractId.slice(-6), 16), // ID unique basé sur le contrat
      schedule: { at: notificationDate },
      sound: 'beep.wav',
      attachments: undefined,
      actionTypeId: 'payment_reminder',
      extra: {
        contractId,
        type: 'payment_reminder',
        amount,
        dueDate: dueDate.toISOString()
      }
    };

    await LocalNotifications.schedule({
      notifications: [notification]
    });

    console.log(`📅 Rappel de paiement programmé pour le ${notificationDate.toLocaleDateString()}`);
  }

  /**
   * Programmer une notification d'expiration d'abonnement
   */
  async scheduleSubscriptionExpiry(
    userId: string,
    expiryDate: Date,
    planName: string
  ): Promise<void> {
    const reminderDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 jours avant

    const notification: LocalNotificationSchema = {
      title: '⚠️ Abonnement Expirant',
      body: `Votre abonnement ${planName} expire dans 7 jours. Renouvelez maintenant !`,
      id: parseInt(userId.slice(-6), 16),
      schedule: { at: reminderDate },
      sound: 'beep.wav',
      attachments: undefined,
      actionTypeId: 'subscription_expiry',
      extra: {
        userId,
        type: 'subscription_expiry',
        planName,
        expiryDate: expiryDate.toISOString()
      }
    };

    await LocalNotifications.schedule({
      notifications: [notification]
    });

    console.log(`📅 Rappel d'expiration programmé pour le ${reminderDate.toLocaleDateString()}`);
  }

  /**
   * Annuler toutes les notifications programmées pour un utilisateur
   */
  async cancelUserNotifications(userId: string): Promise<void> {
    const pending = await LocalNotifications.getPending();
    const userNotifications = pending.notifications.filter(
      n => n.extra?.userId === userId
    );

    if (userNotifications.length > 0) {
      const ids = userNotifications.map(n => ({ id: n.id }));
      await LocalNotifications.cancel({ notifications: ids });
      console.log(`🗑️ ${userNotifications.length} notifications annulées pour l'utilisateur ${userId}`);
    }
  }

  /**
   * Afficher un toast de notification
   */
  async showToast(message: string, duration: 'short' | 'long' = 'short'): Promise<void> {
    try {
      if (Toast) {
        await Toast.show({
          text: message,
          duration: duration,
          position: 'bottom'
        });
      } else {
        // Fallback : utiliser console.log si Toast n'est pas disponible
        console.log(`📱 Toast: ${message}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage du toast:', error);
      console.log(`📱 Toast (fallback): ${message}`);
    }
  }
}
