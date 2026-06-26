import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PropertyModel } from 'src/app/shared/store';
import { TranslateService } from '@ngx-translate/core';

export interface FilterOptions {
  startYear: number;
  endYear: number;
  selectedProperties: string[];
  dataTypes: string[];
  comparisonMode: boolean;
}

@Component({
  selector: 'advanced-filters',
  templateUrl: './advanced-filters.component.html',
  styleUrls: ['./advanced-filters.component.css']
})
export class AdvancedFiltersComponent implements OnInit, OnChanges {
  @Input() properties: PropertyModel[] = [];
  @Input() currentFilters: FilterOptions = {
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    selectedProperties: [],
    dataTypes: ['revenue', 'occupancy'],
    comparisonMode: false
  };

  @Output() filtersChanged = new EventEmitter<FilterOptions>();
  @Output() resetFilters = new EventEmitter<void>();

  filterForm: FormGroup;
  isExpanded: boolean = false;

  availableYears: number[] = [];
  dataTypeOptions: Array<{value: string, label: string, icon: string}> = [];

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.initializeYears();
    this.initializeDataTypeOptions();
    this.createForm();
  }

  ngOnInit(): void {
    this.updateFormValues();
  }

  // Synchroniser le formulaire quand les filtres entrants changent
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFilters'] && !changes['currentFilters'].firstChange && this.filterForm) {
      this.updateFormValues();
    }
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  private initializeDataTypeOptions(): void {
    this.dataTypeOptions = [
      { value: 'revenue', label: this.translate.instant('FILTERS.REVENUE'), icon: 'currency--dollar' },
      { value: 'occupancy', label: this.translate.instant('FILTERS.OCCUPANCY'), icon: 'home' },
      { value: 'payments', label: this.translate.instant('FILTERS.PAYMENTS'), icon: 'receipt' },
      { value: 'arrears', label: this.translate.instant('FILTERS.ARREARS'), icon: 'warning' }
    ];
  }

  private createForm(): void {
    this.filterForm = this.fb.group({
      startYear: [this.currentFilters.startYear],
      endYear: [this.currentFilters.endYear],
      selectedProperties: [this.currentFilters.selectedProperties],
      dataTypes: [this.currentFilters.dataTypes],
      comparisonMode: [this.currentFilters.comparisonMode]
    });

    // Émettre uniquement quand l'utilisateur change un champ — pas lors des patchValue internes
    this.filterForm.valueChanges.subscribe(value => {
      if (this.filterForm.dirty) {
        this.filtersChanged.emit(value as FilterOptions);
      }
    });
  }

  private updateFormValues(): void {
    this.filterForm.patchValue(this.currentFilters, { emitEvent: false });
    this.filterForm.markAsPristine();
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  onFiltersChange(filters: FilterOptions): void {
    this.filtersChanged.emit(filters);
  }

  onResetFilters(): void {
    const defaultFilters: FilterOptions = {
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      selectedProperties: [],
      dataTypes: ['revenue', 'occupancy'],
      comparisonMode: false
    };
    this.filterForm.patchValue(defaultFilters, { emitEvent: false });
    this.filterForm.markAsPristine();
    this.resetFilters.emit();
    this.filtersChanged.emit(defaultFilters);
  }

  isPropertySelected(propertyId: string): boolean {
    return (this.filterForm.get('selectedProperties')?.value || []).includes(propertyId);
  }

  toggleProperty(propertyId: string): void {
    const currentProperties: string[] = [...(this.filterForm.get('selectedProperties')?.value || [])];
    const index = currentProperties.indexOf(propertyId);
    if (index > -1) {
      currentProperties.splice(index, 1);
    } else {
      currentProperties.push(propertyId);
    }
    this.filterForm.patchValue({ selectedProperties: currentProperties });
    this.filterForm.markAsDirty();
    this.filtersChanged.emit(this.filterForm.value as FilterOptions);
  }

  isDataTypeSelected(dataType: string): boolean {
    return (this.filterForm.get('dataTypes')?.value || []).includes(dataType);
  }

  toggleDataType(dataType: string): void {
    const currentDataTypes: string[] = [...(this.filterForm.get('dataTypes')?.value || [])];
    const index = currentDataTypes.indexOf(dataType);
    if (index > -1) {
      currentDataTypes.splice(index, 1);
    } else {
      currentDataTypes.push(dataType);
    }
    this.filterForm.patchValue({ dataTypes: currentDataTypes });
    this.filterForm.markAsDirty();
    this.filtersChanged.emit(this.filterForm.value as FilterOptions);
  }
}
