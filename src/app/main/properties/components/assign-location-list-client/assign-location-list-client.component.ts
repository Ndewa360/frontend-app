import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { TableModel, TableRowSize, TableHeaderItem } from 'carbon-components-angular';
import { sort } from 'src/@youpez/helpers';
@Component({
  selector: 'assign-location-list-client',
  templateUrl: './assign-location-list-client.component.html',
  styleUrls: ['./assign-location-list-client.component.css']
})
export class AssignLocationListClientComponent {
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
  ){}
  ngOnInit() {


    this.model.header = [
      new TableHeaderItem({
        data: "Mois",
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: "Année",
        className: "items-center"
      }),
      new TableHeaderItem({
        data: "Payer le",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Etat",
        className: "items-center",
      })
    ]

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
  // getRoomById(roomId)
  // {
  //   return this._store.select(RoomState.selectStateRoom(roomId))
  // }

  simpleSort(index: number) {
    sort(this.model, index)
  }
  
}
