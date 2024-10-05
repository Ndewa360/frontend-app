import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { TableModel, TableRowSize, TableHeaderItem, TableItem } from 'carbon-components-angular';
import { sort } from 'src/@youpez';
import { RoomState, LocataireState } from 'src/app/shared/store';
import { LocationPaymentModel, LocationPaymentState, LocationPaymentType } from 'src/app/shared/store/payment-location';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'payment-list-type-property',
  templateUrl: './payment-list-type-property.component.html',
  styleUrls: ['./payment-list-type-property.component.css']
})
export class PaymentListTypePropertyComponent implements OnChanges, OnInit{  
  @Input() propertyID:string;
  title="Caution retenu remboursable";

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
  @ViewChild("datePaymentTemplate", {static: true}) datePaymentTemplate: TemplateRef<any>

  constructor(private _store:Store){}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['propertyID']) {
      console.log("PropertyID",changes["propertyID"].currentValue)
      this._store.select(LocationPaymentState.selectStateLocationPaymentByPropertyIdAndPaymentType(changes['propertyID'].currentValue,LocationPaymentType.CAUTION))
      .subscribe((value)=>this.model=this.updateData(value))
    }
  }
  getHeader()
  {
    return [
      new TableHeaderItem({
        data: "Locataire",
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: "Chambre/Studio/Appart",
        className: "items-center"
      }),
      new TableHeaderItem({
        data: "Date de paiement",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Montant",
        className: "items-center",
      })
    ]   
  }
 
  updateData(data:LocationPaymentModel[])
  {
    console.log("Data Location", data)
    let model = new TableModel();
    model.header = this.getHeader();
    model.data = data.map((payment)=> {
      return ([
        new TableItem({
          data: payment.locataire,
          template: this.locataireTemplate,
          className: "items-center"
        }),
        new TableItem({
          data: payment.room,
          template: this.roomTemplate,
          className: "items-center"
        }),
        new TableItem({
          data: payment.datePayment,
          template: this.datePaymentTemplate,
          className: "items-center"            
        }),
        new TableItem({
          data: `${payment.locationPaymentPrice} ${UtilsString.getDefaultCurrency()}`,
          className: "items-center"
        })
      ])
    });
    return model
  }

  onRowClick(index: number) {}

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


  simpleSort(index: number) {
    sort(this.model, index)
  }

}
