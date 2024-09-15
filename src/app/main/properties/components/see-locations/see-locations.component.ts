import { Component, Input, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TableHeaderItem, TableItem, TableModel, TableRowSize } from 'carbon-components-angular';
import { LocataireState, LocataireModel, PropertyState, LocationState, RoomState } from 'src/app/shared/store';

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

  showSelectionColumn = true
  enableSingleSelect = false
  striped = false
  sortable = true
  isDataGrid = false
  noData = false
  stickyHeader = false
  skeleton = false

  @ViewChild("totalHeaderTemplate", {static: true}) totalHeaderTemplate: TemplateRef<any>
  @ViewChild("actionTemplate", {static: true}) actionTemplate: TemplateRef<any>
  @ViewChild("propertyTemplate", {static: true}) propertyTemplate: TemplateRef<any>

  constructor(
    private _store:Store,
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
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
      this.model.data = value.map((locataire)=> {
        return ([
          new TableItem({data: locataire.fullName}),
          new TableItem({data: locataire.phoneNumber}),
          new TableItem({data: locataire.email}),
          new TableItem({data: locataire.room?locataire.room:""}),
          new TableItem({data: ""})
        ])
      });
      this.model.data.map(data => {      
        data[3] = new TableItem({
          data: data[3].data,
          template: this.propertyTemplate,
          className: "items-center"
        })
     
        data[4] = new TableItem({
          data: data[4].data,
          template: this.actionTemplate,
          className: "items-center"
        })
        return data
      })
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

  simpleSort(index: number) {
    sort(this.model, index)
  }
  
}
