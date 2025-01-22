import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Currency, SearchPropertyModel, SearchState } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'room-associated',
  templateUrl: './room-associated.component.html',
  styleUrls: ['./room-associated.component.css']
})
export class RoomAssociatedComponent implements OnChanges{
  
  @Input() selectedFoundRoom:SearchPropertyModel=null;

  relatedFoundRooms:SearchPropertyModel[]=[];

  constructor(
    private _store:Store,
    private router:Router
  ){}

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['selectedFoundRoom']){
      this._store.select(SearchState.selectStateSearchRelated({
        property: this.selectedFoundRoom.property._id,
        type: this.selectedFoundRoom.type,
        geolocationCountry: this.selectedFoundRoom.property.geolocationCountry._id,
        geolocationCity: this.selectedFoundRoom.property.geolocationCity._id,
        specifity: {
          hasClosure: this.selectedFoundRoom.property.hasClosure,
          hasParking: this.selectedFoundRoom.property.hasParking,
          ...this.selectedFoundRoom.specifity
        }
      },this.selectedFoundRoom._id)).subscribe((value)=>{
        console.log("Found Related Value ",value)
        this.relatedFoundRooms = value
      })

      // console.log("Filter ",{property: this.selectedFoundRoom.property._id,
      //   type: this.selectedFoundRoom.type,
      //   geolocationCountry: this.selectedFoundRoom.property.geolocationCountry._id,
      //   geolocationCity: this.selectedFoundRoom.property.geolocationCity._id,
      //   specifity: {
      //     hasClosure: this.selectedFoundRoom.property.hasClosure,
      //     hasParking: this.selectedFoundRoom.property.hasParking,
      //     ...this.selectedFoundRoom.specifity
      //   }})
    }
  }

  getRoomType(roomType)
  {
    return UtilsString.getStringOfRoomType(roomType)
  }
  
  getMoney()
  {
    return Currency.XAF
  }

  goToRoom(room)
  {
    this.router.navigateByUrl( `/search/room/${room._id}`)
  }

}
