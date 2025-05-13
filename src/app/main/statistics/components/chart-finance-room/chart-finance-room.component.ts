import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'chart-finance-room',
  templateUrl: './chart-finance-room.component.html',
  styleUrls: ['./chart-finance-room.component.css']
})
export class ChartFinanceRoomComponent  implements OnInit{

  @Input() label:string=''
  @Input() title:string='Révenu unité'

  charsOpts: any={};


  ngOnInit(): void {
     this.charsOpts = this.getChart()
  }

    
  getChart() {


    return {
        title: {
          text: `Revenue ${new Date().getFullYear()}`
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
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
          boundaryGap: false,
          data: ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Email',
            type: 'line',
            stack: 'Total',
            data: [120, 132, 101, 134, 90, 230, 210,152,145,264,125,45]
          },
          {
            name: 'Union Ads',
            type: 'line',
            stack: 'Total',
            data: [220, 182, 191, 234, 290, 330, 310,145,253,454,123,564]
          },
          {
            name: 'Video Ads',
            type: 'line',
            stack: 'Total',
            data: [150, 232, 201, 154, 190, 330, 410,142,512,478,56,24]
          },
          {
            name: 'Direct',
            type: 'line',
            stack: 'Total',
            data: [320, 332, 301, 334, 390, 330, 320,124,555,232,452,125]
          },
          {
            name: 'Search Engine',
            type: 'line',
            stack: 'Total',
            data: [820, 932, 901, 934, 1290, 1330, 1320,124,251,523,42,355]
          }
        ]
    }
  }

}
