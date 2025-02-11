import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { StatisticAllPaymentLocataireYearModel, StatisticState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'chart-finance-payement-annee',
  templateUrl: './chart-finance-payement-annee.component.html',
  styleUrls: ['./chart-finance-payement-annee.component.css']
})
export class ChartFinancePayementAnneeComponent implements OnChanges{
  currentDate = new Date();
  @Input() label:string=''
  @Input() title:string=`Paiment de locataire ${this.currentDate.getFullYear()}`
  @Input() propertyID:string=''
  @Input() selectedYear
  currentPayementData:StatisticAllPaymentLocataireYearModel[]=[];

  charsOpts: any={};

  constructor(
    private _store:Store
  ){}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['propertyID'] || changes['selectedYear']) {
      this.title=`Paiment de locataire ${this.selectedYear}`
      this._store.select(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyID,this.selectedYear))
      .subscribe((value)=>this.charsOpts = this.getChart(value))
    }
  }
  
  getChart(value)
  {
    this.currentPayementData = value;
    let locataires = value.map((item)=>item.locataire.fullName),
      dataPayment = value.map((item)=>item.paymentState.map((payState)=>([payState.month,item.locataire.fullName,this.getNumberFromStatus(payState.state)]))).reduce((acc,curr)=>[...acc,...curr],[])
    return {
      tooltip: {
        position: 'top',
        formatter: (params)=> {
          // console.log("Here PAras",params);
          let status = params.data[2];  // Statut du paiement 
          let statusText = this.getTextFromPaymentStatus(status);
          let room = this.getRoomInfosByUserName(params.data[1])
          return `
            ${params.seriesName}<br/>Locataire: ${params.data[1]}<br/>
            Mois: ${UtilsString.capitalizedFirstLetter(new Date(this.selectedYear,params.data[0]).toLocaleDateString("fr-FR",{month:'long'}))}<br/>
            Montant: ${room.price}<br/>
            ${room.roomStringTYpe}: ${room.roomCode}<br/>
            Status: ${statusText}
            `;
        }
      },
      grid: {
        height: '60%',
        top: '10%', 
        right:'1%',
        // borderWidth:20,
        // borderColor:'#fff'
      },
      xAxis: {
        type: 'category',
        data: UtilsString.getListOfMonth(),
        splitArea: {
          show: true, // Affiche la séparation entre les colonnes
        }
      },
      yAxis: {
        type: 'category',
        data: locataires,
        splitArea: {
          show: true // Affiche la séparation entre les lignes
        },
        nameTextStyle:{
          align:'left',
          verticalAlign:'middle',
          lineHeight:-1
        }
      },
      visualMap: {
        min: 0,
        max: 4,  // 0: Non payé, 1: Payé, 2: Paiement en attente, 3: Contrat rompu,4: Pas encore de contrat
        calculable: true,
        show: false,  // Ne pas afficher la légende visuelle
        inRange: {
          color: ['rgb(220, 38, 38)', 'rgb(101, 163, 13)', 'rgb(203, 213, 225)',"rgb(41, 37, 36)","rgba(41, 37, 36,.8)"], // Rouge, Vert, Blanc,Gris
          // Rouge pour "Non payé", Vert pour "Payé", Blanc pour "Paiement en attente", Gris pour "Contrat rompu",Gris leger pour "Aucun contrat"
        }
      },
      series: [{
        name: 'Status des Paiements',
        type: 'heatmap',
        data: dataPayment, // Format des données : [mois, utilisateur, statut]
        label: {
          show: true,
          formatter: (params)=>{
            let room = this.getRoomInfosByUserName(params.data[1])
            let status = params.data[2];
            return `${this.getTextFromPaymentStatus(status)}`;
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    
  }

  getRoomInfosByUserName(userName)
  {
    let room = this.currentPayementData.find((item)=>item.locataire.fullName === userName).room
    if(!room) return null;
    return {
      price:`${room.price} ${UtilsString.getDefaultCurrency()}`, 
      roomCode:room.code,
      roomStringTYpe:UtilsString.getStringOfRoomType(room.type)
    }
  }

  getNumberFromStatus(status) // 0: Non payé, 1: Payé, 2: Paiement en attente, 3: Contrat rompu, 4: Aucun contrat
  {
      return status === "unpayed" ? 0 : status === "payed" ? 1 :  status === "waiting" ?2:  status === "endedContract" ?3:4;
  }
  getTextFromPaymentStatus(status){
    return status === 0 ? 'Non payé' : status === 1 ? 'Payé' :  status === 2 ?'Paiement en attente':status === 3 ?"Fin de contrat":"Aucun contrat";
  }
  // ngOnChanges(changes: SimpleChanges): void {
  //   if(changes['propertyID']) {
  //     console.log("PropertyID",changes["propertyID"].currentValue)
  //     this._store.select(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(changes['propertyID'].currentValue))
  //     .subscribe((value)=>this.charsOpts = this.getChart(value))
  //   }
  // }

  // getChart(data:StatisticLocataireYearModel[]) {
  //   console.log("Data ",data)
  //   let legendData=[], dataSeriees=[]

  //   data.forEach((item)=>{
  //     legendData.push(item.locataire.fullName);
  //     dataSeriees.push({
  //       name: item.locataire.fullName,
  //       type: 'line',
  //       stack: 'Total',
  //       data: item.paymentValue
  //     })
  //   })
  //   console.log(legendData, dataSeriees)

  //   return {
  //       title: {
  //         // text: `Revenue `
  //       },
  //       tooltip: {
  //         trigger: 'axis'
  //       },
  //       legend: {
  //         data: legendData
  //       },
  //       grid: {
  //         left: '3%',
  //         right: '4%',
  //         bottom: '3%',
  //         containLabel: true
  //       },
  //       toolbox: {
  //         feature: {
  //           saveAsImage: {}
  //         }
  //       },
  //       xAxis: {
  //         type: 'category',
  //         name:'Mois',
  //         boundaryGap: false,
  //         data: ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
  //       },
  //       yAxis: {
  //         type: 'value',
  //         name:'Montant (FCFA)'
  //       },
  //       series: dataSeriees
  //   }
  // }
}
