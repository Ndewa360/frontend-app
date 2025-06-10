import { AgGridAngular } from '@ag-grid-community/angular';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import * as moment from 'moment';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { CustomHistoryFinanceCellActionComponent } from 'src/app/main/properties/components/custom-history-finance-cell-action/custom-history-finance-cell-action.component';
import { HistoryLocationPaymentState, Currency, RoomModel } from 'src/app/shared/store';

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
  selector: 'details-payment-room',
  templateUrl: './details-payment-room.component.html',
  styleUrls: ['./details-payment-room.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DetailsPaymentRoomComponent implements OnInit, OnChanges {
  @ViewChild('agGridForDetailsPayment') agGrid!: AgGridAngular;
  @ViewChild('paginationPanel', { static: true }) paginationPanel!: ElementRef;
  @Input() room:RoomModel=null;
  @Input() historyLocationPayments = [];
    
    @Select(HistoryLocationPaymentState.selectStateLoading) historyLocationPaymentLoading$!: Observable<boolean>;
    propertyId=null;
    columnDefs=[]
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
      
    }

    ngOnChanges(changes: SimpleChanges): void {
      if(changes['historyLocationPayments'] && changes['historyLocationPayments'].currentValue) {
      this.createTable()
        console.log("Changes History Location Payments", changes['historyLocationPayments'].currentValue)
        this.updateTableData(changes['historyLocationPayments'].currentValue);
      }
    }
    
  
    createTable() {
      this.columnDefs= [
        {
          headerName: '#', 
          valueGetter: 'node.rowIndex + 1', 
          width: 70,
          pinned: 'left',
          filter: false,
          // cellClass: 'cell-flex-middle'
        },
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
          filter: false,
        },
      ]
    }
  
    updateTableData(data)
    {
      this.hasData=true
      let rowData = data.map((item)=> item.transactions.map((transaction)=>({
        locataire:item.locataire.fullName,
        date_paiement:moment(transaction.datePayment).format('LL') ,
        price:this.currencyPipe.transform(transaction.locationPaymentPrice,Currency.XAF,'symbol', '1.0-0'),
        date:new Date(transaction.datePayment),
        history:item,
        transaction
        
      }))).reduce((acc,curr)=>[...acc,...curr],[])
      console.log(" rowData ",rowData)
  
      rowData.sort((a,b)=> b.date - a.date);
      
      this.gridOptions = {
        columnDefs: [...this.columnDefs],
        // rowData: rowData,
        rowHeight: 40,
        headerHeight: 40,
        rowSelection: 'single',
        defaultColDef: {
          filter:true,
          floatingFilter: true,
          sortable: true,
          // resizable: true,        
        },
        pagination: true,
        paginationPageSize: 15,
        domLayout: "autoHeight",
      }
      this.loadingProcess.next(false)
      this.dataFound = [...rowData]
      // setTimeout(() => {
      //   if(this.agGrid) {
      //     // this.agGrid.api.redrawRows()
      //     // this.agGrid.api.purgeInfiniteCache()
      //     this.agGrid.api.sizeColumnsToFit()
      //   }
      // });
      setTimeout(() => {
        if (this.agGrid && this.agGrid.api) {
          // this.agGrid.api.sizeColumnsToFit();
        }
      });
  
    }
    onEdit(row: any) {
      console.log('Modifier:', row);
    }
  
    onDelete(row: any) {
      // this.rowData = this.rowData.filter(item => item.id !== row.id);
      console.log("Row Data",row)
    }
  
    exportToCSV()
    {
      this.agGrid.api.exportDataAsCsv({
        fileName: `Historique des paiements`
      })
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
