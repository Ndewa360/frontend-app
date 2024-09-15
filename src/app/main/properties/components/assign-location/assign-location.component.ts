import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { LocataireModel, LocataireState, PropertyModel, RoomModel, RoomState } from 'src/app/shared/store';

@Component({
  selector: 'assign-location',
  templateUrl: './assign-location.component.html',
  styleUrls: ['./assign-location.component.css']
})
export class AssignLocationComponent implements OnChanges {
  public selectedItem = {
    name: 'import-restrictions.yaml',
    accessed: '5 mins ago',
    size: '0.1GB',
  }

  @Input() isAssignedOpened: boolean = false
  @Input() property: PropertyModel = null;
  public leftSidebarVisibility: boolean = true
  public formGroup = null;
  roomList =[];
  locataireList = [];

  constructor(
    private formBuilder:FormBuilder,
    private _store: Store,
  ){}
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["property"] && changes["property"].currentValue != null)
    {
      this._store.select(RoomState.selectStateFreeRoomByPropertyId(this.property._id)).subscribe((roomList:RoomModel[])=>{
        this.roomList = roomList.map((value)=>({content:value.code,valueType:value._id}));
      });

      this._store.select(LocataireState.selectStateFreeLocataireByPropertyId(this.property._id)).subscribe((locataireList:LocataireModel[])=>{
        this.locataireList = locataireList.map((value)=>({content:value.fullName,valueType:value._id}));
      });
    }
  }

  ngOnInit()
  {    

    this.formGroup = this.formBuilder.group({
      roomId: [null, [Validators.required]],
      locataireId: [null, [Validators.required]],
      startedDate: [null, [Validators.required]],
    })
  }

  onSubmit()
  {

  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onClose(event) {
    this.isAssignedOpened = false
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }
}
