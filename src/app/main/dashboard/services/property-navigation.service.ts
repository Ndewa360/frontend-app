import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { PropertyModel } from 'src/app/shared/store';

@Injectable({
  providedIn: 'root'
})
export class PropertyNavigationService {

  constructor(
    private router: Router,
    private languageUrlService: LanguageUrlService
  ) {}

  /**
   * Naviguer vers les détails d'une propriété
   */
  navigateToPropertyDetails(propertyId: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/details`, propertyId]);
  }

  /**
   * Naviguer vers la liste des propriétés
   */
  navigateToPropertiesList(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/home`]);
  }

  /**
   * Naviguer vers l'édition d'une propriété
   */
  navigateToPropertyEdit(propertyId: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/edit`, propertyId]);
  }

  /**
   * Naviguer vers les finances d'une propriété
   */
  navigateToPropertyFinances(propertyId: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/finances`, propertyId]);
  }

  /**
   * Naviguer vers l'ajout d'un locataire
   */
  navigateToAddTenant(propertyId: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/assign-location`], {
      queryParams: { propertyId }
    });
  }

  /**
   * Naviguer vers les détails d'une unité
   */
  navigateToUnitDetails(unitId: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/rooms`, unitId]);
  }
}