import { Component, OnInit, OnDestroy } from '@angular/core';
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
  templateUrl: './localization-settings.component.html',
  styleUrls: ['./localization-settings.component.scss']
})
export class LocalizationSettingsComponent implements OnInit, OnDestroy {

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;
  @Select(UserProfileState.selectStateSavedLoading) waitingForSave$: Observable<boolean>;

  localizationForm: FormGroup;
  supportedLanguages: SupportedLanguage[] = [];
  supportedCurrencies: SupportedCurrency[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private configService: LocalizationConfigService,
    private translationService: TranslationService,
    private localizationService: LocalizationService
  ) {
    this.initializeForm();
    this.loadSupportedOptions();
  }

  ngOnInit(): void {
    // Écouter les changements du profil utilisateur
    this.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userProfile => {
        if (userProfile) {
          this.updateFormWithUserProfile(userProfile);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const config = this.configService.getConfig();
    
    this.localizationForm = this.formBuilder.group({
      preferredLanguage: [config.defaultLanguage, Validators.required],
      preferredCurrency: [config.defaultCurrency, Validators.required],
      timezone: [config.defaultTimezone],
      dateFormat: ['DD/MM/YYYY'],
      numberFormat: ['fr-FR']
    });
  }

  private loadSupportedOptions(): void {
    this.supportedLanguages = this.configService.getSupportedLanguages();
    this.supportedCurrencies = this.configService.getSupportedCurrencies();
  }

  private updateFormWithUserProfile(userProfile: UserProfileModel): void {
    const config = this.configService.getConfig();
    
    this.localizationForm.patchValue({
      preferredLanguage: userProfile.preferredLanguage || config.defaultLanguage,
      preferredCurrency: userProfile.preferredCurrency || config.defaultCurrency,
      timezone: userProfile.timezone || config.defaultTimezone,
      dateFormat: userProfile.dateFormat || 'DD/MM/YYYY',
      numberFormat: userProfile.numberFormat || 'fr-FR'
    });
  }

  onLanguageChange(languageCode: string): void {
    // Mettre à jour immédiatement l'interface
    this.translationService.changeLanguage(languageCode);
    
    // Mettre à jour le format des nombres selon la langue
    const numberFormat = this.getNumberFormatForLanguage(languageCode);
    this.localizationForm.patchValue({
      numberFormat: numberFormat
    });
  }

  onCurrencyChange(currencyCode: string): void {
    // Mettre à jour immédiatement le service de localisation
    this.localizationService.changeCurrency(currencyCode);
  }

  onSavePreferences(): void {
    if (this.localizationForm.valid) {
      const preferences = this.localizationForm.value;
      
      // Sauvegarder les préférences via le store
      this.store.dispatch(new UserProfileAction.UpdateUserLocalizationPreferences(preferences));
    }
  }

  onResetToDefaults(): void {
    const config = this.configService.getConfig();
    
    this.localizationForm.patchValue({
      preferredLanguage: config.defaultLanguage,
      preferredCurrency: config.defaultCurrency,
      timezone: config.defaultTimezone,
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'fr-FR'
    });

    // Appliquer immédiatement les changements
    this.onLanguageChange(config.defaultLanguage);
    this.onCurrencyChange(config.defaultCurrency);
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

  getLanguageDisplayName(language: SupportedLanguage): string {
    return `${language.flag} ${language.nativeName}`;
  }

  getCurrencyDisplayName(currency: SupportedCurrency): string {
    return `${currency.symbol} ${currency.name}`;
  }

  // Méthodes pour les exemples de formatage
  getFormattedNumberExample(): string {
    const currentState = this.localizationService.getCurrentLocalizationState();
    return this.translationService.formatNumber(1234567.89);
  }

  getFormattedCurrencyExample(): string {
    const currentState = this.localizationService.getCurrentLocalizationState();
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

  isFormValid(): boolean {
    return this.localizationForm.valid;
  }

  hasFormChanged(): boolean {
    return this.localizationForm.dirty;
  }
}
