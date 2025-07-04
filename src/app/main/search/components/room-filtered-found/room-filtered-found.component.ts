import { Component, ViewEncapsulation, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { TableModel } from 'carbon-components-angular';
import { Observable } from 'rxjs';
import { FullScreenGaleryComponent } from 'src/app/shared/components/full-screen-galery/full-screen-galery.component';
import { LocataireState, Currency, SearchState, SearchPropertyModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { SearchAction } from 'src/app/shared/store/search/search.actions';
import { debounceTime, catchError } from 'rxjs/operators';

@Component({
  selector: 'room-filtered-found',
  templateUrl: './room-filtered-found.component.html',
  styleUrls: ['./room-filtered-found-modern.component.scss'],
})
export class RoomFilteredFoundComponent {
    @Select(SearchState.selectStateLoading) loadingRoom$:Observable<string>;
    roomFound:SearchPropertyModel[] = [];
    @Select(SearchState.selectStateFilteredProperty) roomFoundFiltered$:Observable<SearchPropertyModel[]>;
    public model = new TableModel();
    allRoomData=[]
    currentDataToShow=[]

    // Nouvelles propriétés pour le design moderne
    @Input() viewMode: 'grid' | 'list' = 'grid';

    translationsPaginationButton={
      PREVIOUS:'Précédent',
      NEXT:'Suivant',
    }
  
    totalResults = 0;
    pageSize = 12;
    currentPage = 1;
    errorMessage: string = '';
    constructor(
      private _activatedRoute: ActivatedRoute,
      private _router:Router,
      private _store:Store,
      private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
      this.roomFoundFiltered$.subscribe((found)=>{
        if(found.length==0) return;
        this.allRoomData=[...found]
        this.totalResults = found.length;
        this.selectPage(1);
      })
    }

    getCurrentCity() {
      let city = null;
      this._activatedRoute.queryParams.subscribe(params => {
        if(params['ville']) city = params['ville'];
      });
      return city;
    }

    selectPage(page) {
      this.currentPage = page;
      const city = this.getCurrentCity();
      if(city) {
        this._store.dispatch(new SearchAction.FetchSearch(city, page, this.pageSize)).pipe(
          catchError((err) => {
            this.errorMessage = 'Erreur lors de la récupération des résultats. Veuillez réessayer.';
            return [];
          })
        ).subscribe();
      }
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

    // Nouvelles méthodes pour le design moderne
    trackByRoomId(index: number, room: SearchPropertyModel): string {
      return room._id;
    }



    isFavorite(room: SearchPropertyModel): boolean {
      return (room as any).isFavorite || false;
    }

    toggleFavorite(room: SearchPropertyModel, event: Event): void {
      event.stopPropagation();
      // TODO: Implémenter la logique des favoris
      // Créer une propriété locale pour gérer les favoris
      if (!(room as any).isFavorite) {
        (room as any).isFavorite = false;
      }
      (room as any).isFavorite = !(room as any).isFavorite;
    }

    getRoomTypeLabel(roomType: string): string {
      return UtilsString.getStringOfRoomType(roomType as any);
    }



    resetFilters(): void {
      // TODO: Implémenter la réinitialisation des filtres
      console.log('Reset filters');
    }
}
