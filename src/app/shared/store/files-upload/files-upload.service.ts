import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient, HttpEvent } from "@angular/common/http";
import { Observable,  } from "rxjs";
import { ApiResultFormat, ApiUploadFileStateFormat } from "../global";
import { UploadFilesModel } from "./files-upload.model";

@Injectable({
    providedIn:'root'
})
export class UploadFilesService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    ){}

    /**
     * Create upload
     */
    uploadFiles(uploadedFiles:UploadFilesModel):Observable<HttpEvent<any>>
    {
        let formData = new FormData();
        for ( var key in uploadedFiles ) formData.append(key, uploadedFiles[key])

        return this._httpClient.post(`${environment.apiUrl}/upload/post`, formData,
            { 
                reportProgress: true,
                observe: 'events'
            }
        )
    }

    
}