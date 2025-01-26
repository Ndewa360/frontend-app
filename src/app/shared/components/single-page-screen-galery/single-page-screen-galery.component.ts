import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MediaUtil } from '../../utils';
import { FullScreenGaleryComponent } from '../full-screen-galery/full-screen-galery.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'single-page-screen-galery',
  templateUrl: './single-page-screen-galery.component.html',
  styleUrls: ['./single-page-screen-galery.component.css'],
})
export class SinglePageScreenGaleryComponent implements OnChanges{

  @Input() images:string[]=[]
  imagesFound: {url:string,type:'image'|'video'|'panorama'|'unknown'}[] = [];

  currentIndex: number = 0; // Image principale actuellement affichée
  currentStartIndex: number = 0; // Index de début des miniatures visibles
  thumbnailsPerPage: number = 5; // Nombre maximum de miniatures visibles

    constructor(private dialog: MatDialog) { }
  
  // Renvoie les miniatures visibles
  get visibleThumbnails(): {url:string,type:'image'|'video'|'panorama'|'unknown'}[] {
    return this.imagesFound.slice(
      this.currentStartIndex,
      this.currentStartIndex + this.thumbnailsPerPage
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['images'].currentValue.length==0) this.images = ["assets/img/utils/house.png"]
      
    if(changes['images']) {
      this.images.forEach(async (url)=>{
              let type= await MediaUtil.classifyUrl(url);
              this.imagesFound.push({url,type})
              console.log("Images Found ",this.imagesFound)
            }) 
    }
  }
  // Sélectionner une image depuis les miniatures
  selectImage(index: number): void {
    this.currentIndex = index;
  }

  // Naviguer vers les miniatures précédentes
  prevThumbnails(): void {
    if(this.currentStartIndex!=0) this.currentStartIndex--;
  }

  // Naviguer vers les miniatures suivantes
  nextThumbnails(): void {
    this.currentStartIndex = (this.currentStartIndex+1)%this.images.length
    
  }

  showFullScreenViewer()
  {
    this.dialog.open(FullScreenGaleryComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'dialog',
      height: '100%',
      width: '100%',
      data:{
        medias:this.images
      }
    })
  }
}
