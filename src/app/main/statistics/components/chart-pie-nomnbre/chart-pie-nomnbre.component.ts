import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'chart-pie-nomnbre',
  templateUrl: './chart-pie-nomnbre.component.html',
  styleUrls: ['./chart-pie-nomnbre.component.css']
})
export class ChartPieNomnbreComponent implements OnInit{
  @Input() nbreTotal: number = 0;
  @Input() nbreActif: number = 0;
  @Input() label: string = ''
  @Input() title: string = ''
  @Input() chartColorBegin: string = 'rgba(76,107,167,1)'
  @Input() chartColorEnd: string = 'rgba(76,107,167,.8)'

  locataireOpts: any={};


  ngOnInit(): void {
     this.locataireOpts = this.getGauge()
  }

    
  getGauge() {
    //console.log("getGauge",((3*this.nbreTotal/4) * this.nbreActif) / this.nbreTotal ,this.nbreTotal - (((3*this.nbreTotal/4) * this.nbreActif) / this.nbreTotal))
    let colorStops = [{
      offset: 0,
      color: this.chartColorBegin // 0%
    }, {
      offset: 1,
      color: this.chartColorEnd // 100%
    }]


    return {
      backgroundColor: 'transparent',
      title: {
        text: `${this.nbreActif} / ${this.nbreTotal}` ,
        subtext: this.label,
        x: '49%',
        y: '46%',
        textAlign: 'center',
        textStyle: {
          rich: {
            num: {
              fontWeight: 'bold',
              fontFamily: '微软雅黑',
              fontSize: 25,
            },
            key: {
              fontWeight: 'bold',
              fontFamily: '微软雅黑',
              fontSize: 15,
            }
          }

        },
        subtextStyle: {
          lineHeight: 30,
          fontSize: 15
        }
      },
      data: [{
        name: this.label,
      }],
      tooltip: {
        trigger: 'item',  // Déclenchement des tooltips pour chaque élément
        formatter: '{a} <br/>{b}: {c} ({d}%)', // Format personnalisé des tooltips
      },
      series: [{ // 主圆环
        id:"iconDocument",
        name: this.label,
        type: 'pie',
        radius: ['70%', '90%'],
        startAngle: 225,
        color: [{
          type: 'linear',
          x: 1,
          y: 0,
          x2: 0,
          y2: 0,
          colorStops: colorStops,
        }, 'transparent'],
        hoverAnimation: true,
        legendHoverLink: false,
        z: 10,
        labelLine: {
          normal: {
            show: false
          }
        },
        data: [{
          value: ((3*this.nbreTotal/4) * this.nbreActif) / this.nbreTotal ,
        }, {
          value: this.nbreTotal - (((3*this.nbreTotal/4) * this.nbreActif) / this.nbreTotal)
        }]
      }, { // 背景圆环
        name: '',
        type: 'pie',
        radius: ['70%', '90%'],
        silent: true,
        startAngle: 225,
        labelLine: {
          normal: {
            show: false
          }
        },
        z: 5,
        data: [{
          value: 75,
          itemStyle: {
            color: 'rgba(237, 237, 237,0.6)'
          }
        }, {
          value: 25,
          itemStyle: {
            color: 'transparent'
          }
        }]
      }, { // 中间圈
        name: '',
        z: 5,
        type: 'pie',
        cursor: 'default',
        radius: ['65%', '65%'],
        startAngle: 225,
        hoverAnimation: false,
        legendHoverLink: false,
        labelLine: {
          normal: {
            show: false
          }
        },
        data: [{
          value: 75,
          itemStyle: {
            borderColor: 'rgba(237, 237, 237,0.8)',
            borderType: 'dashed'
          }
        }, {
          value: 25,
          itemStyle: {
            color: 'transparent'
          }
        }]
      }]
    }
  }

}
