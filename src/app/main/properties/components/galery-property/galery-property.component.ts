import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ApiUploadFileStateFormat, PropertyModel, PropertyState } from 'src/app/shared/store';
import { UploadFilesState, UploadFilesAction, FileUploadContentType, ContentUploadRoomType} from 'src/app/shared/store/files-upload';
import { MediaUtil } from 'src/app/shared/utils';

@Component({
  selector: 'galery-property',
  templateUrl: './galery-property.component.html',
  styleUrls: ['./galery-property.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class GaleryPropertyComponent {
  waitingForUploaded=false;
  shouldResetFiles=false;
  files:File[]=[];
  filesUploaded:{name:string,state:ApiUploadFileStateFormat<any>}[]=[]
  mapFilesUploaded:Map<string,ApiUploadFileStateFormat<any>>=new Map<string,ApiUploadFileStateFormat<any>>();
  @Select(UploadFilesState.selectStateUploadedFiles) files$:Observable<{name:string,state:ApiUploadFileStateFormat<any>}[]>;
  // @Select(PropertyState) property$:Observable<PropertyModel>;
  propertySelectedImages =[];
  propertySelectedImages360=[];
  propertySelectedVideos=[]
  
  constructor(
    private dialogRef: MatDialogRef<GaleryPropertyComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data:{property:PropertyModel},
    // private _changeDetectorRef: ChangeDetectorRef,
    
  ){}
  
  
  ngOnInit(): void {

    this._store.select(PropertyState.selectStateProperty(this.data.property._id)).subscribe(async (value)=>{
      let data = await MediaUtil.getStructMedia(value.medias)
      this.propertySelectedImages360=data.images360;
      this.propertySelectedVideos=data.videos;
      this.propertySelectedImages=data.images;
      // this.propertySelectedImages=value.medias;
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

  close(){
    this.dialogRef.close();
  }

  deleteFile(urlFile)
  {
    console.log("Item ",urlFile)

    this._store.dispatch(new UploadFilesAction.RemoveUploadedFile({
      fileUrl:urlFile,
      contentID:this.data.property._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_PROPERTY
    }))
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
      contentID: this.data.property._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_PROPERTY
    })))
  }


  ngOnDestroy(): void {
    if(this.shouldResetFiles) {
    }
  }
  
}
