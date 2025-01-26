import { AfterViewInit, Component,ElementRef,Input, ViewChild } from '@angular/core';
import { Viewer } from '@photo-sphere-viewer/core';
import { getHttpOfProxyUrl } from '../../utils';
// import { getHttpOfProxyUrl } from "src/app/shared"

@Component({
  selector: 'galery-video360-item',
  templateUrl: './galery-video360-item.component.html',
  styleUrls: ['./galery-video360-item.component.css']
})
export class GaleryVideo360ItemComponent implements AfterViewInit {
  
  @Input() urlFile:string=""
  @Input() isFullScreen=false;
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef;
  private viewer: any;

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

  ngOnDestroy(): void {
    // Détruire l'instance pour éviter les fuites de mémoire
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

}
