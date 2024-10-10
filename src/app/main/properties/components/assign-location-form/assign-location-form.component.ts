import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { isFormItemValid } from 'src/@youpez';
import { LocataireModel, LocataireState, RoomModel, RoomState } from 'src/app/shared/store';

@Component({
  selector: 'assign-location-form',
  templateUrl: './assign-location-form.component.html',
  styleUrls: ['./assign-location-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AssignLocationFormComponent  implements OnInit, OnChanges{
  public formGroup = null;

  @Input() propertyID:string=null;

  roomList = [];
  locataireList = [];
  @Output() onSendLocationData:EventEmitter<
    {
      locataire?: any,
      room?: any,
      entryDate?:Date
    }> = new EventEmitter();

  
  constructor(
    private formBuilder:FormBuilder,
    private _store:Store
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
    this.askForUpdate()

  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["propertyID"] && changes["propertyID"].currentValue != null) this.askForUpdate()
  }

  askForUpdate()
  {
    console.log("askToUpdate ",this.propertyID)
    if(!this.propertyID) return;
    this._store.select(RoomState.selectStateFreeRoomByPropertyId(this.propertyID)).subscribe((roomList:RoomModel[])=>{
      this.roomList = roomList.map((value)=>({content:value.code,valueType:value._id}));
    });

    this._store.select(LocataireState.selectStateFreeLocataireByPropertyId(this.propertyID)).subscribe((locataireList:LocataireModel[])=>{
      this.locataireList = locataireList.map((value)=>({content:value.fullName,valueType:value._id}));
    });
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
