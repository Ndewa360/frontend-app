import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { CityState } from '../../../../../shared/store';

@Component({
  selector: 'app-mobile-property-form',
  templateUrl: './mobile-property-form.component.html',
  styleUrls: ['./mobile-property-form.component.scss']
})
export class MobilePropertyFormComponent implements OnInit {
  @Input() property: any;
  @Output() propertyChange = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  propertyForm!: FormGroup;
  isLoading = false;
  cities$ = this.store.select(CityState.selectStateCities);

  constructor(
    private fb: FormBuilder,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.propertyForm = this.fb.group({
      name: [this.property?.name || '', [Validators.required]],
      description: [this.property?.description || ''],
      address: [this.property?.address || '', [Validators.required]],
      cityId: [this.property?.geolocationCity?._id || '', [Validators.required]],
      numberOfRooms: [this.property?.numberOfRooms || 0],
      type: [this.property?.type || '']
    });
  }

  onSubmit(): void {
    if (this.propertyForm.valid) {
      this.isLoading = true;
      const formData = this.propertyForm.value;

      // TODO: Implémenter la sauvegarde
      setTimeout(() => {
        this.propertyChange.emit(formData);
        this.isLoading = false;
      }, 1000);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
