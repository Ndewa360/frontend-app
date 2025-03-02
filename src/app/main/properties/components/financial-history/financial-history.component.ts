import {Component, OnInit, ViewChild} from '@angular/core'
import {ColDef, GridOptions } from "@ag-grid-community/core"
import {InfiniteRowModelModule} from "@ag-grid-community/infinite-row-model"
import {ClientSideRowModelModule} from "@ag-grid-community/client-side-row-model"
import {HttpClient} from "@angular/common/http"
import { AgGridAngular } from '@ag-grid-community/angular'
import { ActivatedRoute, Router } from '@angular/router'
import { Select, Store } from '@ngxs/store'
import { HistoryLocationPaymentState } from 'src/app/shared/store/history-payment-location'
import { BehaviorSubject, combineLatest, Observable } from 'rxjs'
import { CurrencyPipe } from '@angular/common'
import { Currency } from 'src/app/shared/store'
import * as moment from 'moment';
import { CustomHistoryFinanceCellActionComponent } from '../custom-history-finance-cell-action/custom-history-finance-cell-action.component'

const locataireCellRenderer = (params) => {
  const {value} = params
  return `
    <div class="app-row app-row--center overflow-hidden">
      <div class="app-symbol app-symbol--default mr-2 rounded">
        
      </div>
      <div>
        <div class="app-expressive-heading-01">${value}</div>
      </div>
    </div>
  `
}


@Component({
  selector: 'app-financial-history',
  templateUrl: './financial-history.component.html',
  styleUrls: ['./financial-history.component.scss'],

})
export class FinancialHistoryComponent implements OnInit {

  @ViewChild('agGrid') agGrid!: AgGridAngular;
  @Select(HistoryLocationPaymentState.selectStateLoading) historyLocationPaymentLoading$!: Observable<boolean>;
  propertyId=null;
  columnDefs:Array<ColDef>=[]
  dataFound = []
  hasData:boolean=false
  public gridOptions: GridOptions = {}
  public loading: boolean = true
  public loadingProcess:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public defaultColDef = {}
  public modules = [InfiniteRowModelModule, ClientSideRowModelModule]

  constructor(
      private _activatedRoute: ActivatedRoute,
      private _router:Router,
      private _store:Store,
      private http: HttpClient,
      private currencyPipe:CurrencyPipe
    
    ) {
  }

  ngOnInit(): void {
    this.propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!this.propertyId)  {
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }
    this.createTable()

    this._store.select(HistoryLocationPaymentState.selectStateHistoryLocationPaymentByPropertyId(this.propertyId)).subscribe((value)=>{
      if(value.length>0) this.updateTableData(value)
    })
    combineLatest(this._store.select(HistoryLocationPaymentState.selectStateLoading),this.loadingProcess) .subscribe(([loadingHisto,loadingProcess])=>{
      this.loading = loadingHisto && loadingProcess;
    })
  }

  createTable() {
    this.columnDefs= [
      {
        headerName: 'Locataire',
        field: 'locataire',
        cellClass: 'cell-flex-middle overflow-hidden',
        cellRenderer: locataireCellRenderer,
        width: 350,
        pinned: true,
        filter: 'agTextColumnFilter'
      },
      {
        headerName: 'Bien',
        field: 'bien',
        headerClass: 'cell-flex-right',
        cellClass: 'cell-flex-middle cell-flex-right',
        filter: false,
      },
      {
        headerName: 'Chambre',
        field: 'chambre',
        headerClass: 'cell-flex-right',
        cellClass: 'cell-flex-middle cell-flex-right',
        filter: 'agTextColumnFilter'
      },
      {
        headerName: 'Date de paiement',
        field: 'date_paiement',
        headerClass: 'cell-flex-right',
        cellClass: 'cell-flex-middle cell-flex-right',
        filter: 'agDateColumnFilter'
      },
      {
        headerName: 'Montant',
        field: 'price',
        headerClass: 'cell-flex-right',
        cellClass: 'cell-flex-middle cell-flex-right font-bold',
        filter: 'agNumberColumnFilter'
      },
      {
        headerName: 'Action',
        field: 'action',
        headerClass: 'cell-flex-right',
        cellClass: 'cell-flex-middle cell-flex-right font-bold',
        cellRenderer: CustomHistoryFinanceCellActionComponent, // Utilisation du composant personnalisé
        cellRendererParams: {
          // onEdit: this.onEdit.bind(this),
          // onDelete: this.onDelete.bind(this)
        },
        filter: false,
      },
    ]
  }

  updateTableData(data)
  {
    console.log("Update ",data)
    this.hasData=true
    let rowData = data.map((item)=> item.transactions.map((transaction)=>({
      locataire:item.locataire.fullName,
      bien:item.property.name,
      chambre:this.getRoomString(item.room),
      date_paiement:moment(transaction.datePayment).format('LL') ,
      price:this.currencyPipe.transform(transaction.locationPaymentPrice,Currency.XAF,'symbol', '1.0-0'),
      date:transaction.datePayment,
      history:item,
      transaction
      
    }))).reduce((acc,curr)=>[...acc,...curr],[])

    rowData.sort((a,b)=>a.date<b.date);
    
    this.gridOptions = {
      columnDefs: [...this.columnDefs],
      rowData: rowData,
      rowHeight: 40,
      headerHeight: 40,
      rowSelection: 'multiple',
      defaultColDef: {
        filter:true,
        floatingFilter: true,
        sortable: true,
        resizable: true,        
      },
      enableBrowserTooltips:false,
      pagination: true,
      paginationPageSize: 30,
      groupSelectsChildren: true,
      context: { componentParent: this }
    }
    this.loadingProcess.next(false)
    this.dataFound = [...rowData]
    setTimeout(() => {
      this.agGrid.api.refreshCells({force:true})
      this.agGrid.api.purgeInfiniteCache()
      this.agGrid.api.sizeColumnsToFit()
    });

  }
  onEdit(row: any) {
    console.log('Modifier:', row);
  }

  onDelete(row: any) {
    // this.rowData = this.rowData.filter(item => item.id !== row.id);
    console.log("Row Data",row)
  }


  getRoomString(room)
  {
    let str="";
    switch (room.type) {
      case 'room':
        str= `Chambre #${room.code}`
        break;
      case 'studio':
        str = `Studio #${room.code}`
        break;
      case 'simple_apartment':
        str = `Apartement #${room.code}`
        break;
      case 'furnished_apartment':
        str = `Apartement Meublé #${room.code}`
        break;    
      default:
        break;
    }
    return str;
  }

  actionRender(data)
  {
    console.log("Data", data)
  }

}




