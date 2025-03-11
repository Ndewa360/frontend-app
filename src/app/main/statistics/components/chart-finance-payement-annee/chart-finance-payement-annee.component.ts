import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Currency, StatisticAllPaymentLocataireYearModel, StatisticPaymentStateType, StatisticState } from 'src/app/shared/store';
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
    private _store:Store,
    private currencyPipe:CurrencyPipe
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
          // //console.log("Here PAras",params);
          let status = params.data[2];  // Statut du paiement 
          let statusText = this.getTextFromPaymentStatus(status);
          let room = this.getRoomInfosByUserName(params.data[1], params.data[0])
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
        max: 5,  // 0: Non payé, 1: Payé, 2: Paiement en attente, 3: Contrat rompu,4:Paiement partiel 5: Pas encore de contrat
        calculable: true,
        show: false,  // Ne pas afficher la légende visuelle
        inRange: {
          color: ['rgb(220, 38, 38)', 'rgb(101, 163, 13)', 'rgb(203, 213, 225)',"rgb(41, 37, 36)",'rgba(100, 163, 13, 0.6)',"rgba(41, 37, 36,.8)"], // Rouge, Vert, Blanc,vert transparent,Gris
          // Rouge pour "Non payé", Vert pour "Payé", Blanc pour "Paiement en attente", Gris pour "Contrat rompu","Vert légerement transparent pour paiement partiel",Gris leger pour "Aucun contrat"
        }
      },
      series: [{
        name: 'Status des Paiements',
        type: 'heatmap',
        data: dataPayment, // Format des données : [mois, utilisateur, statut]
        label: {
          show: true,
          formatter: (params)=>{
            let room = this.getRoomInfosByUserName(params.data[1], params.data[0])
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

  getRoomInfosByUserName(userName, monthData)
  {
    let detailInfos =this.currentPayementData.find((item)=>item.locataire.fullName === userName)
    let room = detailInfos.room
    let priceItem = detailInfos.paymentState.find((item)=>item.month === monthData)
    // console.log("Room", room, price)
    if(!room) return null;
    return {
      price: priceItem.state==StatisticPaymentStateType.PARTIAL_PAYMENT?this.currencyPipe.transform(priceItem.price,Currency.XAF,'symbol', '1.0-0'):`${this.currencyPipe.transform(room.price,Currency.XAF,'symbol', '1.0-0')}`, 
      roomCode:room.code,
      roomStringTYpe:UtilsString.getStringOfRoomType(room.type)
    }
  }

  getNumberFromStatus(status) // 0: Non payé, 1: Payé, 2: Paiement en attente, 3: Contrat rompu, 4: Paiment partiel, 5: Aucun contrat
  {
      return status == StatisticPaymentStateType.UNPAYED ? 0 : status ==StatisticPaymentStateType.PAYED ? 1 :  status == StatisticPaymentStateType.WAITING ?2:  status == StatisticPaymentStateType.ENDED_CONTRACT ?3: status == StatisticPaymentStateType.PARTIAL_PAYMENT ?4:5;
  }
  getTextFromPaymentStatus(status){
    return status === 0 ? 'Non payé' : status === 1 ? 'Payé' :  status === 2 ?'Paiement en attente':status === 3 ?"Fin de contrat":status === 4 ?"Paiement partiel":"Aucun contrat";
  }
}
