import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export interface NotificationOptions {
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  translateParams?: any;
  showCloseButton?: boolean;
  progressBar?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MultilingualNotificationService {

  constructor(
    private translateService: TranslateService,
    private toastr: ToastrService
  ) {}

  /**
   * Affiche une notification de succès
   */
  async success(messageKey: string, titleKey?: string, options?: NotificationOptions): Promise<void> {
    const message = await this.getTranslation(messageKey, options?.translateParams);
    const title = titleKey ? await this.getTranslation(titleKey, options?.translateParams) :
                  await this.getTranslation('NOTIFICATIONS.SUCCESS');

    this.toastr.success(message, title, {
      timeOut: options?.duration || 5000,
      closeButton: options?.showCloseButton ?? true,
      progressBar: options?.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Notifications spécifiques pour les modals
   */
  async tenantCreated(): Promise<void> {
    await this.success('NOTIFICATIONS.TENANT_CREATED');
  }

  async tenantUpdated(): Promise<void> {
    await this.success('NOTIFICATIONS.TENANT_UPDATED');
  }

  async tenantDeleted(): Promise<void> {
    await this.success('NOTIFICATIONS.TENANT_DELETED');
  }

  async unitCreated(): Promise<void> {
    await this.success('NOTIFICATIONS.UNIT_CREATED');
  }

  async unitUpdated(): Promise<void> {
    await this.success('NOTIFICATIONS.UNIT_UPDATED');
  }

  async unitDeleted(): Promise<void> {
    await this.success('NOTIFICATIONS.UNIT_DELETED');
  }

  async paymentCreated(): Promise<void> {
    await this.success('NOTIFICATIONS.PAYMENT_CREATED');
  }

  async paymentUpdated(): Promise<void> {
    await this.success('NOTIFICATIONS.PAYMENT_UPDATED');
  }

  async paymentDeleted(): Promise<void> {
    await this.success('NOTIFICATIONS.PAYMENT_DELETED');
  }

  async contractTerminated(): Promise<void> {
    await this.success('NOTIFICATIONS.CONTRACT_TERMINATED');
  }

  async operationFailed(): Promise<void> {
    await this.error('NOTIFICATIONS.OPERATION_FAILED');
  }

  async networkError(): Promise<void> {
    await this.error('NOTIFICATIONS.NETWORK_ERROR');
  }

  async validationError(): Promise<void> {
    await this.error('NOTIFICATIONS.VALIDATION_ERROR');
  }

  async unauthorized(): Promise<void> {
    await this.error('NOTIFICATIONS.UNAUTHORIZED');
  }

  async forbidden(): Promise<void> {
    await this.error('NOTIFICATIONS.FORBIDDEN');
  }

  async notFound(): Promise<void> {
    await this.error('NOTIFICATIONS.NOT_FOUND');
  }

  async serverError(): Promise<void> {
    await this.error('NOTIFICATIONS.SERVER_ERROR');
  }

  /**
   * Affiche une notification d'erreur
   */
  async error(messageKey: string, titleKey?: string, options?: NotificationOptions): Promise<void> {
    const message = await this.getTranslation(messageKey, options?.translateParams);
    const title = titleKey ? await this.getTranslation(titleKey, options?.translateParams) : 
                  await this.getTranslation('NOTIFICATIONS.ERROR');

    this.toastr.error(message, title, {
      timeOut: options?.duration || 8000,
      closeButton: options?.showCloseButton ?? true,
      progressBar: options?.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'avertissement
   */
  async warning(messageKey: string, titleKey?: string, options?: NotificationOptions): Promise<void> {
    const message = await this.getTranslation(messageKey, options?.translateParams);
    const title = titleKey ? await this.getTranslation(titleKey, options?.translateParams) : 
                  await this.getTranslation('NOTIFICATIONS.WARNING');

    this.toastr.warning(message, title, {
      timeOut: options?.duration || 6000,
      closeButton: options?.showCloseButton ?? true,
      progressBar: options?.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification d'information
   */
  async info(messageKey: string, titleKey?: string, options?: NotificationOptions): Promise<void> {
    const message = await this.getTranslation(messageKey, options?.translateParams);
    const title = titleKey ? await this.getTranslation(titleKey, options?.translateParams) : 
                  await this.getTranslation('NOTIFICATIONS.INFO');

    this.toastr.info(message, title, {
      timeOut: options?.duration || 5000,
      closeButton: options?.showCloseButton ?? true,
      progressBar: options?.progressBar ?? true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Affiche une notification de chargement
   */
  async loading(messageKey: string = 'NOTIFICATIONS.LOADING_DATA', titleKey?: string): Promise<void> {
    const message = await this.getTranslation(messageKey);
    const title = titleKey ? await this.getTranslation(titleKey) : 
                  await this.getTranslation('NOTIFICATIONS.INFO');

    this.toastr.info(message, title, {
      timeOut: 0, // Pas de timeout automatique
      closeButton: false,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  /**
   * Ferme toutes les notifications
   */
  clearAll(): void {
    this.toastr.clear();
  }

  /**
   * Affiche une notification de changement de langue
   */
  async languageChanged(newLanguage: string): Promise<void> {
    const languageDisplay = this.getLanguageDisplayName(newLanguage);
    await this.success('NOTIFICATIONS.LANGUAGE_CHANGED', undefined, {
      translateParams: { language: languageDisplay }
    });
  }

  /**
   * Affiche une notification d'erreur réseau
   */
  async networkError(): Promise<void> {
    await this.error('NOTIFICATIONS.NETWORK_ERROR');
  }

  /**
   * Affiche une notification d'erreur serveur
   */
  async serverError(): Promise<void> {
    await this.error('NOTIFICATIONS.SERVER_ERROR');
  }

  /**
   * Affiche une notification de pas de connexion Internet
   */
  async noInternet(): Promise<void> {
    await this.warning('NOTIFICATIONS.NO_INTERNET');
  }

  /**
   * Affiche une notification de recherche réussie
   */
  async searchSuccess(count: number): Promise<void> {
    await this.success('SEARCH.RESULTS_COUNT', undefined, {
      translateParams: { count }
    });
  }

  /**
   * Affiche une notification de filtres appliqués
   */
  async filtersApplied(): Promise<void> {
    await this.info('NOTIFICATIONS.FILTERS_APPLIED');
  }

  /**
   * Affiche une notification de filtres effacés
   */
  async filtersCleared(): Promise<void> {
    await this.info('NOTIFICATIONS.FILTERS_CLEARED');
  }

  /**
   * Obtient une traduction de manière asynchrone
   */
  private async getTranslation(key: string, params?: any): Promise<string> {
    return new Promise((resolve) => {
      this.translateService.get(key, params)
        .pipe(take(1))
        .subscribe(translation => {
          resolve(translation);
        });
    });
  }

  /**
   * Obtient le nom d'affichage d'une langue
   */
  private getLanguageDisplayName(languageCode: string): string {
    const languages: { [key: string]: string } = {
      'fr': 'Français',
      'en': 'English'
    };
    return languages[languageCode] || languageCode;
  }
}
