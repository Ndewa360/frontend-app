import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionErrored, ofActionSuccessful, Select } from '@ngxs/store';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiUploadFileStateFormat, RoomModel, RoomState } from 'src/app/shared/store';
import { RoomAction } from 'src/app/shared/store';
import { FileUploadContentType, UploadFilesAction, UploadFilesState,ContentUploadRoomType  } from 'src/app/shared/store/files-upload';
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
  selector: 'galery',
  templateUrl: './galery.component.html',
  styleUrls: ['./galery.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class GaleryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // États de l'interface
  currentView: 'gallery' | 'upload' = 'gallery';
  selectedTab: 'images' | 'videos' | '360' = 'images';
  isUploading = false;

  // Données des médias
  roomSelectedImages: string[] = [];
  roomSelectedImages360: string[] = [];
  roomSelectedVideos: string[] = [];
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
    private dialogRef: MatDialogRef<GaleryComponent>,
    protected formBuilder: FormBuilder,
    private _store: Store,
    private _ngxsAction: Actions,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { room: RoomModel }
  ) {}
  
  
  ngOnInit(): void {
    this.loadMediaData();
    this.setupUploadSubscriptions();
  }

  private loadMediaData(): void {
    this._store.select(RoomState.selectStateRoom(this.data.room._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (room) => {
        if (room?.medias) {
          const data = await MediaUtil.getStructMedia(room.medias);
          this.roomSelectedImages360 = data.images360;
          this.roomSelectedVideos = data.videos;
          this.roomSelectedImages = data.images;
          this.updateAllMediaItems();
        }
      });
  }

  private updateAllMediaItems(): void {
    this.allMediaItems = [
      ...this.roomSelectedImages.map(url => ({ url, type: 'image' as const })),
      ...this.roomSelectedVideos.map(url => ({ url, type: 'video' as const })),
      ...this.roomSelectedImages360.map(url => ({ url, type: '360' as const }))
    ];
  }

  private setupUploadSubscriptions(): void {
    // Surveiller l'état des uploads
    this.files$.pipe(takeUntil(this.destroy$)).subscribe((files) => {
      this.updateUploadQueue(files);
      const hasEndUpload = files.every(f => f.state.state === 'DONE');
      if (hasEndUpload && files.length > 0) {
        this.shouldResetFiles = true;
        this.loadMediaData(); // Recharger les médias après upload
      }
    });

    // Gérer les succès d'upload
    this._ngxsAction.pipe(
      ofActionSuccessful(UploadFilesAction.UploadFiles),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isUploading = false;
      // Recharger les données de la room depuis le serveur
      this._store.dispatch(new RoomAction.FetchRoom(this.data.room._id));
    });

    // Gérer les erreurs d'upload
    this._ngxsAction.pipe(
      ofActionErrored(UploadFilesAction.UploadFiles),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isUploading = false;
      this.handleUploadError(action);
    });

    // Gérer les succès de suppression
    this._ngxsAction.pipe(
      ofActionSuccessful(UploadFilesAction.RemoveUploadedFile),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('✅ Fichier supprimé avec succès');
      // Recharger les données de la room depuis le serveur
      this._store.dispatch(new RoomAction.FetchRoom(this.data.room._id));
    });

    // Gérer les erreurs de suppression
    this._ngxsAction.pipe(
      ofActionErrored(UploadFilesAction.RemoveUploadedFile),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      console.error('❌ Erreur lors de la suppression:', action);
      // Retirer le fichier de la liste des suppressions en cours en cas d'erreur
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
        contentID: this.data.room._id,
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
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
      contentID: this.data.room._id,
      contentType: FileUploadContentType.FOR_ROOM_FILE,
      contentRoomType: ContentUploadRoomType.FOR_ROOM
    }));

    // Marquer qu'il y a eu des changements
    this.shouldResetFiles = true;

    // Recharger les médias après suppression
    setTimeout(() => {
      this.loadMediaData();
      // Retirer le fichier de la liste des suppressions en cours
      this.deletingFiles.delete(urlFile);
    }, 1000);
  }
  
  isDeleting(urlFile: string): boolean {
    return this.deletingFiles.has(urlFile);
  }

  close(): void {
    // Vérifier s'il y a eu des modifications de médias
    const hasMediaChanges = this.shouldResetFiles || this.uploadQueue.some(item => item.status === 'success');
    
    // Notifier que des médias ont été modifiés si nécessaire
    this.dialogRef.close({ 
      mediaUpdated: hasMediaChanges,
      roomId: this.data.room._id 
    });
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
        contentID: this.data.room._id,
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
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
      case 'images': return this.roomSelectedImages;
      case 'videos': return this.roomSelectedVideos;
      case '360': return this.roomSelectedImages360;
      default: return [];
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
