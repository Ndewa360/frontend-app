import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validateur pour le contenu HTML
 */
export function htmlContentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null; // Laisser la validation required s'occuper des valeurs vides
    }

    if (typeof value !== 'string') {
      return { htmlContent: { message: 'Le contenu doit être une chaîne de caractères' } };
    }

    // Vérifier la taille minimale
    if (value.length < 10) {
      return { htmlContent: { message: 'Le contenu HTML doit contenir au moins 10 caractères' } };
    }

    // Vérifier la taille maximale (1MB)
    if (value.length > 1000000) {
      return { htmlContent: { message: 'Le contenu HTML ne peut pas dépasser 1MB' } };
    }

    // Vérifier qu'il contient au moins une balise HTML
    const hasHTMLTags = /<[^>]+>/g.test(value);
    if (!hasHTMLTags) {
      return { htmlContent: { message: 'Le contenu doit contenir au moins une balise HTML' } };
    }

    // Vérifier qu'il n'y a pas de scripts malveillants
    const dangerousPatterns = [
      { pattern: /<script[^>]*>/gi, message: 'Les balises <script> ne sont pas autorisées' },
      { pattern: /javascript:/gi, message: 'Le code JavaScript n\'est pas autorisé' },
      { pattern: /on\w+\s*=/gi, message: 'Les gestionnaires d\'événements ne sont pas autorisés' },
      { pattern: /<iframe[^>]*>/gi, message: 'Les balises <iframe> ne sont pas autorisées' },
      { pattern: /<object[^>]*>/gi, message: 'Les balises <object> ne sont pas autorisées' },
      { pattern: /<embed[^>]*>/gi, message: 'Les balises <embed> ne sont pas autorisées' }
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(value)) {
        return { htmlContent: { message } };
      }
    }

    // Vérifier les balises non fermées (basique)
    const openTags = value.match(/<[^/>][^>]*>/g) || [];
    const closeTags = value.match(/<\/[^>]+>/g) || [];
    
    if (openTags.length > closeTags.length + 10) { // Tolérance pour les balises auto-fermantes
      return { htmlContent: { message: 'Certaines balises HTML ne sont pas fermées correctement' } };
    }

    return null;
  };
}

/**
 * Validateur pour les variables de template
 */
export function templateVariablesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    if (typeof value !== 'object') {
      return { templateVariables: { message: 'Les variables doivent être un objet' } };
    }

    const errors: string[] = [];

    for (const [key, val] of Object.entries(value)) {
      // Valider la clé (format de variable)
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        errors.push(`La variable "${key}" n'a pas un format valide (utilisez MAJUSCULES_AVEC_UNDERSCORES)`);
      }

      // Valider la valeur
      if (typeof val === 'string') {
        // Vérifier qu'il n'y a pas de contenu dangereux dans les valeurs
        const dangerousPatterns = [
          /<script[^>]*>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(val)) {
            errors.push(`La valeur de la variable "${key}" contient du contenu dangereux`);
            break;
          }
        }
      }
    }

    if (errors.length > 0) {
      return { templateVariables: { message: errors.join(', ') } };
    }

    return null;
  };
}

/**
 * Validateur pour les noms de template
 */
export function templateNameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    if (typeof value !== 'string') {
      return { templateName: { message: 'Le nom doit être une chaîne de caractères' } };
    }

    // Vérifier la longueur
    if (value.length < 3) {
      return { templateName: { message: 'Le nom doit contenir au moins 3 caractères' } };
    }

    if (value.length > 100) {
      return { templateName: { message: 'Le nom ne peut pas dépasser 100 caractères' } };
    }

    // Vérifier les caractères autorisés
    if (!/^[a-zA-Z0-9\s\-_àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+$/.test(value)) {
      return { templateName: { message: 'Le nom contient des caractères non autorisés' } };
    }

    // Vérifier qu'il ne commence/finit pas par un espace
    if (value.trim() !== value) {
      return { templateName: { message: 'Le nom ne peut pas commencer ou finir par un espace' } };
    }

    return null;
  };
}
