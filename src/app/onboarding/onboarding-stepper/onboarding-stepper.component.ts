import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  Actions,
  ofActionCompleted,
  ofActionErrored,
  ofActionSuccessful,
  Store,
} from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { UserProfileAction } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

export interface OnboardingData {
  // Étape 1 — Bien
  propertyName: string;
  propertyCountryId: string;
  propertyCityId: string;
  propertyLocation: string;
  propertyType: string;
  // Étape 2 — Unités
  units: Array<{ type: string; price: number; shouldPayCaution: boolean; cautionPrice: number }>;
  // Étape 3 — Locataires
  hasTenants: boolean;
  tenants: Array<{ fullName: string; phoneNumber: string; email: string }>;
  // Étape 4 — Compte
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  userType: string;
}

const STORAGE_KEY = 'ndewa360_onboarding_data';

@Component({
  selector: 'app-onboarding-stepper',
  templateUrl: './onboarding-stepper.component.html',
  styleUrls: ['./onboarding-stepper.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OnboardingStepperComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── État du stepper ────────────────────────────────────────────────────────
  currentStep = 1;
  totalSteps = 4;
  isSubmitting = false;
  showPassword = false;

  // ── Formulaires par étape ──────────────────────────────────────────────────
  step1Form: UntypedFormGroup; // Bien
  step2Form: UntypedFormGroup; // Unités
  step3Form: UntypedFormGroup; // Locataires
  step4Form: UntypedFormGroup; // Compte

  // ── Données géographiques ──────────────────────────────────────────────────
  countries: any[] = [];
  cities: any[] = [];
  loadingCities = false;

  // ── Options ───────────────────────────────────────────────────────────────
  propertyTypes = [
    { value: 'APARTMENT', label: 'Appartement', icon: '🏢' },
    { value: 'HOUSE', label: 'Maison', icon: '🏠' },
    { value: 'COMMERCIAL', label: 'Local commercial', icon: '🏪' },
    { value: 'MIXED', label: 'Usage mixte', icon: '🏗️' },
  ];

  roomTypes = [
    { value: 'room', label: 'Chambre' },
    { value: 'studio', label: 'Studio' },
    { value: 'simple_apartment', label: 'Appartement simple' },
    { value: 'furnished_apartment', label: 'Appartement meublé' },
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private store: Store,
    private actions$: Actions,
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService,
    private languageUrlService: LanguageUrlService,
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadCountries();
    this.restoreFromStorage();
    this.listenToActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Construction des formulaires ───────────────────────────────────────────

  private buildForms(): void {
    this.step1Form = this.fb.group({
      propertyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      propertyCountryId: ['', Validators.required],
      propertyCityId: ['', Validators.required],
      propertyLocation: ['', [Validators.required, Validators.minLength(2)]],
      propertyType: ['APARTMENT'],
    });

    this.step2Form = this.fb.group({
      units: this.fb.array([this.createUnitGroup()]),
    });

    this.step3Form = this.fb.group({
      hasTenants: [false],
      tenants: this.fb.array([]),
    });

    this.step4Form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3}\s)?(\d{2,3}[\s.-]?){2,5}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      userType: ['PROPERTY_OWNER'],
      acceptTerms: [false, Validators.requiredTrue],
    });

    // Quand hasTenants change, ajouter/retirer le premier locataire
    this.step3Form.get('hasTenants')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((has: boolean) => {
        const arr = this.tenantsArray;
        if (has && arr.length === 0) {
          arr.push(this.createTenantGroup());
        } else if (!has) {
          while (arr.length > 0) arr.removeAt(0);
        }
      });
  }

  private createUnitGroup(): UntypedFormGroup {
    return this.fb.group({
      type: ['room', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      shouldPayCaution: [false],
      cautionPrice: [null],
    });
  }

  private createTenantGroup(): UntypedFormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3}\s)?(\d{2,3}[\s.-]?){2,5}$/)]],
      email: ['', Validators.email],
    });
  }

  // ── Getters FormArray ──────────────────────────────────────────────────────

  get unitsArray(): FormArray {
    return this.step2Form.get('units') as FormArray;
  }

  get tenantsArray(): FormArray {
    return this.step3Form.get('tenants') as FormArray;
  }

  // ── Gestion des unités ─────────────────────────────────────────────────────

  addUnit(): void {
    if (this.unitsArray.length < 5) {
      this.unitsArray.push(this.createUnitGroup());
    }
  }

  removeUnit(index: number): void {
    if (this.unitsArray.length > 1) {
      this.unitsArray.removeAt(index);
    }
  }

  // ── Gestion des locataires ─────────────────────────────────────────────────

  addTenant(): void {
    if (this.tenantsArray.length < 5) {
      this.tenantsArray.push(this.createTenantGroup());
    }
  }

  removeTenant(index: number): void {
    if (this.tenantsArray.length > 1) {
      this.tenantsArray.removeAt(index);
    }
  }

  // ── Géographie ────────────────────────────────────────────────────────────

  private loadCountries(): void {
    this.http
      .get<any>(`${environment.apiUrl}/localisation/country`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.countries = res.data || [];
        },
        error: () => {
          this.toastr.error('Impossible de charger les pays', 'Ndewa360°');
        },
      });
  }

  onCountryChange(countryId: string): void {
    if (!countryId) return;
    this.cities = [];
    this.step1Form.patchValue({ propertyCityId: '' });
    this.loadingCities = true;

    this.http
      .get<any>(`${environment.apiUrl}/localisation/city/country/${countryId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.cities = res.data || [];
          this.loadingCities = false;
        },
        error: () => {
          this.loadingCities = false;
          this.toastr.error('Impossible de charger les villes', 'Ndewa360°');
        },
      });
  }

  // ── Navigation entre étapes ────────────────────────────────────────────────

  nextStep(): void {
    if (this.currentStep === 1 && this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    if (this.currentStep === 2 && this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }
    if (this.currentStep === 3 && this.step3Form.invalid) {
      this.step3Form.markAllAsTouched();
      return;
    }
    this.saveToStorage();
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  skipStep(): void {
    this.saveToStorage();
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  // ── Persistance localStorage ───────────────────────────────────────────────

  private saveToStorage(): void {
    try {
      const data = {
        step: this.currentStep,
        step1: this.step1Form.value,
        step2: this.step2Form.value,
        step3: this.step3Form.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.step1) {
        this.step1Form.patchValue(data.step1);
        if (data.step1.propertyCountryId) {
          this.onCountryChange(data.step1.propertyCountryId);
        }
      }

      if (data.step2?.units?.length) {
        // Reconstruire le FormArray des unités
        while (this.unitsArray.length > 0) this.unitsArray.removeAt(0);
        data.step2.units.forEach((u: any) => {
          const g = this.createUnitGroup();
          g.patchValue(u);
          this.unitsArray.push(g);
        });
      }

      if (data.step3) {
        this.step3Form.patchValue({ hasTenants: data.step3.hasTenants });
        if (data.step3.hasTenants && data.step3.tenants?.length) {
          while (this.tenantsArray.length > 0) this.tenantsArray.removeAt(0);
          data.step3.tenants.forEach((t: any) => {
            const g = this.createTenantGroup();
            g.patchValue(t);
            this.tenantsArray.push(g);
          });
        }
      }
    } catch {}
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  // ── Soumission finale ──────────────────────────────────────────────────────

  onSubmit(): void {
    this.step4Form.markAllAsTouched();
    if (this.step4Form.invalid) return;

    this.isSubmitting = true;

    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const s3 = this.step3Form.value;
    const s4 = this.step4Form.value;

    // Construire le payload — propriété seulement si les champs requis sont remplis
    const hasProperty = s1.propertyName && s1.propertyCountryId && s1.propertyCityId && s1.propertyLocation;
    const hasUnits = hasProperty && s2.units?.some((u: any) => u.price > 0);
    const hasTenants = hasProperty && s3.hasTenants && s3.tenants?.length > 0;

    const payload: any = {
      email: s4.email.trim(),
      password: s4.password,
      name: s4.name.trim(),
      phoneNumber: s4.phoneNumber.trim(),
      userType: s4.userType || 'PROPERTY_OWNER',
      plan: 'free',
    };

    if (hasProperty) {
      payload.property = {
        name: s1.propertyName.trim(),
        geolocationCountry: s1.propertyCountryId,
        geolocationCity: s1.propertyCityId,
        location: s1.propertyLocation.trim(),
        propertyType: s1.propertyType || 'APARTMENT',
      };
    }

    if (hasUnits) {
      payload.units = s2.units
        .filter((u: any) => u.price > 0)
        .map((u: any) => ({
          type: u.type,
          price: Number(u.price),
          shouldPayCaution: u.shouldPayCaution || false,
          cautionPrice: u.shouldPayCaution ? Number(u.cautionPrice || 0) : 0,
        }));
    }

    if (hasTenants) {
      payload.tenants = s3.tenants
        .filter((t: any) => t.fullName && t.phoneNumber)
        .map((t: any) => ({
          fullName: t.fullName.trim(),
          phoneNumber: t.phoneNumber.trim(),
          email: t.email?.trim() || undefined,
        }));
    }

    this.store.dispatch(new UserProfileAction.SignupWithOnboarding(payload));
  }

  // ── Écoute des actions NGXS ────────────────────────────────────────────────

  private listenToActions(): void {
    this.actions$
      .pipe(ofActionSuccessful(UserProfileAction.SignupWithOnboarding), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isSubmitting = false;
        this.clearStorage();
        const lang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${lang}/app/properties/home`]);
      });

    this.actions$
      .pipe(ofActionErrored(UserProfileAction.SignupWithOnboarding), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isSubmitting = false;
      });

    this.actions$
      .pipe(ofActionCompleted(UserProfileAction.SignupWithOnboarding), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isSubmitting = false;
      });
  }

  // ── Helpers template ───────────────────────────────────────────────────────

  isStepValid(step: number): boolean {
    switch (step) {
      case 1: return this.step1Form.valid;
      case 2: return this.step2Form.valid;
      case 3: return this.step3Form.valid;
      case 4: return this.step4Form.valid;
      default: return false;
    }
  }

  isFieldInvalid(form: UntypedFormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  getStepLabel(step: number): string {
    const labels: Record<number, string> = {
      1: 'Votre bien',
      2: 'Vos unités',
      3: 'Vos locataires',
      4: 'Votre compte',
    };
    return labels[step] || '';
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}
