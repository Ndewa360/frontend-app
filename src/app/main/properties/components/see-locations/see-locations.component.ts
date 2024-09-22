import { Component, Input, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TableHeaderItem, TableItem, TableModel, TableRowSize } from 'carbon-components-angular';
import { LocataireState, LocataireModel, PropertyState, LocationState, RoomState } from 'src/app/shared/store';
import { RemoveLocataireRoomComponent } from '../remove-locataire-room/remove-locataire-room.component';
import { MatDialog } from '@angular/material/dialog';

function sort(model, index: number) {
  if (model.header[index].sorted) {
    // if already sorted flip sorting direction
    model.header[index].ascending = model.header[index].descending
  }
  model.sort(index)
}

@Component({
  selector: 'see-locations',
  templateUrl: './see-locations.component.html',
  styleUrls: ['./see-locations.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class SeeLocationsComponent {
  isAssignedOpened = false;
  propertyId = null;
  public leftSidebarVisibility: boolean = true
  
  public property= null;
  public model = new TableModel();
  
  public searchModel
  public size:TableRowSize = 'md'
  public offset = {x: -9, y: 0}
  public batchText = ''

  showSelectionColumn = false
  enableSingleSelect = false
  striped = false
  sortable = true
  isDataGrid = false
  noData = false
  stickyHeader = false
  skeleton = false

  @ViewChild("totalHeaderTemplate", {static: true}) totalHeaderTemplate: TemplateRef<any>
  @ViewChild("actionTemplate", {static: true}) actionTemplate: TemplateRef<any>
  @ViewChild("locataireTemplate", {static: true}) locataireTemplate: TemplateRef<any>
  @ViewChild("roomTemplate", {static: true}) roomTemplate: TemplateRef<any>
  @ViewChild("dateEntryTemplate", {static: true}) dateEntryTemplate: TemplateRef<any>
  
  constructor(
    private _store:Store,
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private dialog: MatDialog,
  ){}
  ngOnInit() {
    let propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!propertyId)  {
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }

    this.model.header = [
      new TableHeaderItem({
        data: "Locataire",
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: "Chambre/Studio/Appart",
        className: "items-center"
      }),
      new TableHeaderItem({
        data: "Date d'entrée",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Etat de paiement",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Actions",
        className: "items-center",
      })
    ]

    this._store.select(PropertyState.selectStateProperty(propertyId)).subscribe((value)=>{
      this.property = value;
    })
    this._store.select(LocationState.selectStateLocationByPropertyId(propertyId)).subscribe((value)=>{
      this.model.data = value.map((location)=> {
        return ([
          new TableItem({
            data: location.locataire,
            template: this.locataireTemplate,
            className: "items-center"
          }),
          new TableItem({
            data: location.room,
            template: this.roomTemplate,
            className: "items-center"
          }),
          new TableItem({
            data: location.startedAt,
            template: this.dateEntryTemplate,
            className: "items-center"            
          }),
          new TableItem({data: ""}),
          new TableItem({
            data: {location},
            template: this.actionTemplate,
            className: "items-center"
          })
        ])
      });
    })    
  }

  onRowClick(index: number) {

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
  getRoomById(roomId)
  {
    return this._store.select(RoomState.selectStateRoom(roomId))
  }

  getLocataireById(locataireid)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireid))
  }

  removeAssignLocationRoom(location)
  {
    this.dialog.open(RemoveLocataireRoomComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data:{
        location:location
      }
    })
  }

  simpleSort(index: number) {
    sort(this.model, index)
  }
  
}
