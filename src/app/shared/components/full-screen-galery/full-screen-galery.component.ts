import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { MediaUtil } from '../../utils';
// import PhotoSphereViewer from 'photo-sphere-viewer';
import { Viewer as  PhotoSphereViewer} from '@photo-sphere-viewer/core';


@Component({
  selector: 'full-screen-galery',
  templateUrl: './full-screen-galery.component.html',
  styleUrls: ['./full-screen-galery.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class FullScreenGaleryComponent implements OnInit, OnDestroy, AfterViewInit {
  images: string[] = [];
  imagesFound: { url: string; type: 'image' | 'video' | 'panorama' | 'unknown' }[] = [];
  currentIndex = 0;
  shouldShowNavSlider = false;
  shouldshowFullScreen = false;
  private sliderInterval: any;
  isLoading = true;


  @ViewChild('panoramaContainer') panoramaContainer!: ElementRef;
  private panoramaViewer: any;

  // Touch swipe variables
  touchStartX = 0;
  touchEndX = 0;

  constructor(
    private dialog: MatDialog,
    private _store: Store,
    @Inject(MAT_DIALOG_DATA) public data: { medias: string[] }
  ) {
    this.images = data.medias || [];
    data.medias.forEach(async (url) => {
      const type = await MediaUtil.classifyUrl(url);
      this.imagesFound.push({ url, type });
    });
  }

  async ngOnInit(): Promise<void> {
    if (this.images.length === 0) {
      this.images = ['assets/img/utils/house.png'];
    }

    const results = await Promise.all(
      this.images.map(async (url) => {
        const type = await MediaUtil.classifyUrl(url);
        return { url, type };
      })
    );

    this.imagesFound = results;

    this.shouldshowFullScreen = this.images.length > 0;
    this.shouldShowNavSlider = this.images.length > 1;

    this.startSlider();
  }

  ngAfterViewInit(): void {
    this.loadPanoramaIfNeeded();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event): void {
    if (event.key === 'ArrowRight') {
      this.nextSlide(event);
    } else if (event.key === 'ArrowLeft') {
      this.prevSlide(event);
    } else if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  // SWIPE START
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipeGesture();
  }

  handleSwipeGesture() {
    const deltaX = this.touchEndX - this.touchStartX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        this.nextSlide(null);
      } else {
        this.prevSlide(null);
      }
    }
  }

  startSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.nextSlide(null);
    }, 5000);
  }

  nextSlide(e: MouseEvent | null): void {
    if (e) e.stopPropagation();
    //  this.isLoading = true;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.loadPanoramaIfNeeded();
  }

  prevSlide(e: MouseEvent): void {
    e.stopPropagation();
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.loadPanoramaIfNeeded();
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    this.loadPanoramaIfNeeded();
  }

  closeModal(): void {
    this.dialog.closeAll();
  }

  loadPanoramaIfNeeded(): void {
    if (!this.imagesFound.length) return;

    const currentMedia = this.imagesFound[this.currentIndex];

    if (this.panoramaViewer) {
      this.panoramaViewer.destroy();
      this.panoramaViewer = null;
    }

    if (currentMedia.type === 'panorama') {
      setTimeout(() => {
        this.panoramaViewer = new PhotoSphereViewer({
          container: this.panoramaContainer.nativeElement,
          panorama: currentMedia.url,
          navbar: 'zoom move fullscreen',
        });
      }, 0);
    }
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
    if (this.panoramaViewer) {
      this.panoramaViewer.destroy();
    }
  }
}
