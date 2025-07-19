import { Component, OnInit } from '@angular/core';
import { TranslationValidatorService, ValidationSummary } from '../../services/translation-validator.service';
import { TranslationService } from '../../services/localization/translation.service';
import { ModalTranslationService } from '../../services/modal-translation.service';
import { MultilingualNotificationService } from '../../services/notification/multilingual-notification.service';

@Component({
  selector: 'app-translation-tester',
  templateUrl: './translation-tester.component.html',
  styleUrls: ['./translation-tester.component.scss']
})
export class TranslationTesterComponent implements OnInit {

  validationSummary: ValidationSummary | null = null;
  isValidating = false;
  validationReport = '';
  
  // Exemples de traductions à tester
  testKeys = [
    'COMMON.SAVE',
    'COMMON.CANCEL',
    'MODALS.TENANT.ADD_TITLE',
    'MODALS.PAYMENT.ADD_TITLE',
    'NOTIFICATIONS.SUCCESS',
    'STATUS.AVAILABLE'
  ];

  currentLanguage = 'fr';
  supportedLanguages: any[] = [];

  constructor(
    private validator: TranslationValidatorService,
    private translationService: TranslationService,
    private modalTranslation: ModalTranslationService,
    private notification: MultilingualNotificationService
  ) {}

  ngOnInit(): void {
    this.supportedLanguages = this.translationService.getSupportedLanguagesWithMetadata();
    this.translationService.getCurrentLanguage().subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  /**
   * Lance la validation complète
   */
  async validateTranslations(): Promise<void> {
    this.isValidating = true;
    
    try {
      this.validationSummary = await this.validator.validateAllTranslations().toPromise();
      this.validationReport = await this.validator.generateReport().toPromise();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      await this.notification.error('VALIDATION.ERROR');
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Change la langue de test
   */
  changeLanguage(languageCode: string): void {
    this.translationService.changeLanguage(languageCode);
  }

  /**
   * Teste les notifications multilingues
   */
  async testNotifications(): Promise<void> {
    await this.notification.success('NOTIFICATIONS.TENANT_CREATED');
    
    setTimeout(async () => {
      await this.notification.warning('NOTIFICATIONS.VALIDATION_ERROR');
    }, 1000);
    
    setTimeout(async () => {
      await this.notification.error('NOTIFICATIONS.OPERATION_FAILED');
    }, 2000);
    
    setTimeout(async () => {
      await this.notification.info('NOTIFICATIONS.INFO');
    }, 3000);
  }

  /**
   * Teste les traductions des modals
   */
  testModalTranslations(): void {
    const tenantTranslations = this.modalTranslation.getTenantModalTranslations();
    const paymentTranslations = this.modalTranslation.getPaymentModalTranslations();
    
    console.group('🏠 Traductions Modal Locataire');
    console.log('Titre ajout:', tenantTranslations.addTitle);
    console.log('Titre édition:', tenantTranslations.editTitle);
    console.log('Info personnelles:', tenantTranslations.personalInfo);
    console.groupEnd();
    
    console.group('💰 Traductions Modal Paiement');
    console.log('Titre ajout:', paymentTranslations.addTitle);
    console.log('Titre édition:', paymentTranslations.editTitle);
    console.log('Info paiement:', paymentTranslations.paymentInfo);
    console.groupEnd();
  }

  /**
   * Obtient la classe CSS pour le statut de validation
   */
  getValidationStatusClass(isValid: boolean): string {
    return isValid ? 'status-valid' : 'status-invalid';
  }

  /**
   * Obtient l'icône pour le statut de validation
   */
  getValidationStatusIcon(isValid: boolean): string {
    return isValid ? '✅' : '❌';
  }

  /**
   * Obtient la couleur de la barre de progression
   */
  getProgressBarColor(percentage: number): string {
    if (percentage >= 90) return '#4caf50'; // Vert
    if (percentage >= 70) return '#ff9800'; // Orange
    return '#f44336'; // Rouge
  }

  /**
   * Formate le pourcentage pour l'affichage
   */
  formatPercentage(percentage: number): string {
    return `${percentage}%`;
  }

  /**
   * Télécharge le rapport de validation
   */
  downloadReport(): void {
    if (!this.validationReport) return;
    
    const blob = new Blob([this.validationReport], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Copie le rapport dans le presse-papiers
   */
  async copyReport(): Promise<void> {
    if (!this.validationReport) return;
    
    try {
      await navigator.clipboard.writeText(this.validationReport);
      await this.notification.success('COMMON.COPIED');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      await this.notification.error('COMMON.COPY_ERROR');
    }
  }

  /**
   * Réinitialise les résultats de validation
   */
  resetValidation(): void {
    this.validationSummary = null;
    this.validationReport = '';
  }
}
