import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { StatisticState, StatisticAction, MONTH, StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store';
import { HomePropertyRecapFinanceYearComponent } from '../home-property-recap-finance-year/home-property-recap-finance-year.component';
import { HomePropertyRecapFinanceMonthComponent } from '../home-property-recap-finance-month/home-property-recap-finance-month.component';




@Component({
  selector: 'home-property-recap-finance',
  templateUrl: './home-property-recap-finance.component.html',
  styleUrls: ['./home-property-recap-finance.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomePropertyRecapFinanceComponent implements OnInit {

  @Select(StatisticState.selectPaymentRecapitulationStatisticLoading) paymentRecapitulationLoading$!: Observable<boolean>;
  @ViewChild(HomePropertyRecapFinanceYearComponent) yearRecapComponent: HomePropertyRecapFinanceYearComponent;
  @ViewChild(HomePropertyRecapFinanceMonthComponent) monthRecapComponent: HomePropertyRecapFinanceMonthComponent;

  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedMonth = -1;
  isYearSelectedView = true;
  monthList =[]
  yearsList = []

  dataFound: StatisticPaymentOfAllPropertyByYear[]= []
  dataMonthFound = []
  
  public loading: boolean = true

  constructor(
      private _store:Store,
    
    ) {
  }

  ngOnInit(): void {    
    
    
    this.callToSubscribeData();
  }

  callToSubscribeData()
  {
    console.log("Selected Year callToSubscribe",this.selectedYear)
    this._store.select(StatisticState.selectStateStatisticRecapitulationPaymentBydYear(this.selectedYear)).subscribe((value)=>{
      if(value.length>0) this.dataFound = value;
    })
    this.yearsList = Array.from({length: 10}, (x, i) => ({content:this.currentYear-i,selected:(this.currentYear-i)==this.selectedYear}));
    this.monthList = Object.values(MONTH).map((value,i)=>({content:value, valueType:i}));
  }

  exportToCSV()
  {
    if(this.isYearSelectedView) this.yearRecapComponent.exportToCSV(this.selectedYear)
    else this.monthRecapComponent.exportToCSV(this.selectedYear,this.selectedMonth)
  }

  onSelectedYear(event)
  {
      this.selectedYear = event.content;
      this.selectedMonth = -1;
      this._store.dispatch(new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear))
      this.callToSubscribeData();
  }

  onSelectedMonth(event)
  {
    if((event instanceof Array) && event.length==0) this.isYearSelectedView = true;
    else {
      this.isYearSelectedView = false;
      this.selectedMonth = event.valueType;
      this.selectedDataOfMonth();
    }
      console.log("Event Month ",event)
      // this._store.dispatch(new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear))
      // this.callToSubscribeData();
  }

  

  onEdit(row: any) {
    console.log('Modifier:', row);
  }

  onDelete(row: any) {
    // this.rowData = this.rowData.filter(item => item.id !== row.id);
    console.log("Row Data",row)
  }

  selectedDataOfMonth()
  {
    this.dataMonthFound = [ ]
    this.dataFound.forEach((data)=>{
      console.log("Payment Property",data.paymentProperty)
      data.paymentProperty.forEach((property)=>{
        this.dataMonthFound.push({...property.amountMonth[this.selectedMonth],bien:property.property})
      })
    })
    
  } 

  actionRender(data)
  {
    console.log("Data", data)
  }

}




