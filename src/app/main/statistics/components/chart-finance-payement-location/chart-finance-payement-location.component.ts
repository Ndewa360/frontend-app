import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { StatisticLocataireYearModel, StatisticState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'chart-finance-payement-location',
  templateUrl: './chart-finance-payement-location.component.html',
  styleUrls: ['./chart-finance-payement-location.component.css']
})
export class ChartFinancePayementLocationComponent implements OnChanges{
  
  @Input() label:string=''
  @Input() title:string=`Paiment de locataire ${new Date().getFullYear()}`
  @Input() propertyID:string=''

  charsOpts: any={};

  constructor(
    private _store:Store
  ){}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['propertyID']) {
      console.log("PropertyID",changes["propertyID"].currentValue)
      this._store.select(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(changes['propertyID'].currentValue))
      .subscribe((value)=>this.charsOpts = this.getChart(value))
    }
  }

  getChart(data:StatisticLocataireYearModel[]) {
    console.log("Data ",data)
    let legendData=[], dataSeriees=[]

    data.forEach((item)=>{
      legendData.push(item.locataire.fullName);
      dataSeriees.push({
        name: item.locataire.fullName,
        type: 'line',
        stack: 'Total',
        data: item.paymentValue
      })
    })
    console.log(legendData, dataSeriees)

    return {
        title: {
          // text: `Revenue `
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: legendData
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          name:'Mois',
          boundaryGap: false,
          data: UtilsString.getListOfMonth()
        },
        yAxis: {
          type: 'value',
          name:'Montant (FCFA)'
        },
        series: dataSeriees
    }
  }

}
