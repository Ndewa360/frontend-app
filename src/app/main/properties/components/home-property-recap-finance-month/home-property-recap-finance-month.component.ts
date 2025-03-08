import { AgGridAngular } from '@ag-grid-community/angular';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { StatisticPaymentOfAllPropertyByYear, Currency } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

const bienCellRenderer = (params) => {
  const {value} = params
  return `
    <div class="app-row app-row--center overflow-hidden">
      <div>
        <div class="app-expressive-heading-01">${value}</div>
      </div>
    </div>
  `
}

@Component({
  selector: 'home-property-recap-finance-month',
  templateUrl: './home-property-recap-finance-month.component.html',
  styleUrls: ['./home-property-recap-finance-month.component.css']
})
export class HomePropertyRecapFinanceMonthComponent implements OnChanges, OnInit{
 
  columnDefs:Array<ColDef>=[]
  public gridOptions: GridOptions = {}
  public defaultColDef = {}
  hasData:boolean=false
  dataTable = []
  @ViewChild('agGrid') agGrid!: AgGridAngular;
  @Input() dataFound=[]
  

  constructor(
    private currencyPipe:CurrencyPipe
  ){
    console.log("Create Table")
    this.createTable()
  }
    


  ngOnChanges(changes: SimpleChanges): void {
    if(changes['dataFound'])
    {
      this.updateTableYearData(changes['dataFound'].currentValue)
    }
  }

  ngOnInit(): void {
    
  }

  updateTableYearData(data)
  {
    // console.log("Data Table Month",data)

    this.hasData=true
    let rowData = data.map((item)=> ({
      bien:item.bien.name,
      amount_received: this.getCurrencyFormated(item.totalAmountReceived),
      amount_to_be_received:this.getCurrencyFormated(item.totalAmountToBeReceveid),
      total_recap_amount:this.getCurrencyFormated(item.totalAmountRelicat),
      
    }))
    
    this.gridOptions = {
      columnDefs: [...this.columnDefs],
      rowData: rowData,
      rowHeight: 40,
      headerHeight: 40,
      rowSelection: 'multiple',
      suppressMenuHide: true,
      cellSelection: true,
      enableBrowserTooltips:false,
      pagination: true,
      paginationPageSize: 30,
      groupSelectsChildren: true,
      context: { componentParent: this },
      domLayout:"autoHeight",
      debounceVerticalScrollbar:true
    }

    this.dataTable = [...rowData]

    setTimeout(() => {
      if(this.agGrid) {
        // this.agGrid.api.redrawRows()
        // this.agGrid.api.purgeInfiniteCache()
        this.agGrid.api.sizeColumnsToFit()
      }
    });

  }

  createTable() {
      this.columnDefs= [
        {
          headerName: 'Bien',
          field: 'bien',
          cellClass: 'cell-flex-middle overflow-hidden',
          cellRenderer: bienCellRenderer,
          width: 350,
          pinned: true,
          
        },
        {
          headerName: 'Montant à percevoir',
          field: 'amount_to_be_received',
          headerClass: 'cell-flex-right',
          cellClass: 'cell-flex-middle cell-flex-right',
        },
        {
          headerName: 'Montant percu',
          field: 'amount_received',          
          headerClass: 'cell-flex-right',
          cellClass: 'cell-flex-middle cell-flex-right',
          // filter: 'agNumberColumnFilter',
  
        },
        {
          headerName: 'Reste à percevoir',
          field: 'total_recap_amount',
          headerClass: 'cell-flex-right',
          cellClass: 'cell-flex-middle cell-flex-right font-bold',
          // filter: 'agNumberColumnFilter'
  
        },
      ]
    }

  exportToCSV(year,month) {
    this.agGrid.api.exportDataAsCsv({
      fileName: `Recapitulatif des paiements des biens ${UtilsString.getListOfMonth()[month]} ${year}`
    })
  }
  getCurrencyFormated(price)
  {
    return this.currencyPipe.transform(price, Currency.XAF, 'symbol', '1.0-0')
  }

}
