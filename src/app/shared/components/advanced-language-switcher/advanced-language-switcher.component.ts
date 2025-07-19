import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslationService } from '../../services/localization/translation.service';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  nativeName?: string;
}

@Component({
  selector: 'app-advanced-language-switcher',
  templateUrl: './advanced-language-switcher.component.html',
  styleUrls: ['./advanced-language-switcher.component.scss']
})
export class AdvancedLanguageSwitcherComponent implements OnInit, OnDestroy {
  
  @Input() showFlags: boolean = true;
  @Input() showNativeNames: boolean = true;
  @Input() compact: boolean = false;
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  @Output() languageChanged = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  currentLanguage = 'fr';
  supportedLanguages: LanguageOption[] = [];
  isDropdownOpen = false;
  isMobile = false;

  constructor(
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Vérifier si on est sur mobile
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
   * Change la langue
   */
  changeLanguage(languageCode: string): void {
    if (languageCode !== this.currentLanguage) {
      this.translationService.changeLanguage(languageCode);
      this.languageChanged.emit(languageCode);
      this.closeDropdown();
    }
  }

  /**
   * Bascule l'état du dropdown
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
   * Obtient la langue actuelle avec ses métadonnées
   */
  getCurrentLanguageData(): LanguageOption | undefined {
    return this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
  }

  /**
   * Obtient les autres langues (pas la langue actuelle)
   */
  getOtherLanguages(): LanguageOption[] {
    return this.supportedLanguages.filter(lang => lang.code !== this.currentLanguage);
  }

  /**
   * Gère les clics en dehors du composant
   */
  onClickOutside(): void {
    this.closeDropdown();
  }

  /**
   * Gère les événements clavier
   */
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeDropdown();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isDropdownOpen) {
          this.toggleDropdown();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isDropdownOpen) {
          this.closeDropdown();
        }
        break;
    }
  }

  /**
   * Obtient les classes CSS pour le dropdown
   */
  getDropdownClasses(): string {
    const baseClasses = 'language-dropdown';
    const positionClass = `dropdown-${this.position}`;
    const compactClass = this.compact ? 'dropdown-compact' : '';
    const openClass = this.isDropdownOpen ? 'dropdown-open' : '';
    
    return [baseClasses, positionClass, compactClass, openClass].filter(Boolean).join(' ');
  }

  /**
   * Obtient les classes CSS pour le bouton principal
   */
  getButtonClasses(): string {
    const baseClasses = 'language-button';
    const compactClass = this.compact ? 'button-compact' : '';
    const activeClass = this.isDropdownOpen ? 'button-active' : '';

    return [baseClasses, compactClass, activeClass].filter(Boolean).join(' ');
  }

  /**
   * TrackBy function pour la liste des langues
   */
  trackByLanguageCode(index: number, language: LanguageOption): string {
    return language.code;
  }
}
