import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslationService } from '../../services/localization/translation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss']
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  currentLanguage = 'fr';
  supportedLanguages: any[] = [];
  isDropdownOpen = false;
  isMobile = false;

  constructor(
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Vérifier si on est sur mobile (ne pas afficher le switcher)
    this.isMobile = this.translationService.isMobilePlatform();
    
    // Obtenir les langues supportées
    this.supportedLanguages = this.translationService.getSupportedLanguagesWithMetadata();
    
    // Écouter les changements de langue
    this.translationService.getCurrentLanguage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Bascule l'ouverture du dropdown
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Ferme le dropdown
   */
  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  /**
   * Change la langue
   */
  async changeLanguage(languageCode: string): Promise<void> {
    if (languageCode !== this.currentLanguage) {
      // Changer la langue
      this.translationService.changeLanguage(languageCode);
      
      // Sauvegarder la préférence
      await this.translationService.saveLanguagePreference(languageCode);
      
      // Fermer le dropdown
      this.closeDropdown();
      
      console.log('🌐 Langue changée vers:', languageCode);
    }
  }

  /**
   * Obtient le nom d'affichage de la langue actuelle
   */
  getCurrentLanguageDisplay(): string {
    return this.translationService.getLanguageDisplayName(this.currentLanguage);
  }

  /**
   * Obtient le nom d'affichage d'une langue
   */
  getLanguageDisplay(languageCode: string): string {
    return this.translationService.getLanguageDisplayName(languageCode);
  }

  /**
   * Gère les clics en dehors du composant
   */
  onClickOutside(): void {
    this.closeDropdown();
  }
}
