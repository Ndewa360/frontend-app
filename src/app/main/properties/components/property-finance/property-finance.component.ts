import { Component, OnInit } from '@angular/core';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-property-finance',
  templateUrl: './property-finance.component.html',
  styleUrls: ['./property-finance.component.scss']
})
export class PropertyFinanceComponent implements OnInit {

  public charts =[
    {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      title: {
        text: 'Paimenent des locataires sur l\'année en cours'
      },
    yAxis: {
      type: 'category',
      data: ['Cedric Nguendap', 'Joel Ngalani', 'Jessi Njawe', 'Hussein Menkam', 'Sévérin Nguendap', 'Touani Blecky', 'Kell Momo']
    },
    xAxis: {
      type: 'value'
    },
    series: [{
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'bar',
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(220, 220, 220, 0.3)'
      }
    }]
  },
  {
    title: {
      text: 'Traveaux réalisé sur le bien durant l\'année en cours'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line'
    }]
  }
 ]
  constructor() { }

  ngOnInit(): void {
  }
  
  getMoney()
  {
    return UtilsString.getDefaultCurrency();
  }
}
