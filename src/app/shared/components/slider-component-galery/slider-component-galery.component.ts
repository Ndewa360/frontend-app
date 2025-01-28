import { Component,Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FullScreenGaleryComponent } from '../full-screen-galery/full-screen-galery.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';

@Component({
  selector: 'slider-component-galery',
  templateUrl: './slider-component-galery.component.html',
  styleUrls: ['./slider-component-galery.component.css'],
  encapsulation: ViewEncapsulation.None

  // encapsulation: 
})
export class SliderComponentGaleryComponent implements OnChanges {
  @Input() images: string[] = [];
  @Input() showNavSlider=true;
  currentIndex: number = 0;
  shouldShowNavSlider=false;
  shouldshowFullScreen=false;

  constructor(private dialog: MatDialog,private _store:Store) { }

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

  goToSlide(index: number): void {
    this.currentIndex = index;
  }

  showFullScreenViewer(e)
  {
    e.stopPropagation()
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
