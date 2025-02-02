import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable, switchMap } from 'rxjs';
import { Currency, RoomState, SearchPropertyModel, SearchState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { ContactProprietaireComponent } from '../contact-proprietaire/contact-proprietaire.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'room-page-overview',
  templateUrl: './room-page-overview.component.html',
  styleUrls: ['./room-page-overview.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RoomPageOverviewComponent implements OnInit {
  @Select(SearchState.selectStateLoading) loading$:Observable<boolean>;
  @Select(SearchState.selectStateLoadingItem) loadingItem$:Observable<boolean>;
  loading = true;

  roomDataSearch:SearchPropertyModel=null;
  constructor(
      private _store:Store,
      private _activatedRoute: ActivatedRoute,
      private dialog: MatDialog,
      private viewportScroller: ViewportScroller
    ){}
    
  ngOnInit(): void {
    this._activatedRoute.paramMap.pipe(
      switchMap(params => {
        let roomID = params.get('roomID');
        // window.scrollTo(0, 0);
        // this.viewportScroller.scrollToPosition([0, 0])

        return this._store.select(SearchState.selectStateSearch(roomID));
      })
    ).subscribe((value)=>{
      this.roomDataSearch=value;
    combineLatest(this.loading$,this.loadingItem$).subscribe(([load,loadItem])=>{
      this.loading = load || loadItem
    })

    });
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

  getContactInfos()
  {
    this.dialog.open(ContactProprietaireComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'alertdialog',
          width: '500px',
          data:{room:this.roomDataSearch}
        })
  }
  
  getMoney()
  {
    return Currency.XAF
  }
  
  hasDescription(description)
  {
    return description && description.length>0
  }
}
