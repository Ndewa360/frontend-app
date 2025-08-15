import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';
import { UserProfileAction } from '../../../../shared/store/user-profile/user-profile.actions';
import { UserProfileModel } from '../../../../shared/store/user-profile/user-profile.model';
import { LocalizationConfigService, SupportedLanguage, SupportedCurrency } from '../../../../shared/services/localization/localization-config.service';
import { TranslationService } from '../../../../shared/services/localization/translation.service';
import { LocalizationService } from '../../../../shared/services/localization/localization.service';

@Component({
  selector: 'app-localization-settings',
  template: `
    <!-- Section Préférences de localisation intégrée -->
    <section id="section-localization" class="profile-section">
      <div class="section-header">
        <div class="section-icon">
          <youpez-ibm-icon iconName="globe" iconSize="24"></youpez-ibm-icon>
        </div>
        <div class="section-title-group">
          <h2 class="section-title">{{ 'SETTINGS.LANGUAGE_SETTINGS_TITLE' | translate }}</h2>
          <p class="section-description">{{ 'SETTINGS.LANGUAGE_SETTINGS_DESCRIPTION' | translate }}</p>
        </div>
      </div>

      <div class="section-content">
        <div class="localization-form">
          
          <!-- Sélection de langue avec aperçu -->
          <div class="language-currency-grid">
            <div class="form-field">
              <label for="preferredLanguage" class="field-label">
                <youpez-ibm-icon iconName="language" iconSize="16"></youpez-ibm-icon>
                {{ 'SETTINGS.LANGUAGE' | translate }}
              </label>
              <div class="custom-select-wrapper">
                <select
                  id="preferredLanguage"
                  [value]="getFormValue('preferredLanguage')"
                  (change)="onLanguageChange($any($event.target).value)"
                  class="field-input custom-select">
                  <option value="" disabled>{{ 'SETTINGS.SELECT_LANGUAGE_PLACEHOLDER' | translate }}</option>
                  <option
                    *ngFor="let language of supportedLanguages"
                    [value]="language.code">
                    {{ getLanguageDisplayName(language) }}
                  </option>
                </select>
                <youpez-ibm-icon iconName="chevronDown" iconSize="16" class="select-icon"></youpez-ibm-icon>
              </div>
              <div class="field-hint" *ngIf="getCurrentLanguageInfo()">
                {{ 'SETTINGS.CURRENT_LANGUAGE_INFO' | translate }}: {{ getCurrentLanguageInfo()?.nativeName }}
              </div>
            </div>

            <div class="form-field">
              <label for="preferredCurrency" class="field-label">
                <youpez-ibm-icon iconName="currency-dollar" iconSize="16"></youpez-ibm-icon>
                {{ 'SETTINGS.CURRENCY' | translate }}
              </label>
              <div class="custom-select-wrapper">
                <select
                  id="preferredCurrency"
                  [value]="getFormValue('preferredCurrency')"
                  (change)="onCurrencyChange($any($event.target).value)"
                  class="field-input custom-select">
                  <option value="" disabled>{{ 'SETTINGS.SELECT_CURRENCY_PLACEHOLDER' | translate }}</option>
                  <option
                    *ngFor="let currency of supportedCurrencies"
                    [value]="currency.code">
                    {{ getCurrencyDisplayName(currency) }}
                  </option>
                </select>
                <youpez-ibm-icon iconName="chevronDown" iconSize="16" class="select-icon"></youpez-ibm-icon>
              </div>
              <div class="field-hint" *ngIf="getCurrentCurrencyInfo()">
                {{ 'SETTINGS.CURRENT_CURRENCY_INFO' | translate }}: {{ getCurrentCurrencyInfo()?.name }}
              </div>
            </div>
          </div>

          <!-- Paramètres avancés -->
          <div class="advanced-settings">
            <div class="settings-toggle" (click)="toggleAdvancedSettings()">
              <span class="toggle-label">{{ 'SETTINGS.ADVANCED_SETTINGS' | translate }}</span>
              <youpez-ibm-icon 
                [iconName]="showAdvancedSettings ? 'chevronUp' : 'chevronDown'" 
                iconSize="16" 
                class="toggle-icon">
              </youpez-ibm-icon>
            </div>

            <div class="advanced-content" [class.expanded]="showAdvancedSettings">
              <div class="form-grid">
                <div class="form-field">
                  <label for="timezone" class="field-label">
                    <youpez-ibm-icon iconName="time" iconSize="16"></youpez-ibm-icon>
                    {{ 'SETTINGS.TIMEZONE_LABEL' | translate }}
                  </label>
                  <div class="custom-select-wrapper">
                    <select 
                      id="timezone"
                      formControlName="timezone"
                      class="field-input custom-select">
                      <option value="Africa/Douala">{{ 'SETTINGS.TIMEZONE_OPTIONS.AFRICA_DOUALA' | translate }}</option>
                      <option value="Europe/Paris">{{ 'SETTINGS.TIMEZONE_OPTIONS.EUROPE_PARIS' | translate }}</option>
                      <option value="America/New_York">{{ 'SETTINGS.TIMEZONE_OPTIONS.AMERICA_NEW_YORK' | translate }}</option>
                      <option value="Asia/Tokyo">{{ 'SETTINGS.TIMEZONE_OPTIONS.ASIA_TOKYO' | translate }}</option>
                      <option value="UTC">{{ 'SETTINGS.TIMEZONE_OPTIONS.UTC' | translate }}</option>
                    </select>
                    <youpez-ibm-icon iconName="chevronDown" iconSize="16" class="select-icon"></youpez-ibm-icon>
                  </div>
                </div>

                <div class="form-field">
                  <label for="dateFormat" class="field-label">
                    <youpez-ibm-icon iconName="calendar" iconSize="16"></youpez-ibm-icon>
                    {{ 'SETTINGS.DATE_FORMAT_LABEL' | translate }}
                  </label>
                  <div class="custom-select-wrapper">
                    <select 
                      id="dateFormat"
                      formControlName="dateFormat"
                      class="field-input custom-select">
                      <option value="DD/MM/YYYY">{{ 'SETTINGS.DATE_FORMAT_OPTIONS.DD_MM_YYYY' | translate }}</option>
                      <option value="MM/DD/YYYY">{{ 'SETTINGS.DATE_FORMAT_OPTIONS.MM_DD_YYYY' | translate }}</option>
                      <option value="YYYY-MM-DD">{{ 'SETTINGS.DATE_FORMAT_OPTIONS.YYYY_MM_DD' | translate }}</option>
                      <option value="DD-MM-YYYY">{{ 'SETTINGS.DATE_FORMAT_OPTIONS.DD_MM_YYYY_DASH' | translate }}</option>
                    </select>
                    <youpez-ibm-icon iconName="chevronDown" iconSize="16" class="select-icon"></youpez-ibm-icon>
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label for="numberFormat" class="field-label">
                  <youpez-ibm-icon iconName="hashtag" iconSize="16"></youpez-ibm-icon>
                  {{ 'SETTINGS.NUMBER_FORMAT_LABEL' | translate }}
                </label>
                <div class="custom-select-wrapper">
                  <select 
                    id="numberFormat"
                    formControlName="numberFormat"
                    class="field-input custom-select">
                    <option value="fr-FR">{{ 'SETTINGS.NUMBER_FORMAT_OPTIONS.FRENCH_FULL' | translate }}</option>
                    <option value="en-US">{{ 'SETTINGS.NUMBER_FORMAT_OPTIONS.ENGLISH_US_FULL' | translate }}</option>
                    <option value="es-ES">{{ 'SETTINGS.NUMBER_FORMAT_OPTIONS.SPANISH_FULL' | translate }}</option>
                    <option value="de-DE">{{ 'SETTINGS.NUMBER_FORMAT_OPTIONS.GERMAN_FULL' | translate }}</option>
                    <option value="ar-SA">{{ 'SETTINGS.NUMBER_FORMAT_OPTIONS.ARABIC_FULL' | translate }}</option>
                  </select>
                  <youpez-ibm-icon iconName="chevronDown" iconSize="16" class="select-icon"></youpez-ibm-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Aperçu des formats -->
          <div class="preview-section" *ngIf="showPreview">
            <div class="preview-header">
              <h4 class="preview-title">
                <youpez-ibm-icon iconName="view" iconSize="16"></youpez-ibm-icon>
                {{ 'SETTINGS.FORMAT_PREVIEW' | translate }}
              </h4>
              <button 
                type="button" 
                class="preview-toggle"
                (click)="togglePreview()">
                <youpez-ibm-icon iconName="view-off" iconSize="16"></youpez-ibm-icon>
              </button>
            </div>
            
            <div class="preview-grid">
              <div class="preview-item">
                <label class="preview-label">{{ 'SETTINGS.NUMBER_EXAMPLE' | translate }}</label>
                <div class="preview-value">{{ getFormattedNumberExample() }}</div>
              </div>

              <div class="preview-item">
                <label class="preview-label">{{ 'SETTINGS.CURRENCY_EXAMPLE' | translate }}</label>
                <div class="preview-value">{{ getFormattedCurrencyExample() }}</div>
              </div>

              <div class="preview-item">
                <label class="preview-label">{{ 'SETTINGS.DATE_EXAMPLE' | translate }}</label>
                <div class="preview-value">{{ getFormattedDateExample() }}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styleUrls: ['./localization-settings.component.scss']
})
export class LocalizationSettingsComponent implements OnInit, OnDestroy {

  @Input() parentFormGroup: FormGroup;
  @Output() formChange = new EventEmitter<any>();

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;

  supportedLanguages: SupportedLanguage[] = [];
  supportedCurrencies: SupportedCurrency[] = [];
  showAdvancedSettings = false;
  showPreview = true;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private configService: LocalizationConfigService,
    private translationService: TranslationService,
    private localizationService: LocalizationService
  ) {
    this.loadSupportedOptions();
  }

  ngOnInit(): void {
    // Pas besoin d'initialiser un formulaire séparé
    // Le composant parent gère le formulaire
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSupportedOptions(): void {
    this.supportedLanguages = this.configService.getSupportedLanguages();
    this.supportedCurrencies = this.configService.getSupportedCurrencies();
  }

  getFormValue(controlName: string): any {
    return this.parentFormGroup?.get(controlName)?.value || '';
  }

  updateParentForm(controlName: string, value: any): void {
    if (this.parentFormGroup?.get(controlName)) {
      this.parentFormGroup.get(controlName)?.setValue(value);
      this.formChange.emit({ [controlName]: value });
    }
  }

  // Méthodes publiques pour le template
  onLanguageChange(languageCode: string): void {
    this.translationService.changeLanguage(languageCode);
    const numberFormat = this.getNumberFormatForLanguage(languageCode);

    // Mettre à jour le formulaire parent
    this.updateParentForm('preferredLanguage', languageCode);
    this.updateParentForm('numberFormat', numberFormat);
  }

  onCurrencyChange(currencyCode: string): void {
    this.localizationService.changeCurrency(currencyCode);

    // Mettre à jour le formulaire parent
    this.updateParentForm('preferredCurrency', currencyCode);
  }

  toggleAdvancedSettings(): void {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  getLanguageDisplayName(language: SupportedLanguage): string {
    return `${language.flag} ${language.nativeName}`;
  }

  getCurrencyDisplayName(currency: SupportedCurrency): string {
    return `${currency.symbol} ${currency.name}`;
  }

  getCurrentLanguageInfo(): SupportedLanguage | undefined {
    const currentLang = this.getFormValue('preferredLanguage');
    return this.configService.getLanguageByCode(currentLang);
  }

  getCurrentCurrencyInfo(): SupportedCurrency | undefined {
    const currentCurrency = this.getFormValue('preferredCurrency');
    return this.configService.getCurrencyByCode(currentCurrency);
  }

  getFormattedNumberExample(): string {
    return this.translationService.formatNumber(1234567.89);
  }

  getFormattedCurrencyExample(): string {
    return this.translationService.formatCurrency(1234567.89);
  }

  getFormattedDateExample(): string {
    return this.translationService.formatDate(new Date(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }



  private getNumberFormatForLanguage(language: string): string {
    const formatMap: { [key: string]: string } = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'ar': 'ar-SA'
    };
    return formatMap[language] || 'fr-FR';
  }
}
