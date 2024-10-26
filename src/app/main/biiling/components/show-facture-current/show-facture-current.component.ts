import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Select, Selector, Store } from '@ngxs/store';
import { TableModel, TableRowSize, TableHeaderItem, TableItem } from 'carbon-components-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { sort } from 'src/@youpez';
import { SouscriptionState, SouscriptionModel, SouscriptionPeriodModel, SouscriptionPeriodState, RoomState, RoomModel, LocataireState, PropertyState, RoomAction } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'show-facture-current',
  templateUrl: './show-facture-current.component.html',
  styleUrls: ['./show-facture-current.component.css']
})
export class ShowFactureCurrentComponent {
  @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>
  @Select(RoomState.selectStateCountRoomActive) roomCount$:Observable<number>
  @Select(RoomState.selectStatePriceRoomActive) roomPrice$:Observable<number>
  @Select(RoomState.setlectStateRooms) roomList$:Observable<RoomModel[]>;
  roomsValueChangeStatus:{isLoading:BehaviorSubject<boolean>,roomId:string, value:BehaviorSubject<boolean>,room:RoomModel}[]=[];

  currentPeriod:SouscriptionPeriodModel=null;
  waittingResponse=false;
  isAssignedOpened = false;
  propertyId = null;
  public leftSidebarVisibility: boolean = true
  
  public property= null;
  public model = new TableModel();
  
  public searchModel
  public size:TableRowSize = 'md'
  public offset = {x: -9, y: 0}
  public batchText = ''

  showSelectionColumn = true
  enableSingleSelect = false
  striped = false
  sortable = true
  isDataGrid = false
  noData = false
  stickyHeader = false
  skeleton = false

  @ViewChild("roomTemplate", {static: true}) roomTemplate: TemplateRef<any>
  @ViewChild("actionTemplate", {static: true}) actionTemplate: TemplateRef<any>
  @ViewChild("propertyTemplate", {static: true}) propertyTemplate: TemplateRef<any>

  constructor(
    private _store:Store,
    private _ngxsAction:Actions,
    private cdr: ChangeDetectorRef
  ){}
  ngOnInit() {
    this._ngxsAction.pipe(ofActionSuccessful(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe((value)=>{
      // Navigate to the parent
      let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.roomId);
      foundRoom.value.next(value.isActiveForSouscription);      
      this.cdr.detectChanges()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe(
      (value) => {
        // this.waittingResponse=false;
        let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.action.roomId);
        foundRoom.isLoading.next(false);
      this.cdr.detectChanges()

      }
    )

    this._ngxsAction.pipe(ofActionErrored(RoomAction.ChangeStatusActivatedForSouscriptionRoom)).subscribe(
      (value) => {
        let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==value.roomId);
        foundRoom.value.next(value.isActiveForSouscription);     
      this.cdr.detectChanges()

      })  

    this.souscription$.subscribe((value)=>{
      if(!value) return;
      this._store.select(SouscriptionPeriodState.selectStateSouscriptionPeriod(value.currentPeriod)).subscribe((value)=>{
        if(!value) return;
        this.currentPeriod=value;
      })
    })

    this.roomList$.subscribe((roomList)=>{
      let newModel = new TableModel()
      
      newModel.header = [
        new TableHeaderItem({
          data: "Code",
          className: "items-center font-bold"
        }),
        new TableHeaderItem({
          data: "Bien",
          className: "items-center"
        }),
        new TableHeaderItem({
          data: "Etat",
          className: "items-center",
        }),
      ]

      newModel.data = roomList.map((room)=> {
        let dataForLoading = {
          roomId:room._id,
          room,
          isLoading: new BehaviorSubject(false),
          value:new BehaviorSubject(room.isActiveForSouscription)
        }
        this.roomsValueChangeStatus.push(dataForLoading);
        return ([
          new TableItem({
            data: room,
            template: this.roomTemplate,
            className: "items-center"
          }),
          new TableItem({
            data: room.property,
            template: this.propertyTemplate,
            className: "items-center"
          }),
          new TableItem({
            data: dataForLoading,
            template: this.actionTemplate,
            className: "items-center"
          })
        ])
      });
      this.model = newModel;
    })

  }



  onRowClick(index: number) {
  }

  getLocataireById(locataireid)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireid))
  }

  getPropertyById(propertyID)
  {
    return this._store.select(PropertyState.selectStateProperty(propertyID))
  }

  onClose(event) {
    this.isAssignedOpened = false
  }

  onToggleLeftSidebar() {
    this.leftSidebarVisibility = !this.leftSidebarVisibility
  }

  shouldOpenAssignedOpened() {
    this.isAssignedOpened = true;
  }


  changeStatusRoom(event,roomId)
  {
    let foundRoom = this.roomsValueChangeStatus.find((u)=>u.roomId==roomId);
    foundRoom.isLoading.next(true)
    this._store.dispatch(new RoomAction.ChangeStatusActivatedForSouscriptionRoom(roomId,event))

  }
  changeSouscriptionOfRoom(roomId,status)
  {
    this.waittingResponse=true;
    this._store.dispatch(new RoomAction.ChangeStatusActivatedForSouscriptionRoom(roomId,status))
  }

  simpleSort(index: number) {
    sort(this.model, index)
  }

  getDefaultCurrency()
  {
    return UtilsString.getDefaultCurrency()
  }
}
