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
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef;
  private viewer: any;

  ngAfterViewInit(): void {
    console.log("Viewer Ref ",this.viewerContainer)
    if(this.urlFile) {
      console.log("Url file  Datas",this.urlFile)
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

      this.viewer.on('load', () => {
        console.log('Panorama chargé avec succès!');
      });
      
      this.viewer.on('error', (error) => {
        console.error('Erreur lors du chargement du panorama:', error);
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
