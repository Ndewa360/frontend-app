import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-mobile-media-gallery',
  templateUrl: './mobile-media-gallery.component.html',
  styleUrls: ['./mobile-media-gallery.component.scss']
})
export class MobileMediaGalleryComponent {
  @Input() media: any[] = [];
  @Output() mediaChange = new EventEmitter<any[]>();

  addMedia(): void {
    // TODO: Implémenter l'ajout de média
    console.log('Ajouter média');
  }

  removeMedia(item: any): void {
    const index = this.media.indexOf(item);
    if (index > -1) {
      this.media.splice(index, 1);
      this.mediaChange.emit(this.media);
    }
  }

  trackByMediaId(index: number, item: any): string {
    return item.id || index.toString();
  }
}
