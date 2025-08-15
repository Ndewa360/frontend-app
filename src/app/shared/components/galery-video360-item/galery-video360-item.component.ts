import { AfterViewInit, Component,ElementRef,EventEmitter,Input, OnInit, Output, ViewChild } from '@angular/core';
import { Viewer } from '@photo-sphere-viewer/core';
import { getHttpOfProxyUrl } from '../../utils';
import { Observable } from 'rxjs';
import { UploadFilesState } from '../../store/files-upload';
import { Select } from '@ngxs/store';
// import { getHttpOfProxyUrl } from "src/app/shared"

@Component({
  selector: 'galery-video360-item',
  templateUrl: './galery-video360-item.component.html',
  styleUrls: ['./galery-video360-item.component.css']
})
export class GaleryVideo360ItemComponent implements AfterViewInit, OnInit {
 
  
  @Input() urlFile:string=""
  @Input() isFullScreen=false;
  @Input() isDeleting=false;
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef;
  @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>()
  private viewer: any;
  @Select(UploadFilesState.selectStateLoading) waittingResponse$:Observable<boolean>
  waittingResponse=false;

  ngOnInit(): void {
    this.waittingResponse$.subscribe((value)=>{
      this.waittingResponse=value;
    })
  }

  ngAfterViewInit(): void {
    if(this.urlFile) {
      this.viewer = new Viewer({
        container: this.viewerContainer.nativeElement,//'viewer',
        panorama: getHttpOfProxyUrl(this.urlFile),
        caption: ' <b>Ndewa360 Panoram photo</b>',
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: true,
        navbar: [
          'autorotate',
          'zoom',
          'fullscreen',
          'caption',
        ],
      });
    }
  }

  deleteFile()
  {
    if (this.isDeleting) {
      return; // Empêcher les doubles clics
    }
    this.onDeleteFileEvent.emit(this.urlFile)
  }

  ngOnDestroy(): void {
    // Détruire l'instance pour éviter les fuites de mémoire
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

}
