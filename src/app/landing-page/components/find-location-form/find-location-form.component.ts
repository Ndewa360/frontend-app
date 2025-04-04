import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';

@Component({
  selector: 'find-location-form',
  templateUrl: './find-location-form.component.html',
  styleUrls: ['./find-location-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FindLocationFormComponent implements OnInit {
    public formGroup: UntypedFormGroup
  
   constructor(protected formBuilder: UntypedFormBuilder){} 
   
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
          location: [''],
          propertyType: [''],
          price: [''],
        })
  }
  
  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
  }

}
