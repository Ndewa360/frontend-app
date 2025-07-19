import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalTranslationService {

  constructor(private translate: TranslateService) {}

  /**
   * Obtient les traductions pour le modal de locataire
   */
  getTenantModalTranslations() {
    return {
      // Titres
      addTitle: this.translate.instant('MODALS.TENANT.ADD_TITLE'),
      editTitle: this.translate.instant('MODALS.TENANT.EDIT_TITLE'),
      
      // Sections
      personalInfo: this.translate.instant('MODALS.TENANT.PERSONAL_INFO'),
      contactInfo: this.translate.instant('MODALS.TENANT.CONTACT_INFO'),
      leaseInfo: this.translate.instant('MODALS.TENANT.LEASE_INFO'),
      
      // Champs
      firstName: this.translate.instant('MODALS.TENANT.FIRST_NAME'),
      lastName: this.translate.instant('MODALS.TENANT.LAST_NAME'),
      email: this.translate.instant('MODALS.TENANT.EMAIL'),
      phone: this.translate.instant('MODALS.TENANT.PHONE'),
      idCard: this.translate.instant('MODALS.TENANT.ID_CARD'),
      birthDate: this.translate.instant('MODALS.TENANT.BIRTH_DATE'),
      nationality: this.translate.instant('MODALS.TENANT.NATIONALITY'),
      profession: this.translate.instant('MODALS.TENANT.PROFESSION'),
      
      // Photo
      photoProfile: this.translate.instant('MODALS.TENANT.PHOTO_PROFILE'),
      uploadPhoto: this.translate.instant('MODALS.TENANT.UPLOAD_PHOTO'),
      removePhoto: this.translate.instant('MODALS.TENANT.REMOVE_PHOTO'),
      
      // Boutons
      save: this.translate.instant('COMMON.SAVE'),
      cancel: this.translate.instant('COMMON.CANCEL'),
      creating: this.translate.instant('MODALS.TENANT.CREATING'),
      updating: this.translate.instant('MODALS.TENANT.UPDATING')
    };
  }

  /**
   * Obtient les traductions pour le modal d'unité
   */
  getUnitModalTranslations() {
    return {
      // Titres
      addTitle: this.translate.instant('MODALS.UNIT.ADD_TITLE'),
      editTitle: this.translate.instant('MODALS.UNIT.EDIT_TITLE'),
      
      // Sections
      basicInfo: this.translate.instant('MODALS.UNIT.BASIC_INFO'),
      features: this.translate.instant('MODALS.UNIT.FEATURES'),
      pricing: this.translate.instant('MODALS.UNIT.PRICING'),
      media: this.translate.instant('MODALS.UNIT.MEDIA'),
      
      // Champs
      unitName: this.translate.instant('MODALS.UNIT.UNIT_NAME'),
      unitCode: this.translate.instant('MODALS.UNIT.UNIT_CODE'),
      unitType: this.translate.instant('MODALS.UNIT.UNIT_TYPE'),
      surfaceArea: this.translate.instant('MODALS.UNIT.SURFACE_AREA'),
      description: this.translate.instant('MODALS.UNIT.DESCRIPTION'),
      monthlyPrice: this.translate.instant('MODALS.UNIT.MONTHLY_PRICE'),
      
      // Caractéristiques
      hasKitchen: this.translate.instant('MODALS.UNIT.HAS_KITCHEN'),
      hasBathroom: this.translate.instant('MODALS.UNIT.HAS_BATHROOM'),
      hasShower: this.translate.instant('MODALS.UNIT.HAS_SHOWER'),
      isFurnished: this.translate.instant('MODALS.UNIT.IS_FURNISHED'),
      
      // Boutons
      save: this.translate.instant('COMMON.SAVE'),
      cancel: this.translate.instant('COMMON.CANCEL')
    };
  }

  /**
   * Obtient les traductions pour le modal de paiement
   */
  getPaymentModalTranslations() {
    return {
      // Titres
      addTitle: this.translate.instant('MODALS.PAYMENT.ADD_TITLE'),
      editTitle: this.translate.instant('MODALS.PAYMENT.EDIT_TITLE'),
      
      // Sections
      paymentInfo: this.translate.instant('MODALS.PAYMENT.PAYMENT_INFO'),
      contextInfo: this.translate.instant('MODALS.PAYMENT.CONTEXT_INFO'),
      
      // Champs
      tenant: this.translate.instant('MODALS.PAYMENT.TENANT'),
      room: this.translate.instant('MODALS.PAYMENT.ROOM'),
      paymentType: this.translate.instant('MODALS.PAYMENT.PAYMENT_TYPE'),
      amount: this.translate.instant('MODALS.PAYMENT.AMOUNT'),
      paymentDate: this.translate.instant('MODALS.PAYMENT.PAYMENT_DATE'),
      paymentMethod: this.translate.instant('MODALS.PAYMENT.PAYMENT_METHOD'),
      reference: this.translate.instant('MODALS.PAYMENT.REFERENCE'),
      reason: this.translate.instant('MODALS.PAYMENT.REASON'),
      notes: this.translate.instant('MODALS.PAYMENT.NOTES'),
      
      // Types de paiement
      rent: this.translate.instant('MODALS.PAYMENT.RENT'),
      deposit: this.translate.instant('MODALS.PAYMENT.DEPOSIT'),
      
      // Méthodes de paiement
      cash: this.translate.instant('MODALS.PAYMENT.CASH'),
      bankTransfer: this.translate.instant('MODALS.PAYMENT.BANK_TRANSFER'),
      check: this.translate.instant('MODALS.PAYMENT.CHECK'),
      card: this.translate.instant('MODALS.PAYMENT.CARD'),
      mobileMoney: this.translate.instant('MODALS.PAYMENT.MOBILE_MONEY'),
      
      // Boutons
      save: this.translate.instant('COMMON.SAVE'),
      cancel: this.translate.instant('COMMON.CANCEL')
    };
  }

  /**
   * Obtient les traductions pour le modal de suppression de paiement
   */
  getDeletePaymentModalTranslations() {
    return {
      title: this.translate.instant('MODALS.DELETE_PAYMENT.TITLE'),
      subtitle: this.translate.instant('MODALS.DELETE_PAYMENT.SUBTITLE'),
      message: this.translate.instant('MODALS.DELETE_PAYMENT.MESSAGE'),
      warning: this.translate.instant('MODALS.DELETE_PAYMENT.WARNING'),
      paymentDetails: this.translate.instant('MODALS.DELETE_PAYMENT.PAYMENT_DETAILS'),
      confirmDelete: this.translate.instant('MODALS.DELETE_PAYMENT.CONFIRM_DELETE'),
      cancel: this.translate.instant('COMMON.CANCEL')
    };
  }

  /**
   * Obtient les traductions pour le modal de résiliation de contrat
   */
  getContractTerminationModalTranslations() {
    return {
      title: this.translate.instant('MODALS.CONTRACT_TERMINATION.TITLE'),
      subtitle: this.translate.instant('MODALS.CONTRACT_TERMINATION.SUBTITLE'),
      tenantInfo: this.translate.instant('MODALS.CONTRACT_TERMINATION.TENANT_INFO'),
      roomInfo: this.translate.instant('MODALS.CONTRACT_TERMINATION.ROOM_INFO'),
      terminationDetails: this.translate.instant('MODALS.CONTRACT_TERMINATION.TERMINATION_DETAILS'),
      terminationDate: this.translate.instant('MODALS.CONTRACT_TERMINATION.TERMINATION_DATE'),
      terminationReason: this.translate.instant('MODALS.CONTRACT_TERMINATION.TERMINATION_REASON'),
      additionalNotes: this.translate.instant('MODALS.CONTRACT_TERMINATION.ADDITIONAL_NOTES'),
      confirmTermination: this.translate.instant('MODALS.CONTRACT_TERMINATION.CONFIRM_TERMINATION'),
      cancel: this.translate.instant('COMMON.CANCEL'),
      
      // Raisons de résiliation
      reasons: {
        endOfLease: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.END_OF_LEASE'),
        tenantRequest: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.TENANT_REQUEST'),
        nonPayment: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.NON_PAYMENT'),
        breachOfContract: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.BREACH_OF_CONTRACT'),
        propertySale: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.PROPERTY_SALE'),
        renovation: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.RENOVATION'),
        other: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.OTHER')
      }
    };
  }

  /**
   * Obtient les traductions pour les types de chambres
   */
  getRoomTypeTranslations() {
    return {
      room: this.translate.instant('ROOM_TYPES.ROOM'),
      studio: this.translate.instant('ROOM_TYPES.STUDIO'),
      apartment: this.translate.instant('ROOM_TYPES.APARTMENT'),
      simpleApartment: this.translate.instant('ROOM_TYPES.SIMPLE_APARTMENT'),
      furnishedApartment: this.translate.instant('ROOM_TYPES.FURNISHED_APARTMENT'),
      house: this.translate.instant('ROOM_TYPES.HOUSE'),
      villa: this.translate.instant('ROOM_TYPES.VILLA')
    };
  }

  /**
   * Obtient les traductions pour les statuts
   */
  getStatusTranslations() {
    return {
      available: this.translate.instant('STATUS.AVAILABLE'),
      occupied: this.translate.instant('STATUS.OCCUPIED'),
      maintenance: this.translate.instant('STATUS.MAINTENANCE'),
      reserved: this.translate.instant('STATUS.RESERVED'),
      active: this.translate.instant('STATUS.ACTIVE'),
      inactive: this.translate.instant('STATUS.INACTIVE'),
      pending: this.translate.instant('STATUS.PENDING'),
      approved: this.translate.instant('STATUS.APPROVED'),
      rejected: this.translate.instant('STATUS.REJECTED'),
      completed: this.translate.instant('STATUS.COMPLETED'),
      cancelled: this.translate.instant('STATUS.CANCELLED')
    };
  }

  /**
   * Obtient les traductions communes
   */
  getCommonTranslations() {
    return {
      save: this.translate.instant('COMMON.SAVE'),
      cancel: this.translate.instant('COMMON.CANCEL'),
      delete: this.translate.instant('COMMON.DELETE'),
      edit: this.translate.instant('COMMON.EDIT'),
      add: this.translate.instant('COMMON.ADD'),
      search: this.translate.instant('COMMON.SEARCH'),
      loading: this.translate.instant('COMMON.LOADING'),
      noData: this.translate.instant('COMMON.NO_DATA'),
      error: this.translate.instant('COMMON.ERROR'),
      success: this.translate.instant('COMMON.SUCCESS'),
      warning: this.translate.instant('COMMON.WARNING'),
      info: this.translate.instant('COMMON.INFO'),
      confirm: this.translate.instant('COMMON.CONFIRM'),
      yes: this.translate.instant('COMMON.YES'),
      no: this.translate.instant('COMMON.NO'),
      close: this.translate.instant('COMMON.CLOSE'),
      back: this.translate.instant('COMMON.BACK'),
      next: this.translate.instant('COMMON.NEXT'),
      previous: this.translate.instant('COMMON.PREVIOUS'),
      submit: this.translate.instant('COMMON.SUBMIT'),
      reset: this.translate.instant('COMMON.RESET'),
      today: this.translate.instant('COMMON.TODAY'),
      yesterday: this.translate.instant('COMMON.YESTERDAY'),
      saving: this.translate.instant('COMMON.SAVING')
    };
  }

  /**
   * Traduit une clé de manière réactive
   */
  translateKey(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  /**
   * Traduit une clé de manière instantanée
   */
  translateInstant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
}
