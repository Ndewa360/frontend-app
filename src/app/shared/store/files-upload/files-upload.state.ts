import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { UploadFilesAction } from "./files-upload.actions";
import { UploadFilesService } from "./files-upload.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, scan, tap } from "rxjs/operators";
import { calculateState, UtilsString } from "../../utils";
import { ToastrService } from "ngx-toastr";
import { ApiResultFormat, ApiUploadFileStateFormat } from "../global";
import { RoomAction, RoomModel } from "../rooms";
import { PropertyAction } from "../properties";

import { ContentUploadRoomType } from "./files-upload.model";

export class UploadFilesStateModel {
    loadingUploadFiles:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
    filesState:{name:string,state:ApiUploadFileStateFormat<ApiResultFormat<RoomModel>>}[]
}


@State<UploadFilesStateModel>({
    name: "filesupload",
    defaults:{
        loadingUploadFiles:false,
        initLoadingState:'NO_LOADED',
        filesState:[]
    }
})
@Injectable()
export class UploadFilesState{
   
    constructor(
        private _updateFilesService:UploadFilesService,
        private _toastrService:ToastrService,
    ){}

    @Selector()
    static selectStateLoading(state:UploadFilesStateModel)
    {
        return state.loadingUploadFiles
    }

    @Selector()
    static selectStateUploadedFiles(state:UploadFilesStateModel)
    {
        return state.filesState
    }
    
    @Action(UploadFilesAction.ResetFileUploaded)
    resetUploadedFiles(ctx:StateContext<UploadFilesStateModel>)
    {
        ctx.patchState({
            filesState: [],
        })
    }

    @Action(UploadFilesAction.UploadFiles)
    uploadFiles(ctx:StateContext<UploadFilesStateModel>, {uploadFiles}:UploadFilesAction.UploadFiles)
    {
        const state = ctx.getState();
        
        let fileFound = state.filesState.findIndex((f)=>f.name==uploadFiles.file.name);
        if(fileFound>-1) return this._toastrService.warning(`Impossible d'importer le fichier ${uploadFiles.file.name} car déjà existant!`, 'Ndewa360°');

        let newFile = {name:uploadFiles.file.name,state:null};
        newFile.state = { state: 'PENDING', progress: 0 }

        let files = [...state.filesState,newFile]

        ctx.patchState({
            filesState: files,
        })

        return this._updateFilesService.uploadFiles(uploadFiles).pipe(
            scan((upload,event)=>calculateState<ApiResultFormat<RoomModel>>(upload,event),newFile.state),
            tap(
                (result)=>{

                    if(result.data) 
                    {
                        if(uploadFiles.contentRoomType==ContentUploadRoomType.FOR_ROOM) ctx.dispatch(new RoomAction.SetRoom(result.data.data))
                        else ctx.dispatch(new PropertyAction.SetProperty(result.data.data))
                        this._toastrService.success(`Le fichier '${uploadFiles.file.name}' envoyé avec succés!`, 'Ndewa360°');                                             
                    }
                    const data = [...ctx.getState().filesState]
                    let index = data.findIndex((u)=>u.name==uploadFiles.file.name);
                    if(index>-1) data[index]={name:uploadFiles.file.name,state:result};
                    ctx.patchState({
                        filesState: data,
                    })

                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUploadFiles: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(UploadFilesAction.RemoveUploadedFile)
    removedUploadFiles(ctx:StateContext<UploadFilesStateModel>, {removedUploadFile}:UploadFilesAction.RemoveUploadedFile)
    {
        const state = ctx.getState();

        console.log("File Upload ",removedUploadFile,state.filesState)

        
        // let fileFound = state.filesState.findIndex((f)=>f.name==removedUploadFile.fileUrl);
        // if(fileFound<0) return this._toastrService.warning(`Le fichier ${removedUploadFile.fileUrl} n'existant!`, 'Ndewa360°');

        ctx.patchState({
            loadingUploadFiles:true
        })

        return this._updateFilesService.removeUploadedFile(removedUploadFile).pipe(
            tap(
                (result)=>{

                    if(removedUploadFile.contentRoomType==ContentUploadRoomType.FOR_ROOM) ctx.dispatch(new RoomAction.RemoveImageRoom(removedUploadFile.fileUrl,removedUploadFile.contentID))
                    else ctx.dispatch(new PropertyAction.RemoveFile(removedUploadFile.fileUrl,removedUploadFile.contentID))
                    this._toastrService.success(`Fichier '${removedUploadFile.fileUrl}' envoyé avec succés!`, 'Ndewa360°');
                    
                    ctx.patchState({
                        loadingUploadFiles: false,
                    })

                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUploadFiles: false
                })
                return throwError(error);
                
            })
        )
    }

}