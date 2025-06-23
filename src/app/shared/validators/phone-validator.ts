import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validateur de numéro de téléphone international
 * Utilise libphonenumber-js pour une validation robuste
 */
export function phoneValidator(defaultCountry: string = 'CM'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Laisser le validateur 'required' gérer les champs vides
    }

    try {
      const phoneNumber = parsePhoneNumber(control.value, defaultCountry as any);
      
      if (!phoneNumber || !phoneNumber.isValid()) {
        return {
          phoneInvalid: {
            message: 'Numéro de téléphone invalide',
            example: '+237 6XX XX XX XX'
          }
        };
      }

      return null;
    } catch (error) {
      return {
        phoneInvalid: {
          message: 'Format de téléphone non reconnu',
          example: '+237 6XX XX XX XX'
        }
      };
    }
  };
}

/**
 * Validateur simple pour les numéros camerounais
 */
export function cameroonPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Pattern pour les numéros camerounais
    const cameroonPattern = /^(\+237|237)?[2368]\d{7,8}$/;
    
    if (!cameroonPattern.test(control.value.replace(/\s/g, ''))) {
      return {
        phoneInvalid: {
          message: 'Numéro camerounais invalide',
          example: '+237 6XX XX XX XX ou 6XX XX XX XX'
        }
      };
    }

    return null;
  };
}

/**
 * Formateur de numéro de téléphone
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountry: string = 'CM'): string {
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);
    return parsed ? parsed.formatInternational() : phoneNumber;
  } catch {
    return phoneNumber;
  }
}
