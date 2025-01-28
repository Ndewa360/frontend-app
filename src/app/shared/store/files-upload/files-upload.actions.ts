import { RemovedUploadFileModel, UploadFilesModel } from "./files-upload.model";


export namespace UploadFilesAction
{
    //Create
    export class UploadFiles
    {
        static readonly type = '[FilesUpload] Files upload';
        constructor(public uploadFiles:UploadFilesModel){}
    }

    export class ResetFileUploaded
    {
        static readonly type = '[FilesUpload] Rest Files upload';
        constructor(){}
    }

    export class RemoveUploadedFile 
    {
        static readonly type = '[FilesUpload] Remove Uploaded File';
        constructor(public removedUploadFile:RemovedUploadFileModel){}
    }
    
}
