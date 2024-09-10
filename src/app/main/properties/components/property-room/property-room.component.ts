import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Currency, LocataireState, PropertyModel, PropertyState, RoomModel, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-property-room',
  templateUrl: './property-room.component.html',
  styleUrls: ['./property-room.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PropertyRoomComponent implements OnInit {
  loadingRoom = true;
  roomFound:RoomModel[] = [];
  roomFound$:Observable<RoomModel[]>;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router:Router,
    private _store:Store
  ) { }

  ngOnInit(): void {
    let propertyId = this._activatedRoute.parent.snapshot.paramMap.get('id');
    if(!propertyId)  {
      this._router.navigateByUrl('/app/properties/list');;
      return;
    }
    this.roomFound$=this._store.select(RoomState.selectStateRoomByPropertyId(propertyId));
    this.roomFound$.subscribe((found)=>{
        this.roomFound = found;
        this.loadingRoom = false;
    })
  }

  getRoomLocataire(locataireId)
  {
    return this._store.select(LocataireState.selectStateLocataire(locataireId))
  }

  getMoney()
  {
    return Currency.XAF
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }

}
