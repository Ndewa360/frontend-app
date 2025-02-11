import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngxs/store';
import { TableModel, TableRowSize, TableHeaderItem, TableItem } from 'carbon-components-angular';
import { sort } from 'src/@youpez';
import { LocationPaymentState, LocationPaymentType, LocationPaymentModel, RoomState, LocataireState, StatisticState, StatisticAllPaymentLocataireYearModel, StatisticPaymentStateType } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'payment-list-recap-total',
  templateUrl: './payment-list-recap-total.component.html',
  styleUrls: ['./payment-list-recap-total.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class PaymentListRecapTotalComponent implements OnChanges, OnInit{
  @Input() propertyID:string;
  @Input() selectedYear
  title=`Montant percus année ${new Date().getFullYear()}`;

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

  @ViewChild("payementSumTemplate", {static: true}) payementSumTemplate: TemplateRef<any>
  @ViewChild("locataireTemplate", {static: true}) locataireTemplate: TemplateRef<any>

  constructor(private _store:Store){}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['propertyID'] || changes["selectedYear"]) {
      this.title=`Montant percus année ${this.selectedYear}`;
      this._store.select(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyID,this.selectedYear))
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
      ...UtilsString.getListOfMonth().map((month)=> {
        return new TableHeaderItem({
          data: `${month} (FCFA)`,
          className: "items-center"
        })
      }),      
      new TableHeaderItem({
        data: "Total (FCFA)",
        className: "items-center",
      })
    ]   
  }
 
  updateData(data:StatisticAllPaymentLocataireYearModel[])
  {
    let model = new TableModel();
    let allSum = 0;

    model.header = this.getHeader();
    model.data = [
      ...data.map((payment)=> {
        return ([
          new TableItem({
            data: payment.locataire,
            template: this.locataireTemplate,
            className: "items-center"
          }),
          ...payment.paymentState.map((pay)=>new TableItem({
            data: {
              data: `${pay.state==StatisticPaymentStateType.PAYED?pay.unitLocationPaymentPrice:0}`,
              isSum: false
            },
            template:this.payementSumTemplate,
            className: "items-center"
          })),
          new TableItem({
            data: {
              data:payment.paymentState.map(pay=>pay.state==StatisticPaymentStateType.PAYED?pay.unitLocationPaymentPrice:0).reduce((acc,curr)=>acc+curr,0),
              isSum:true},
            className: "items-center",
            template:this.payementSumTemplate,
          })
        ])
      }),
      [
        new TableItem({
        data: "Total",
        className: "items-center"
        }),
        ...Array(12).fill(null).map((_, month)=>{
          let sumPaymentByMonth = data.map((pay)=>pay.paymentState[month].state==StatisticPaymentStateType.PAYED?pay.paymentState[month].unitLocationPaymentPrice:0).reduce((acc, curr)=>acc+curr, 0)
          allSum+=sumPaymentByMonth;
          return new TableItem({
            data:  {
              data: sumPaymentByMonth,
              isSum: true
            },
            className: "bg-lime-400 ",
            template:this.payementSumTemplate,
          })
        }),
        new TableItem({
          data: {data:allSum,isSum:true},
          template:this.payementSumTemplate,
          className: "items-center"
        })
      ]
    ];

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

  simpleSort(index: number) {
    sort(this.model, index)
  }
}
