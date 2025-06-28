import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PropertyModel } from 'src/app/shared/store';

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
export class AdvancedFiltersComponent implements OnInit {
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
  dataTypeOptions = [
    { value: 'revenue', label: 'Revenus', icon: 'currency--dollar' },
    { value: 'occupancy', label: 'Taux d\'occupation', icon: 'home' },
    { value: 'payments', label: 'Paiements', icon: 'receipt' },
    { value: 'arrears', label: 'Arriérés', icon: 'warning' }
  ];

  constructor(private fb: FormBuilder) {
    this.initializeYears();
    this.createForm();
  }

  ngOnInit(): void {
    this.updateFormValues();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  private createForm(): void {
    this.filterForm = this.fb.group({
      startYear: [this.currentFilters.startYear],
      endYear: [this.currentFilters.endYear],
      selectedProperties: [this.currentFilters.selectedProperties],
      dataTypes: [this.currentFilters.dataTypes],
      comparisonMode: [this.currentFilters.comparisonMode]
    });

    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(value => {
      this.onFiltersChange(value);
    });
  }

  private updateFormValues(): void {
    this.filterForm.patchValue(this.currentFilters, { emitEvent: false });
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
    
    this.filterForm.patchValue(defaultFilters);
    this.resetFilters.emit();
  }

  isPropertySelected(propertyId: string): boolean {
    return this.currentFilters.selectedProperties.includes(propertyId);
  }

  toggleProperty(propertyId: string): void {
    const currentProperties = this.filterForm.get('selectedProperties')?.value || [];
    const index = currentProperties.indexOf(propertyId);
    
    if (index > -1) {
      currentProperties.splice(index, 1);
    } else {
      currentProperties.push(propertyId);
    }
    
    this.filterForm.patchValue({ selectedProperties: currentProperties });
  }

  isDataTypeSelected(dataType: string): boolean {
    return this.currentFilters.dataTypes.includes(dataType);
  }

  toggleDataType(dataType: string): void {
    const currentDataTypes = this.filterForm.get('dataTypes')?.value || [];
    const index = currentDataTypes.indexOf(dataType);
    
    if (index > -1) {
      currentDataTypes.splice(index, 1);
    } else {
      currentDataTypes.push(dataType);
    }
    
    this.filterForm.patchValue({ dataTypes: currentDataTypes });
  }
}
