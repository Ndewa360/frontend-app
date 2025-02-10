import { Component,Input, OnChanges, SimpleChanges, ViewEncapsulation,AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FullScreenGaleryComponent } from '../full-screen-galery/full-screen-galery.component';
import { Store } from '@ngxs/store';
import { SwiperContainer,SwiperSlide } from 'swiper/element';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'slider-component-galery',
  templateUrl: './slider-component-galery.component.html',
  styleUrls: ['./slider-component-galery.component.css'],
  encapsulation: ViewEncapsulation.None

  // encapsulation: 
})
export class SliderComponentGaleryComponent implements AfterViewInit {
  @Input() images: string[] = [];
  @Input() showNavSlider=true;
  shouldshowFullScreen:boolean = false;
  @ViewChild('swiper') swiper!: ElementRef<SwiperContainer>;
  @ViewChild('swiperThumbs') swiperThumbs!: ElementRef<SwiperContainer>;
  SWIPE_ACTION = { LEFT: 'swipeleft', RIGHT: 'swiperight' };


  constructor(private dialog: MatDialog,private _store:Store) { }




  ngOnChanges(changes: SimpleChanges): void {
      if(changes['images'].currentValue.length==0) this.images = ["assets/img/utils/house.png"]
        
      // if(changes['images'].currentValue.length<2) this.shouldShowNavSlider=false;
      // else this.shouldShowNavSlider=true;

      if(changes['images'].currentValue.length>0) this.shouldshowFullScreen=true;
      // this.recursivlySlider()
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

index = 0;

  // Swiper
  swiperConfig = {
    spaceBetween: 10,
    navigation: true,
  };

  swiperThumbsConfig = {
    spaceBetween: 10,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,
  };

  ngAfterViewInit() {
    this.swiper.nativeElement.swiper.activeIndex = this.index;
    this.swiperThumbs.nativeElement.swiper.activeIndex = this.index;
  }

  slideChange(swiper: any) {
    this.index = swiper.detail[0].activeIndex;
  }
}
