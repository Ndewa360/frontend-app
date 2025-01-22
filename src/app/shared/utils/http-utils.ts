import {
    HttpEvent,
    HttpEventType,
    HttpResponse,
    HttpProgressEvent,
  } from '@angular/common/http'
import { ApiResultFormat, ApiUploadFileStateFormat } from '../store/global'
import { environment } from 'src/environments/environment'
   
  export function isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
    return event.type === HttpEventType.Response
  }
   
  export function isHttpProgressEvent(
    event: HttpEvent<unknown>
  ): event is HttpProgressEvent {
    return (
      event.type === HttpEventType.DownloadProgress ||
      event.type === HttpEventType.UploadProgress
    )
  }

  export function calculateState<T>(upload: ApiUploadFileStateFormat<ApiResultFormat<T>>, event: HttpEvent<ApiResultFormat<T>>): ApiUploadFileStateFormat<ApiResultFormat<T>> {
    if (isHttpProgressEvent(event)) {
      return {
        progress: event.total
          ? Math.round((100 * event.loaded) / event.total)
          : upload.progress,
        state: 'IN_PROGRESS',
        data:null
      }
    }
    if (isHttpResponse(event)) {

      return {
        progress: 100,
        state: 'DONE',
        data:event.body
      }
    }
    return upload
  }

export function getHttpOfProxyUrl(url:string)
{
  return `${environment.apiUrl}/proxy?url=${encodeURIComponent(url)}`
}