import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoomModel } from 'src/app/shared/store';

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'video360';
  name?: string;
  size?: number;
  uploadDate?: Date;
}

interface MediaFilter {
  type: string;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-unit-gallery-tab',
  templateUrl: './unit-gallery-tab.component.html',
  styleUrls: ['./unit-gallery-tab.component.scss']
})
export class UnitGalleryTabComponent implements OnInit, OnDestroy {
  @Input() room: RoomModel | null = null;
  @Output() mediaUpdated = new EventEmitter<any>();

  mediaItems: MediaItem[] = [];
  filteredMedia: MediaItem[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  activeFilter: string = 'all';
  waittingResponse: boolean = false;
  
  mediaFilters: MediaFilter[] = [
    { type: 'all', label: 'Tous', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', count: 0 },
    { type: 'image', label: 'Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', count: 0 },
    { type: 'video', label: 'Vidéos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', count: 0 },
    { type: 'video360', label: 'Vidéos 360°', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', count: 0 }
  ];

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadMediaItems();
    this.updateFilterCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMediaItems(): void {
    if (!this.room?.medias) {
      this.mediaItems = [];
      this.filteredMedia = [];
      return;
    }

    // Convertir les URLs des médias en objets MediaItem
    this.mediaItems = this.room.medias.map(url => this.createMediaItem(url));
    this.applyFilter();
  }

  private createMediaItem(url: string): MediaItem {
    // Déterminer le type de média basé sur l'extension ou le contenu
    const type = this.determineMediaType(url);
    
    return {
      url,
      type,
      name: this.extractFileName(url),
      uploadDate: new Date() // TODO: Récupérer la vraie date depuis les métadonnées
    };
  }

  private determineMediaType(url: string): 'image' | 'video' | 'video360' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    // Vérifier si c'est une vidéo 360° (basé sur le nom du fichier ou des métadonnées)
    if (url.includes('360') || url.includes('vr')) {
      return 'video360';
    }
    
    // Extensions vidéo
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'video';
    }
    
    // Par défaut, considérer comme une image
    return 'image';
  }

  private extractFileName(url: string): string {
    return url.split('/').pop() || 'Fichier sans nom';
  }

  private updateFilterCounts(): void {
    const counts = {
      all: this.mediaItems.length,
      image: this.mediaItems.filter(m => m.type === 'image').length,
      video: this.mediaItems.filter(m => m.type === 'video').length,
      video360: this.mediaItems.filter(m => m.type === 'video360').length
    };

    this.mediaFilters.forEach(filter => {
      filter.count = counts[filter.type as keyof typeof counts] || 0;
    });
  }

  setActiveFilter(filterType: string): void {
    this.activeFilter = filterType;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredMedia = [...this.mediaItems];
    } else {
      this.filteredMedia = this.mediaItems.filter(media => media.type === this.activeFilter);
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getImageCount(): number {
    return this.mediaItems.filter(m => m.type === 'image').length;
  }

  getVideoCount(): number {
    return this.mediaItems.filter(m => m.type === 'video').length;
  }

  get360VideoCount(): number {
    return this.mediaItems.filter(m => m.type === 'video360').length;
  }

  getTotalMediaCount(): number {
    return this.mediaItems.length;
  }

  getMediaTypeLabel(type: string): string {
    switch (type) {
      case 'image': return 'Image';
      case 'video': return 'Vidéo';
      case 'video360': return '360°';
      default: return 'Média';
    }
  }

  openUploadModal(): void {
    console.log('Ouvrir le modal d\'upload');
    // TODO: Implémenter l'ouverture du modal d'upload
  }

  openMediaViewer(media: MediaItem): void {
    console.log('Ouvrir le visualiseur de média:', media);
    // TODO: Implémenter l'ouverture du visualiseur plein écran
  }

  downloadMedia(media: MediaItem): void {
    console.log('Télécharger le média:', media);
    // TODO: Implémenter le téléchargement
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.name || 'media';
    link.click();
  }

  deleteMedia(media: MediaItem): void {
    console.log('Supprimer le média:', media);
    // TODO: Implémenter la suppression avec confirmation
    if (confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      this.mediaItems = this.mediaItems.filter(m => m.url !== media.url);
      this.applyFilter();
      this.updateFilterCounts();
      this.mediaUpdated.emit({ action: 'delete', media });
    }
  }

  trackByMediaUrl(index: number, media: MediaItem): string {
    return media.url;
  }

  // Méthodes pour la grille en colonnes (style des composants existants)
  getColumnSizeArray(): number[] {
    return [0, 1, 2, 3]; // 4 colonnes
  }

  getElementOfColumn(columnIndex: number): MediaItem[] {
    return this.filteredMedia.filter((_, index) => index % 4 === columnIndex);
  }
}
