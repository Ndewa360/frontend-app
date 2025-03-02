import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionErrored, ofActionSuccessful, Select, ofActionCompleted } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ApiUploadFileStateFormat, RoomModel, RoomState } from 'src/app/shared/store';
import { FileUploadContentType, UploadFilesAction, UploadFilesState,ContentUploadRoomType  } from 'src/app/shared/store/files-upload';
import { MediaUtil } from 'src/app/shared/utils';

@Component({
  selector: 'galery',
  templateUrl: './galery.component.html',
  styleUrls: ['./galery.component.css'],
  encapsulation:ViewEncapsulation.None,
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleryComponent implements OnInit, OnDestroy {
  waitingForUploaded=false;
  shouldResetFiles=false;
  files:File[]=[];
  filesUploaded:{name:string,state:ApiUploadFileStateFormat<any>}[]=[]
  mapFilesUploaded:Map<string,ApiUploadFileStateFormat<any>>=new Map<string,ApiUploadFileStateFormat<any>>();
  @Select(UploadFilesState.selectStateUploadedFiles) files$:Observable<{name:string,state:ApiUploadFileStateFormat<any>}[]>;
  // @Select(RoomState) room$:Observable<RoomModel>;
  roomSelectedImages =[];
  roomSelectedImages360=[];
  roomSelectedVideos=[]
  
  constructor(
    private dialogRef: MatDialogRef<GaleryComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data:{room:RoomModel},
    // private _changeDetectorRef: ChangeDetectorRef,
    
  ){}
  
  
  ngOnInit(): void {

    this._store.select(RoomState.selectStateRoom(this.data.room._id)).subscribe(async (value)=>{
      let data = await MediaUtil.getStructMedia(value.medias)
      this.roomSelectedImages360=data.images360;
      this.roomSelectedVideos=data.videos;
      this.roomSelectedImages=data.images;
      // this.roomSelectedImages=value.medias;
    })

    this.files$.subscribe((value)=>{
      let hasEndUpload=true;
      value.forEach((v)=>{
        if(v.state.state!='DONE') hasEndUpload=false;
      })
      
      if(hasEndUpload){
        this.shouldResetFiles=true;
      }
    })   

    this._ngxsAction.pipe(ofActionSuccessful(UploadFilesAction.UploadFiles)).subscribe((value)=>{
      // Navigate to the parent
      this.waitingForUploaded=false;
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(UploadFilesAction.UploadFiles)).subscribe(
      (value) => {
        this.waitingForUploaded=false;       

      }
    )
    this._ngxsAction.pipe(ofActionErrored(UploadFilesAction.UploadFiles)).subscribe(
      (value) => {
        this.waitingForUploaded=false;
      })     

  }

  deleteFile(urlFile)
  {
    //console.log("Item ",urlFile)

    this._store.dispatch(new UploadFilesAction.RemoveUploadedFile({
      fileUrl:urlFile,
      contentID:this.data.room._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_ROOM
    }))
  }

  close(){
    this.dialogRef.close();
  }

  updateFileListToUpdate(files)
  {
    this.files=files
    if(files.length==0) {
      this.shouldResetFiles=false;
      this._store.dispatch(new UploadFilesAction.ResetFileUploaded())

    }
  }

  uploadedFile() {

    this.waitingForUploaded=true;
    this.files.forEach((file)=>this._store.dispatch(new UploadFilesAction.UploadFiles({
      file:file,
      contentID: this.data.room._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_ROOM

    })))
  }

  ngOnDestroy(): void {
    if(this.shouldResetFiles) {
    }
  }
}
