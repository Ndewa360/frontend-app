import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionErrored, ofActionSuccessful, Select } from '@ngxs/store';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ApiUploadFileStateFormat, PropertyModel, PropertyState, PropertyAction } from 'src/app/shared/store';
import { FileUploadContentType, UploadFilesAction, UploadFilesState, ContentUploadRoomType } from 'src/app/shared/store/files-upload';
import { MediaUtil } from 'src/app/shared/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video' | '360';
  name?: string;
  size?: number;
  uploadDate?: Date;
}

interface UploadItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'retrying';
  error?: string;
  retryCount: number;
  id: string;
}

@Component({
  selector: 'app-property-gallery',
  templateUrl: './property-gallery.component.html',
  styleUrls: ['./property-gallery.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PropertyGalleryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // États de l'interface
  currentView: 'gallery' | 'upload' = 'gallery';
  selectedTab: 'images' | 'videos' | '360' = 'images';
  isUploading = false;

  // Données des médias
  propertyImages: string[] = [];
  propertyImages360: string[] = [];
  propertyVideos: string[] = [];
  allMediaItems: MediaItem[] = [];

  // Gestion des uploads
  uploadQueue: UploadItem[] = [];
  files: File[] = [];
  shouldResetFiles = false;
  maxRetries = 3;
  
  // Gestion des suppressions
  deletingFiles: Set<string> = new Set();

  // Observables
  @Select(UploadFilesState.selectStateUploadedFiles) files$: Observable<{name:string,state:ApiUploadFileStateFormat<any>}[]>;
  @Select(UploadFilesState.selectStateLoading) isUploadingState$: Observable<boolean>;
  
  constructor(
    private dialogRef: MatDialogRef<PropertyGalleryComponent>,
    protected formBuilder: FormBuilder,
    private _store: Store,
    private _ngxsAction: Actions,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: { property: PropertyModel }
  ) {
    // Empêcher l'ouverture d'autres modals pendant que celui-ci est ouvert
    this.dialogRef.disableClose = true;
  }
  
  
  ngOnInit(): void {
    this.loadMediaData();
    this.setupUploadSubscriptions();
  }

  private loadMediaData(): void {
    this._store.select(PropertyState.selectStateProperty(this.data.property._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (property) => {
        if (property?.medias) {
          const data = await MediaUtil.getStructMedia(property.medias);
          this.propertyImages360 = data.images360;
          this.propertyVideos = data.videos;
          this.propertyImages = data.images;
          this.updateAllMediaItems();
        }
      });
  }

  private updateAllMediaItems(): void {
    this.allMediaItems = [
      ...this.propertyImages.map(url => ({ url, type: 'image' as const })),
      ...this.propertyVideos.map(url => ({ url, type: 'video' as const })),
      ...this.propertyImages360.map(url => ({ url, type: '360' as const }))
    ];
  }

  private refreshMediaData(): void {
    // Utiliser un délai pour éviter les conflits avec les actions en cours
    setTimeout(() => {
      const currentProperty = this._store.selectSnapshot(PropertyState.selectStateProperty(this.data.property._id));
      if (currentProperty?.medias) {
        MediaUtil.getStructMedia(currentProperty.medias).then((data) => {
          this.propertyImages360 = data.images360;
          this.propertyVideos = data.videos;
          this.propertyImages = data.images;
          this.updateAllMediaItems();
          this.cdr.detectChanges();
        }).catch((error) => {
          console.error('❌ Erreur lors du rafraîchissement des médias:', error);
        });
      }
    }, 100);
  }

  private setupUploadSubscriptions(): void {
    // Surveiller l'état des uploads avec délai pour éviter les conflits
    this.files$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((files) => {
      this.updateUploadQueue(files);
      const hasEndUpload = files.every(f => f.state.state === 'DONE');
      if (hasEndUpload && files.length > 0) {
        this.shouldResetFiles = true;
        // Délai plus long pour éviter les conflits avec les actions du store
        setTimeout(() => {
          this.refreshMediaData();
        }, 500);
      }
    });

    // Gérer les succès d'upload avec délai
    this._ngxsAction.pipe(
      ofActionSuccessful(UploadFilesAction.UploadFiles),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      setTimeout(() => {
        this.isUploading = false;
        this.shouldResetFiles = true;
        this.refreshMediaData();
      }, 300);
    });

    // Gérer les erreurs d'upload
    this._ngxsAction.pipe(
      ofActionErrored(UploadFilesAction.UploadFiles),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isUploading = false;
      this.handleUploadError(action);
    });

    // Gérer les succès de suppression avec délai
    this._ngxsAction.pipe(
      ofActionSuccessful(UploadFilesAction.RemoveUploadedFile),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      setTimeout(() => {
        console.log('✅ Fichier supprimé avec succès');
        const fileUrl = action.removedUploadFile?.fileUrl;
        if (fileUrl) {
          this.deletingFiles.delete(fileUrl);
        }
        this.refreshMediaData();
      }, 300);
    });

    // Gérer les erreurs de suppression
    this._ngxsAction.pipe(
      ofActionErrored(UploadFilesAction.RemoveUploadedFile),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      console.error('❌ Erreur lors de la suppression:', action);
      const fileUrl = action.removedUploadFile?.fileUrl;
      if (fileUrl) {
        this.deletingFiles.delete(fileUrl);
      }
    });
  }

  // Méthodes de gestion des uploads
  private updateUploadQueue(files: {name:string,state:ApiUploadFileStateFormat<any>}[]): void {
    files.forEach(file => {
      const existingIndex = this.uploadQueue.findIndex(item => item.file.name === file.name);
      if (existingIndex >= 0) {
        this.uploadQueue[existingIndex].progress = file.state.progress || 0;
        this.uploadQueue[existingIndex].status = this.mapStateToStatus(file.state.state);
      }
    });
  }

  private mapStateToStatus(state: string): UploadItem['status'] {
    switch (state) {
      case 'PENDING': return 'pending';
      case 'UPLOADING': return 'uploading';
      case 'DONE': return 'success';
      case 'ERROR': return 'error';
      default: return 'pending';
    }
  }

  private handleUploadError(action: any): void {
    const fileName = action.uploadFiles?.file?.name;
    if (fileName) {
      const uploadItem = this.uploadQueue.find(item => item.file.name === fileName);
      if (uploadItem && uploadItem.retryCount < this.maxRetries) {
        this.retryUpload(uploadItem);
      }
    }
  }

  private retryUpload(uploadItem: UploadItem): void {
    uploadItem.retryCount++;
    uploadItem.status = 'retrying';

    timer(2000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this._store.dispatch(new UploadFilesAction.UploadFiles({
        file: uploadItem.file,
        contentID: this.data.property._id,
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_PROPERTY
      }));
    });
  }

  // Méthodes publiques
  deleteFile(urlFile: string): void {
    // Empêcher les doubles clics
    if (this.deletingFiles.has(urlFile)) {
      return;
    }
    
    // Marquer le fichier comme en cours de suppression
    this.deletingFiles.add(urlFile);
    
    this._store.dispatch(new UploadFilesAction.RemoveUploadedFile({
      fileUrl: urlFile,
      contentID: this.data.property._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_PROPERTY
    }));

    // Marquer qu'il y a eu des changements
    this.shouldResetFiles = true;
  }
  
  isDeleting(urlFile: string): boolean {
    return this.deletingFiles.has(urlFile);
  }

  close(): void {
    // Vérifier s'il y a eu des modifications de médias
    const hasMediaChanges = this.shouldResetFiles || this.uploadQueue.some(item => item.status === 'success');
    
    // Nettoyer complètement avant de fermer
    this.deletingFiles.clear();
    this.uploadQueue = [];
    this.files = [];
    
    // Nettoyer les subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    
    // Fermer le modal avec un délai pour éviter les conflits
    setTimeout(() => {
      this.dialogRef.close({ 
        mediaUpdated: hasMediaChanges,
        propertyId: this.data.property._id 
      });
    }, 100);
  }

  switchView(view: 'gallery' | 'upload'): void {
    this.currentView = view;
  }

  switchTab(tab: 'images' | 'videos' | '360'): void {
    this.selectedTab = tab;
  }

  updateFileListToUpdate(files: File[]): void {
    this.files = files;
    this.uploadQueue = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      retryCount: 0,
      id: this.generateId()
    }));

    if (files.length === 0) {
      this.shouldResetFiles = false;
      this._store.dispatch(new UploadFilesAction.ResetFileUploaded());
    }
  }

  uploadFiles(): void {
    if (this.files.length === 0) return;

    this.isUploading = true;
    this.files.forEach((file) => {
      this._store.dispatch(new UploadFilesAction.UploadFiles({
        file: file,
        contentID: this.data.property._id,
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_PROPERTY
      }));
    });
  }

  removeFromQueue(uploadItem: UploadItem): void {
    const index = this.uploadQueue.findIndex(item => item.id === uploadItem.id);
    if (index >= 0) {
      this.uploadQueue.splice(index, 1);
      this.files = this.files.filter(file => file.name !== uploadItem.file.name);
    }
  }

  retryFailedUpload(uploadItem: UploadItem): void {
    this.retryUpload(uploadItem);
  }

  getCurrentMediaList(): string[] {
    switch (this.selectedTab) {
      case 'images': return this.propertyImages;
      case 'videos': return this.propertyVideos;
      case '360': return this.propertyImages360;
      default: return [];
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    // Nettoyer toutes les suppressions en cours
    this.deletingFiles.clear();
    // Nettoyer les subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
}