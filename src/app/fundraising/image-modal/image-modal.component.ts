import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

export interface GalleryImage {
  src: string;
  title: string;
  description: string;
}

export interface ImageModalData {
  images: GalleryImage[];
  currentIndex: number;
}

@Component({
  selector: 'app-image-modal',
  template: `
    <div class="image-gallery">
      <!-- Header avec navigation -->
      <div class="gallery-header bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <h2 class="text-xl font-bold">{{ currentImage?.title || ('IMAGE_GALLERY.DEFAULT_IMAGE_TITLE' | translate) }}</h2>
          <span class="text-sm bg-white/20 px-3 py-1 rounded-full">
            {{ currentIndex + 1 }} / {{ data?.images?.length || 0 }}
          </span>
        </div>
        <button (click)="close()" class="close-btn" [title]="'IMAGE_GALLERY.CLOSE_GALLERY' | translate">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Image principale avec navigation -->
      <div class="gallery-main relative bg-gray-100">
        <!-- Image -->
        <div class="image-container">
          <img [src]="currentImage?.src" 
               [alt]="currentImage?.title" 
               class="gallery-image">
        </div>
        
        <!-- Navigation comme dans unit-detail-dialog -->
        <div *ngIf="data?.images && data.images.length > 1" class="slider-controls">
          <button (click)="previousImage()" 
                  class="slider-btn slider-btn-prev" 
                  type="button"
                  [title]="'IMAGE_GALLERY.PREVIOUS_IMAGE' | translate">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button (click)="nextImage()" 
                  class="slider-btn slider-btn-next" 
                  type="button"
                  [title]="'IMAGE_GALLERY.NEXT_IMAGE' | translate">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <!-- Description -->
      <div class="gallery-footer bg-gradient-to-r from-gray-50 to-orange-50 p-6 border-t">
        <div class="max-w-4xl mx-auto text-center">
          <p class="text-gray-800 text-lg leading-relaxed">{{ currentImage?.description || ('IMAGE_GALLERY.NO_DESCRIPTION_AVAILABLE' | translate) }}</p>
        </div>
      </div>
      
      <!-- Miniatures -->
      <div *ngIf="data?.images && data.images.length > 1" class="gallery-thumbnails bg-white p-4 border-t">
        <div class="flex space-x-2 overflow-x-auto">
          <button *ngFor="let image of data.images; let i = index" 
                  (click)="goToImage(i)"
                  [class.ring-2]="i === currentIndex"
                  [class.ring-orange-500]="i === currentIndex"
                  class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-300 transition-all">
            <img [src]="image.src" [alt]="image.title" class="w-full h-full object-cover">
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-gallery {
      width: 98vw;
      height: 98vh;
      overflow: hidden;
      border-radius: 16px;
      background: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
    }
    .gallery-thumbnails {
      max-height: 120px;
    }
    .gallery-main {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      overflow: hidden;
    }
    
    .image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      flex: 1;
      width: 100%;
      overflow: hidden;
    }
    
    .gallery-image {
      max-width: calc(100% - 40px);
      max-height: calc(100% - 40px);
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    /* Styles des boutons de navigation comme unit-detail-dialog */
    .slider-controls {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
    }
    
    .slider-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      pointer-events: auto;
      backdrop-filter: blur(4px);
      z-index: 20;
    }
    
    .slider-btn:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: translateY(-50%) scale(1.1);
    }
    
    .slider-btn-prev {
      left: 16px;
    }
    
    .slider-btn-next {
      right: 16px;
    }
    
    .slider-btn i {
      font-size: 18px;
    }
    
    /* Style du bouton de fermeture */
    .close-btn {
      background: rgba(0, 0, 0, 0.6);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    
    .close-btn:hover {
      background: rgba(220, 38, 38, 0.8);
      transform: scale(1.1);
    }
    
    .close-btn i {
      font-size: 18px;
    }
  `]
})
export class ImageModalComponent {
  currentIndex: number;
  
  constructor(
    public dialogRef: MatDialogRef<ImageModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModalData,
    private translate: TranslateService
  ) {
    console.log('Modal data received:', data);
    this.currentIndex = data?.currentIndex || 0;
  }
  
  get currentImage(): GalleryImage | null {
    return this.data?.images?.[this.currentIndex] || null;
  }
  
  nextImage(): void {
    if (this.data?.images?.length) {
      this.currentIndex = (this.currentIndex + 1) % this.data.images.length;
    }
  }
  
  previousImage(): void {
    if (this.data?.images?.length) {
      this.currentIndex = this.currentIndex === 0 ? this.data.images.length - 1 : this.currentIndex - 1;
    }
  }
  
  goToImage(index: number): void {
    this.currentIndex = index;
  }

  close(): void {
    this.dialogRef.close();
  }
}