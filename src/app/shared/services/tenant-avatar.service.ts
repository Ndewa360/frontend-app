import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TenantAvatarService {

  constructor() { }

  /**
   * Obtenir les initiales d'un locataire
   */
  getTenantInitials(tenant: any): string {
    if (!tenant) return 'L';
    
    const name = tenant.fullName || tenant.name || 'Locataire';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Obtenir l'URL de la photo de profil d'un locataire
   */
  getTenantProfilePicture(tenant: any): string | null {
    return tenant?.profilePicture || null;
  }

  /**
   * Vérifier si un locataire a une photo de profil
   */
  hasTenantProfilePicture(tenant: any): boolean {
    return !!(tenant?.profilePicture);
  }

  /**
   * Obtenir une couleur d'avatar basée sur l'ID du locataire
   */
  getTenantAvatarColor(tenant: any): string {
    if (!tenant?._id) return '#6B7280'; // Gris par défaut

    // Générer une couleur basée sur l'ID
    const colors = [
      '#EF4444', // Rouge
      '#F97316', // Orange
      '#EAB308', // Jaune
      '#22C55E', // Vert
      '#06B6D4', // Cyan
      '#3B82F6', // Bleu
      '#8B5CF6', // Violet
      '#EC4899', // Rose
      '#10B981', // Emeraude
      '#F59E0B'  // Ambre
    ];

    // Utiliser l'ID pour sélectionner une couleur
    const hash = tenant._id.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  }

  /**
   * Obtenir les données complètes d'avatar pour un locataire
   */
  getTenantAvatarData(tenant: any): {
    hasPhoto: boolean;
    photoUrl: string | null;
    initials: string;
    backgroundColor: string;
  } {
    return {
      hasPhoto: this.hasTenantProfilePicture(tenant),
      photoUrl: this.getTenantProfilePicture(tenant),
      initials: this.getTenantInitials(tenant),
      backgroundColor: this.getTenantAvatarColor(tenant)
    };
  }
}
