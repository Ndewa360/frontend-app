import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { HistoryLocationPaymentModel, HistoryLocationPaymentState } from 'src/app/shared/store/history-payment-location';
import { LocationPaymentModel, LocationPaymentType } from 'src/app/shared/store/payment-location';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'history-payment',
  templateUrl: './history-payment.component.html',
  styleUrls: ['./history-payment.component.css']
})
export class HistoryPaymentComponent implements OnInit{
  dataHistory:any[] = [
    {
    time: '',
    type: '',
    title: 'Aujourdhui',
    content: ``,
    children: []
    }
  ];
  locataireID:string="";

  constructor(
    private _store:Store,
    private _activatedRoute: ActivatedRoute,
  ){}

  ngOnInit(): void {
    this.locataireID = this._activatedRoute.snapshot.parent.paramMap.get('locataireID');
    this._store.select(HistoryLocationPaymentState.selectStateHistoryLocationPaymentByLocataireId(this.locataireID)).subscribe((data)=>{
      this.structureAndShowData(data)
    })
  }

  structureAndShowData(data:HistoryLocationPaymentModel[])
  {
    let dataHistory:any[] = [
      {
      time: '',
      type: '',
      title: 'Aujourdhui',
      content: ``,
      children: []
      }
    ];
    for(let historyData of data)
    {
      let historyItem:any[] = [
        {
          time: new Date(historyData.location.startedAt).toDateString(),
          type: 'info',
          title: 'Nouveau contrat',
          content: `Contrat de location sur le bien #${historyData.room.code} depuis ${new Date(historyData.location.startedAt).toDateString()}`,
          pulse: true,
          roomCode:historyData.room.code,
          startedLocationAt:new Date(historyData.location.startedAt),
          contentType:"contrat",
          children: []
        },
      ];
      let organizedData = this.organiseDateViewByDate(historyData.transactions);
      for(let yearFound of organizedData.keys())
      {
        historyItem.push({
          time: yearFound,
          type: 'warning',
          title: `Paiement ${yearFound}`,
          contentType:"payment_year",
          content: `Paiement de frais de location de l'année ${yearFound}`,
          pulse:false,
          children: []
        });
        for(let transaction of organizedData.get(yearFound))
        {
          historyItem[historyItem.length-1].children.push({
            time: new Date(transaction.createdAt),
            locationPaymentPrice:transaction.locationPaymentPrice,
            datePayment:transaction.datePayment,
            pulse:transaction.paymentLocationType==LocationPaymentType.CAUTION,
            type: transaction.paymentLocationType==LocationPaymentType.CAUTION?"danger":"success",
            title: `Versement de ${transaction.locationPaymentPrice} FCFA le ${new Date(transaction.datePayment).toDateString()}`,
            content: ``,
            contentType:"payment",
            children: [],
            data:transaction.billingRef
          })
        }
      }
      dataHistory.push(...historyItem.reverse());
    }
    this.dataHistory = [...dataHistory];
  }
  organiseDateViewByDate(transaction:LocationPaymentModel[])
  {
    let dataOrgonised:Map<string,LocationPaymentModel[]> = new Map<string,LocationPaymentModel[]>();
    for(let data of transaction)
    {
      let date = `${new Date(data.datePayment).getFullYear()}`;
      if(!dataOrgonised.has(date)) dataOrgonised.set(date ,[])
      dataOrgonised.get(date).push(data);
    }
    return dataOrgonised;
  }

  getPaymenentType(typePayement)
  {
    return UtilsString.getStringOfLocationPaymentType(typePayement)
  }
  getClassForEvent(event) {
    let classes = []
    if (event.pulse) {
      classes.push('app-timeline__item--pulse')
    }
    switch (event.type) {
      case 'success':
        classes.push('app-timeline__item--success')
        break
      case 'danger':
        classes.push('app-timeline__item--danger')
        break
      case 'warning':
        classes.push('app-timeline__item--warning')
        break
      case 'info':
        classes.push('app-timeline__item--info')
        break
      default:
    }
    return classes.join(' ')
  }
}
