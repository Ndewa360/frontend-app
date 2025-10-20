import { Injectable } from '@angular/core';
import { TranslationService } from '../../../shared/services/localization/translation.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyDetailsTranslationService {

  constructor(private translationService: TranslationService) {}

  // Traductions pour les onglets
  getTabTranslations(): { [key: string]: string } {
    return {
      'overview': 'PROPERTY_DETAILS.TABS.OVERVIEW',
      'units': 'PROPERTY_DETAILS.TABS.UNITS',
      'tenants': 'PROPERTY_DETAILS.TABS.TENANTS',
      'history': 'PROPERTY_DETAILS.TABS.HISTORY',
      'finances': 'PROPERTY_DETAILS.TABS.FINANCES'
    };
  }

  // Traductions pour les statuts d'unités
  getUnitStatusTranslations(): { [key: string]: string } {
    return {
      'available': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.STATUS.AVAILABLE',
      'occupied': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.STATUS.OCCUPIED',
      'maintenance': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.STATUS.MAINTENANCE'
    };
  }

  // Traductions pour les statuts de locataires
  getTenantStatusTranslations(): { [key: string]: string } {
    return {
      'active': 'PROPERTY_DETAILS.TENANTS.TENANT_CARD.STATUS.ACTIVE',
      'inactive': 'PROPERTY_DETAILS.TENANTS.TENANT_CARD.STATUS.INACTIVE',
      'pending': 'PROPERTY_DETAILS.TENANTS.TENANT_CARD.STATUS.PENDING'
    };
  }

  // Traductions pour les types d'unités
  getUnitTypeTranslations(): { [key: string]: string } {
    return {
      'room': 'ROOM_TYPES.ROOM',
      'studio': 'ROOM_TYPES.STUDIO',
      'simple_apartment': 'ROOM_TYPES.SIMPLE_APARTMENT',
      'furnished_apartment': 'ROOM_TYPES.FURNISHED_APARTMENT',
      'apartment': 'ROOM_TYPES.APARTMENT',
      'house': 'ROOM_TYPES.HOUSE',
      'villa': 'ROOM_TYPES.VILLA'
    };
  }

  // Traductions pour les actions
  getActionTranslations(): { [key: string]: string } {
    return {
      'view_details': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.VIEW_DETAILS',
      'assign_tenant': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.ASSIGN_TENANT',
      'terminate_lease': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.TERMINATE_LEASE',
      'edit': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.EDIT',
      'delete': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.DELETE',
      'manage_media': 'PROPERTY_DETAILS.UNITS.UNIT_CARD.ACTIONS.MANAGE_MEDIA'
    };
  }

  // Méthode utilitaire pour obtenir une traduction
  translate(key: string): Observable<string> {
    return this.translationService.translate(key);
  }

  // Méthode utilitaire pour obtenir une traduction instantanée
  instant(key: string): string {
    return this.translationService.instant(key);
  }

  // Traductions pour les labels de condition de propriété
  getConditionLabels(): { [key: string]: string } {
    return {
      'NEW': 'PROPERTY_DETAILS.OVERVIEW.CONDITION_LABELS.NEW',
      'EXCELLENT': 'PROPERTY_DETAILS.OVERVIEW.CONDITION_LABELS.EXCELLENT',
      'GOOD': 'PROPERTY_DETAILS.OVERVIEW.CONDITION_LABELS.GOOD',
      'FAIR': 'PROPERTY_DETAILS.OVERVIEW.CONDITION_LABELS.FAIR',
      'POOR': 'PROPERTY_DETAILS.OVERVIEW.CONDITION_LABELS.POOR'
    };
  }

  // Traductions pour les labels d'ameublement
  getFurnishingLabels(): { [key: string]: string } {
    return {
      'UNFURNISHED': 'PROPERTY_DETAILS.OVERVIEW.FURNISHING_LABELS.UNFURNISHED',
      'SEMI_FURNISHED': 'PROPERTY_DETAILS.OVERVIEW.FURNISHING_LABELS.SEMI_FURNISHED',
      'FURNISHED': 'PROPERTY_DETAILS.OVERVIEW.FURNISHING_LABELS.FURNISHED'
    };
  }

  // Traductions pour les statuts de rendement
  getYieldStatusLabels(): { [key: string]: string } {
    return {
      'excellent': 'PROPERTY_DETAILS.OVERVIEW.YIELD_STATUS.EXCELLENT',
      'good': 'PROPERTY_DETAILS.OVERVIEW.YIELD_STATUS.GOOD',
      'average': 'PROPERTY_DETAILS.OVERVIEW.YIELD_STATUS.AVERAGE',
      'poor': 'PROPERTY_DETAILS.OVERVIEW.YIELD_STATUS.POOR'
    };
  }
}