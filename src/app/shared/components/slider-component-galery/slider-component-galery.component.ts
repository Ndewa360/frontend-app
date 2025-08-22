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
  // @ViewChild('swiperThumbs') swiperThumbs!: ElementRef<SwiperContainer>;
  SWIPE_ACTION = { LEFT: 'swipeleft', RIGHT: 'swiperight' };

  constructor(private dialog: MatDialog,private _store:Store) { }

  ngOnChanges(changes: SimpleChanges): void {
      if(changes['images'].currentValue.length==0) this.images = ["assets/img/utils/house.png"]
        
      if(changes['images'].currentValue.length>0) {
        this.shouldshowFullScreen=true;
        // Précharger toutes les images
        this.preloadImages(changes['images'].currentValue);
      }
  }

  private preloadImages(imageUrls: string[]): void {
    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
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
    lazy: false,
    preloadImages: true,
    updateOnImagesReady: true,
    watchSlidesProgress: true,
    observer: true,
    observeParents: true,
    centeredSlides: false,
    slidesPerView: 1,
    effect: 'slide',
    speed: 300
  };

  swiperThumbsConfig = {
    spaceBetween: 10,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,
  };

  ngAfterViewInit() {
    // Délai pour s'assurer que Swiper est complètement initialisé
    setTimeout(() => {
      if (this.swiper?.nativeElement?.swiper) {
        this.swiper.nativeElement.swiper.activeIndex = this.index;
        this.swiper.nativeElement.swiper.update();
      }
    }, 100);
  }

  slideChange(swiper: any) {
    this.index = swiper.detail[0].activeIndex;
    // Forcer le rechargement de l'image active
    setTimeout(() => {
      if (this.swiper?.nativeElement?.swiper) {
        this.swiper.nativeElement.swiper.update();
      }
    }, 50);
  }

  trackByUrl(index: number, item: string): string {
    return item;
  }

  onImageError(event: any): void {
    console.error('Erreur de chargement d\'image:', event.target.src);
    event.target.src = 'assets/img/utils/house.png';
  }

  onImageLoad(event: any): void {
    console.log('Image chargée:', event.target.src);
    // Forcer la mise à jour du swiper après chargement d'image
    if (this.swiper?.nativeElement?.swiper) {
      this.swiper.nativeElement.swiper.update();
    }
  }
}
