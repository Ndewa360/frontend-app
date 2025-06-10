import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RoomModel } from 'src/app/shared/store';
import { UploadFilesState } from 'src/app/shared/store/files-upload';
import { MediaUtil } from 'src/app/shared/utils';
import { GaleryComponent } from '../galery/galery.component';

@Component({
  selector: 'details-room-galery',
  templateUrl: './details-room-galery.component.html',
  styleUrls: ['./details-room-galery.component.css']
})
export class DetailsRoomGaleryComponent implements OnChanges {
  @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>()
  @Select(UploadFilesState.selectStateLoading) waittingResponse$:Observable<boolean>
  urlsQuadricUrlList:{url:string,type:string}[]=[];
  waittingResponse:boolean = false;

  @Input() room:RoomModel=null;
  roomSelectedImages =[];
  roomSelectedImages360=[];
  roomSelectedVideos=[]

  constructor(
    private dialog: MatDialog,)
    {}

  async ngOnChanges(changes: SimpleChanges) {
    if(changes['room'] && changes['room'].currentValue) {
      console.log("Room changed media", changes['room'].currentValue);
      this.processImageUrl(changes['room'].currentValue.medias)}
  }

  async processImageUrl(medias) {
    let mediaData = await MediaUtil.getStructMedia(medias)
    this.roomSelectedImages360=mediaData.images360;
    this.roomSelectedVideos=mediaData.videos;
    this.roomSelectedImages=mediaData.images;


    this.urlsQuadricUrlList = [
      ...mediaData.images360.map((img)=>({url:img,type:"360"})),
      ...mediaData.videos.map((img)=>({url:img,type:"video"})),
      ...mediaData.images.map((img)=>({url:img,type:"image"})),
    ]

  }


  deleteFile(urlItem)
  {
    this.onDeleteFileEvent.emit(urlItem)
  }

  openEditGalery()
  {
    // this._router.navigate(['/app/properties/edit-room',room._id])
    //console.log("Room ",room)
    this.dialog.open(GaleryComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '100%',
      height: '100%',
      data:{
        room:this.room
      }
    })
  }
}
