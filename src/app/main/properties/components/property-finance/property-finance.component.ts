import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { LocataireState, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-property-finance',
  templateUrl: './property-finance.component.html',
  styleUrls: ['./property-finance.component.scss']
})
export class PropertyFinanceComponent implements OnInit {

  locataireOpts = {};
  propertyId=null;
  roomCount = {nbreRoomActif:0,nbreRoomTotal:0}
  locataireCount = {locataireCountForPropertyId:0,locataireCountTotal:0}

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
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _store:Store,
  ) { }

  ngOnInit(): void {
    this.propertyId = this._activatedRoute.snapshot.parent.paramMap.get('id');
    this._store.select(RoomState.selectStateCountRoomWithStateByPropertyId(this.propertyId))
    .subscribe((value)=>{
      this.roomCount={nbreRoomActif:value.roomFreeCount, nbreRoomTotal:value.roomCountTotal}
    });

    this._store.select(LocataireState.selectStateCountLocataireByPropertyId(this.propertyId)).subscribe((value)=>{
      this.locataireCount={
        locataireCountForPropertyId:value.countLocataireForPropertyId,
        locataireCountTotal:value.countAllLocataire
      }
    })
  }
  
  getMoney()
  {
    return UtilsString.getDefaultCurrency();
  }

}
