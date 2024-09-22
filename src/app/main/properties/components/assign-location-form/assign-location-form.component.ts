import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { isFormItemValid } from 'src/@youpez';
import { LocataireModel, RoomModel } from 'src/app/shared/store';

@Component({
  selector: 'assign-location-form',
  templateUrl: './assign-location-form.component.html',
  styleUrls: ['./assign-location-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AssignLocationFormComponent  implements OnInit{
  public formGroup = null;

  @Input() roomList = [];
  @Input() locataireList = [];
  @Output() onSendLocationData:EventEmitter<
    {
      locataire?: any,
      room?: any,
      entryDate?:Date
    }> = new EventEmitter();

  
  constructor(
    private formBuilder:FormBuilder,
  ){}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      roomId: [null, [Validators.required]],
      locataireId: [null, [Validators.required]],
      startedDate: [null, [Validators.required]],
    })
    this.formGroup.valueChanges.subscribe(() => {
      this.isFormValid();
    })
  }

  onSubmit()
  {

  }

  submit() {
    this.formGroup.markAllAsTouched()
  }

  reset() {
    this.formGroup.reset()
  }

  isValid(name) {
    return isFormItemValid(this.formGroup, name)
  }

  isFormValid() {
    if (!this.formGroup.valid) {
      return false
    }
    this.onSendLocationData.emit({
      locataire:this.formGroup.value.locataireId.valueType, 
      room:this.formGroup.value.roomId.valueType,
      entryDate:this.formGroup.value.startedDate[0]
    })
    return true
  }

}
