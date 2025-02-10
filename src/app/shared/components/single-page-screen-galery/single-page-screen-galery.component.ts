import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { MediaUtil } from '../../utils';
import { FullScreenGaleryComponent } from '../full-screen-galery/full-screen-galery.component';
import { MatDialog } from '@angular/material/dialog';
import { SwiperContainer } from 'swiper/element';

@Component({
  selector: 'single-page-screen-galery',
  templateUrl: './single-page-screen-galery.component.html',
  styleUrls: ['./single-page-screen-galery.component.css'],
})
export class SinglePageScreenGaleryComponent implements AfterViewInit, OnChanges{

  @Input() images:string[]=[]
  imagesFound: {url:string,type:'image'|'video'|'panorama'|'unknown'}[] = [];
  @ViewChild('swiper') swiper!: ElementRef<SwiperContainer>;
  @ViewChild('swiperThumbs') swiperThumbs!: ElementRef<SwiperContainer>;

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
  
    constructor(private dialog: MatDialog) { }
  

  initIndex()
  {
    this.imagesFound = [];

  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['images'].currentValue.length==0) this.images = ["assets/img/utils/house.png"]
      
    if(changes['images']) {
      this.initIndex();
      this.images.forEach(async (url)=>{
              let type= await MediaUtil.classifyUrl(url);
              this.imagesFound.push({url,type})
            }) 
    }
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

  ngAfterViewInit() {
    this.swiper.nativeElement.swiper.activeIndex = this.index;
    this.swiperThumbs.nativeElement.swiper.activeIndex = this.index;
  }

  slideChange(swiper: any) {
    this.index = swiper.detail[0].activeIndex;
  }
}
