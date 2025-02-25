import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { TableModel } from 'carbon-components-angular';
import { Observable } from 'rxjs';
import { FullScreenGaleryComponent } from 'src/app/shared/components/full-screen-galery/full-screen-galery.component';
import { LocataireState, Currency, SearchState, SearchPropertyModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'room-filtered-found',
  templateUrl: './room-filtered-found.component.html',
  styleUrls: ['./room-filtered-found.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class RoomFilteredFoundComponent {
    @Select(SearchState.selectStateLoading) loadingRoom$:Observable<string>;
    roomFound:SearchPropertyModel[] = [];
    @Select(SearchState.setlectStateFilteredProperty) roomFoundFiltered$:Observable<SearchPropertyModel[]>;
    public model = new TableModel();
    allRoomData=[]
    currentDataToShow=[]
    translationsPaginationButton={
      PREVIOUS:'Précédent',
      NEXT:'Suivant',      
    }
  
    constructor(
      private _activatedRoute: ActivatedRoute,
      private _router:Router,
      private _store:Store,
      private dialog: MatDialog,
  
    ) { }
  
    ngOnInit(): void {
      // this.roomFound$.subscribe((found)=>{
      //     this.roomFound = found;
      //     this.roomFoundFiltered = [...this.roomFound]
      // })
      this.roomFoundFiltered$.subscribe((found)=>{
        if(found.length==0) return;
        let newModel = new TableModel()

        console.log("Room Found ",found)

        this.allRoomData=[...found]
        newModel.data = [];
        newModel.pageLength=9;
        newModel.totalDataLength=Math.ceil(found.length/9);
        this.model = newModel;
        this.selectPage(1);

      })
    }

    selectPage(page) {
      this.getPage(page).then((data: Array<any>) => {
        // set the data and update page
        this.model.data = data
        this.currentDataToShow=[...data]
        this.model.currentPage = page
      })
    }

    getPage(page: number)
  {
    let end = page * this.model.pageLength;
    let start = end - this.model.pageLength;

    return new Promise(resolve => {
      setTimeout(() => resolve(this.allRoomData.slice(start,end)), 150)
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

    getAllImages(room:SearchPropertyModel)
    {
      return [...room.medias] //,...room.property.medias
    }

    goToRoom(event,room)
    {
      if(event.target.nodeName=="SWIPER-CONTAINER") return
      else this._router.navigateByUrl( `/search/room/${room._id}`)

    }


    showFullScreenViewer(images,e)
      {
        e.stopPropagation()
        this.dialog.open(FullScreenGaleryComponent, {
          viewContainerRef:null,
          disableClose: true,
          role: 'dialog',
          height: '100%',
          width: '100%',
          data:{
            medias:images
          }
        })
      }
}
