import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { LocationState } from 'src/app/shared/store';
import { HistoryLocationPaymentState } from 'src/app/shared/store/history-payment-location';

@Component({
  selector: 'history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit{
  @Select(HistoryLocationPaymentState.selectStateLoading) loadingHistoryPaymentState$:Observable<boolean>;
  @Select(LocationState.selectStateLoading) loadingLocationState$:Observable<boolean>;
  loading = true;

  constructor(
    private _store:Store,
    private _activatedRoute: ActivatedRoute,
  ){}

  ngOnInit(): void {
    // let locataireID = this._activatedRoute.snapshot.paramMap.get('roomID');
    combineLatest([this.loadingHistoryPaymentState$,this.loadingLocationState$]).subscribe(([loadingHistoryPaymentState, loadingLocationState])=>{
      this.loading = loadingHistoryPaymentState || loadingLocationState;
    })
  }
}
