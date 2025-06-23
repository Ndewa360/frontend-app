import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PropertyImageService {
  
  private readonly defaultImages = [
    '/assets/images/properties/property-placeholder-1.svg',
    '/assets/images/properties/property-placeholder-2.svg',
    '/assets/images/properties/property-placeholder-3.svg'
  ];

  constructor() { }

  /**
   * Retourne une image par défaut basée sur l'ID de la propriété
   * Cela garantit que la même propriété aura toujours la même image par défaut
   */
  getDefaultImage(propertyId: string): string {
    if (!propertyId) {
      return this.defaultImages[0];
    }
    
    // Utiliser un hash simple de l'ID pour choisir une image
    const hash = this.simpleHash(propertyId);
    const index = hash % this.defaultImages.length;
    return this.defaultImages[index];
  }

  /**
   * Retourne l'image de la propriété ou une image par défaut si aucune image n'est disponible
   */
  getPropertyImage(propertyImage: string | null | undefined, propertyId: string): string {
    if (propertyImage && propertyImage.trim() !== '') {
      return propertyImage;
    }
    return this.getDefaultImage(propertyId);
  }

  /**
   * Vérifie si une URL d'image est valide
   */
  isValidImageUrl(url: string | null | undefined): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    
    // Vérifier les extensions d'image communes
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.startsWith('data:image/') ||
           lowerUrl.startsWith('http://') ||
           lowerUrl.startsWith('https://');
  }

  /**
   * Retourne une couleur de fond basée sur l'ID de la propriété
   * Utile pour les avatars ou les placeholders colorés
   */
  getPropertyColor(propertyId: string): string {
    const colors = [
      '#3B82F6', // Blue
      '#8B5CF6', // Purple
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316'  // Orange
    ];
    
    const hash = this.simpleHash(propertyId);
    const index = hash % colors.length;
    return colors[index];
  }

  /**
   * Génère un hash simple à partir d'une chaîne
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32 bits
    }
    return Math.abs(hash);
  }

  /**
   * Retourne une image par défaut aléatoire
   */
  getRandomDefaultImage(): string {
    const randomIndex = Math.floor(Math.random() * this.defaultImages.length);
    return this.defaultImages[randomIndex];
  }

  /**
   * Retourne toutes les images par défaut disponibles
   */
  getAllDefaultImages(): string[] {
    return [...this.defaultImages];
  }

  /**
   * Génère un placeholder SVG dynamique avec le nom de la propriété
   */
  generateDynamicPlaceholder(propertyName: string, propertyId: string): string {
    const color = this.getPropertyColor(propertyId);
    const initials = this.getInitials(propertyName);
    
    const svg = `
      <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${color}20"/>
        <rect x="50" y="50" width="300" height="200" fill="${color}40" stroke="${color}" stroke-width="2" rx="8"/>
        <circle cx="200" cy="120" r="30" fill="${color}"/>
        <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${initials}</text>
        <text x="200" y="280" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="14">${propertyName}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Extrait les initiales d'un nom de propriété
   */
  private getInitials(name: string): string {
    if (!name) return 'PR';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }
}
