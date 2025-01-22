import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LocationModel, LocationState, RoomState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'history-room',
  templateUrl: './history-room.component.html',
  styleUrls: ['./history-room.component.css']
})
export class HistoryRoomComponent implements OnInit{
  
  locations$:Observable<LocationModel[]>;
  
  constructor(
    private _store:Store,
    private _activatedRoute: ActivatedRoute,
  ){}

  ngOnInit(): void {
    let locataireID = this._activatedRoute.snapshot.parent.paramMap.get('roomID');
    this.locations$ = this._store.select(LocationState.selectStateLocationByLocataireId(locataireID));
    this.locations$.subscribe((data)=>console.log("Location list",data))
  }

  getRoomById(id)
  {
    return this._store.select(RoomState.selectStateRoom(id))
  }

  getReadeablRoomType(type)
  {
    return UtilsString.getStringOfRoomType(type);
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
