import { Component, Inject, Input, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { MediaUtil } from '../../utils';

@Component({
  selector: 'full-screen-galery',
  templateUrl: './full-screen-galery.component.html',
  styleUrls: ['./full-screen-galery.component.css'],
  encapsulation:ViewEncapsulation.None

})
export class FullScreenGaleryComponent {
   images: string[] = [];
   imagesFound: {url:string,type:'image'|'video'|'panorama'|'unknown'}[] = [];
    currentIndex: number = 0;
    shouldShowNavSlider=false;
    shouldshowFullScreen=false;
  
    constructor(private dialog: MatDialog,private _store:Store,
          @Inject(MAT_DIALOG_DATA) public data:{medias:string[]},
      
    ) { 
      this.images = data.medias;
      data.medias.forEach(async (url)=>{
        let type= await MediaUtil.classifyUrl(url);
        this.imagesFound.push({url,type})
        console.log("Images Found ",this.imagesFound)
      }) 
      // this.recursivlySlider();
    }
  
    nextSlide(e): void {
      if(e) e.stopPropagation()
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  
    prevSlide(e): void {
      e.stopPropagation()
  
      this.currentIndex =
        (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  
    recursivlySlider()
    {
      setInterval(()=>{
        console.log("Slider")
        this.nextSlide(null)
      },3000)
    }
  
    ngOnChanges(changes: SimpleChanges): void {
        if(changes['images'].currentValue.length==0) this.images = ["assets/img/utils/house.png"]
          
        if(changes['images'].currentValue.length<2) this.shouldShowNavSlider=false;
        else this.shouldShowNavSlider=true;
  
        if(changes['images'].currentValue.length>0) this.shouldshowFullScreen=true;
        this.recursivlySlider()
    }

    closeModal()
    {
      this.dialog.closeAll()
    }
  
    goToSlide(index: number): void {
      this.currentIndex = index;
    }
}
