import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { isFormItemValid } from 'src/@youpez';
import { LocataireModel, LocataireState, RoomModel, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'assign-location-form',
  templateUrl: './assign-location-form.component.html',
  styleUrls: ['./assign-location-form.component.css'],
  encapsulation: ViewEncapsulation.None,

})
export class AssignLocationFormComponent  implements OnInit, OnChanges{
  public formGroup = null;

  @Input() propertyID:string=null;

  roomList = [];
  locataireList = [];
  fiancialStateList = [
    {
      content:"Initial",
      valueType:"initial",
      selected:true
    },
    {
      content:"En avance",
      valueType:"en_avance",
      selected:false
    },
    {
      content:"Avec Arriéré",
      valueType:"avec_arriere",
      selected:false
    },
  ]
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
    console.log("On NgOnInit AssignLocation Form")

    this.formGroup = this.formBuilder.group({
      roomId: [null, [Validators.required]],
      locataireId: [null, [Validators.required]],
      startedDate: [null],
      isKnowExactDateEntry:[false],
      initialFinancialState:[this.fiancialStateList[0], [Validators.required]],
      initialSolde:[0]
    })
    this.formGroup.valueChanges.subscribe(() => {      
      this.isFormValid();
    })
    this.formGroup.controls["initialSolde"].disable()

    this.formGroup.controls["isKnowExactDateEntry"].valueChanges.subscribe((value)=>{
      if(value) {
        this.formGroup.controls["startedDate"].enable()
        this.formGroup.controls["startedDate"].setValidators([Validators.required])
      }
      else {
        this.formGroup.controls["startedDate"].disable()
        this.formGroup.controls["startedDate"].clearValidators()
      }
      this.formGroup.controls["startedDate"].updateValueAndValidity()
    })

    this.formGroup.controls["initialFinancialState"].valueChanges.subscribe((value)=>{
      if(value==null) return
      if(value.valueType == "initial") {
        this.formGroup.controls["initialSolde"].clearValidators()
        this.formGroup.controls["initialSolde"].disable()
      }
      else {
        this.formGroup.controls["initialSolde"].setValidators([Validators.required])
        this.formGroup.controls["initialSolde"].enable()
      }
      this.formGroup.controls["initialSolde"].updateValueAndValidity()

    })

  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["propertyID"] && changes["propertyID"].currentValue != null) this.askForUpdate()
  }

  askForUpdate()
  {
    if(!this.propertyID) return;
    this._store.select(RoomState.selectStateFreeRoomByPropertyId(this.propertyID)).subscribe((roomList:RoomModel[])=>{
      this.roomList = roomList.map((value)=>({content:value.code,valueType:value._id,selected:false}));
    });

    this._store.select(LocataireState.selectStateFreeLocataireByPropertyId(this.propertyID)).subscribe((locataireList:LocataireModel[])=>{
      this.locataireList = locataireList.map((value)=>({content:value.fullName,valueType:value._id,selected:false}));
    });
  }

  refreshComponent(){
    // window.location.reload()
    this.roomList = []
    this.locataireList = [];
    this.ngOnInit();
    this.askForUpdate();
    // console.log("Property ID ",this.propertyID)
    
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
    let dataToEmit = {
      locataire:this.formGroup.value.locataireId.valueType, 
      room:this.formGroup.value.roomId.valueType,
      isKnowExactDateEntry: this.formGroup.value.isKnowExactDateEntry,
      initialFinancialState: this.formGroup.value.initialFinancialState.valueType,
      initialSolde: this.formGroup.value.initialSolde
    }
    if(this.formGroup.value.isKnowExactDateEntry) {
      if(this.formGroup.value.startedDate == null) return false;
      dataToEmit["entryDate"]=this.formGroup.value.startedDate[0];
    }
    

    this.onSendLocationData.emit(dataToEmit)
    return true
  }

  getMoney()
  {
    return UtilsString.getDefaultCurrency()
  }

}
