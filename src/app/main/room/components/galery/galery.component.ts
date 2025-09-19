import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionErrored, ofActionSuccessful, Select } from '@ngxs/store';
import { Observable, Subject, timer, of } from 'rxjs';
import { takeUntil, switchMap, catchError, take } from 'rxjs/operators';
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
  encapsulation: ViewEncapsulation.Emulated,
})
export class GaleryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // États de l'interface
  currentView: 'gallery' | 'upload' = 'gallery';
  selectedTab: 'images' | 'videos' | '360' = 'images';
  isUploading = false;
  isLoadingMedia = true;

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
    console.log('📷 Initialisation de la galerie avec room:', this.data.room);
    
    // Initialisation directe avec les données de la room
    this.initializeDirectData();
    
    // Chargement depuis le store
    this.loadMediaData();
    this.setupUploadSubscriptions();
  }
  
  private async initializeDirectData(): Promise<void> {
    if (this.data.room?.medias && this.data.room.medias.length > 0) {
      console.log('📷 Initialisation directe avec', this.data.room.medias.length, 'médias');
      try {
        const result = await MediaUtil.getStructMedia(this.data.room.medias);
        console.log('📷 Résultat initialisation directe:', result);
        
        this.roomSelectedImages360 = result.images360;
        this.roomSelectedVideos = result.videos;
        this.roomSelectedImages = result.images;
        this.updateAllMediaItems();
        this.isLoadingMedia = false;
        this.cdr.detectChanges();
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation directe:', error);
      }
    } else {
      console.log('📷 Aucun média dans les données directes de la room');
      this.isLoadingMedia = false;
      this.cdr.detectChanges();
    }
  }

  private loadMediaData(): void {
    console.log('📷 Chargement des médias pour la room:', this.data.room._id);
    console.log('📷 Médias existants:', this.data.room.medias);
    
    this._store.select(RoomState.selectStateRoom(this.data.room._id))
      .pipe(
        takeUntil(this.destroy$),
        switchMap(async (room) => {
          console.log('📷 Room récupérée du store:', room);
          
          if (room?.medias && room.medias.length > 0) {
            console.log('📷 Traitement de', room.medias.length, 'médias');
            try {
              const result = await MediaUtil.getStructMedia(room.medias);
              console.log('📷 Médias classés:', result);
              return result;
            } catch (error) {
              console.error('❌ Erreur lors du traitement des médias:', error);
              return { images: [], videos: [], images360: [] };
            }
          }
          
          console.log('📷 Aucun média trouvé pour cette room');
          return { images: [], videos: [], images360: [] };
        }),
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des médias:', error);
          return of({ images: [], videos: [], images360: [] });
        })
      )
      .subscribe((data) => {
        console.log('📷 Données finales reçues:', data);
        this.roomSelectedImages360 = data.images360;
        this.roomSelectedVideos = data.videos;
        this.roomSelectedImages = data.images;
        this.updateAllMediaItems();
        this.isLoadingMedia = false;
        this.cdr.detectChanges(); // Force la détection des changements
      });
  }

  private updateAllMediaItems(): void {
    this.allMediaItems = [
      ...this.roomSelectedImages.map(url => ({ url, type: 'image' as const })),
      ...this.roomSelectedVideos.map(url => ({ url, type: 'video' as const })),
      ...this.roomSelectedImages360.map(url => ({ url, type: '360' as const }))
    ];
    console.log('📷 Tous les médias mis à jour:', this.allMediaItems);
    console.log('📷 Images:', this.roomSelectedImages.length);
    console.log('📷 Vidéos:', this.roomSelectedVideos.length);
    console.log('📷 360°:', this.roomSelectedImages360.length);
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
      this.hasSuccessfulUploads = true;
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
      const sanitizedError = JSON.stringify(action).replace(/[\r\n]/g, ' ');
      console.error('❌ Erreur lors de la suppression:', sanitizedError);
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
      } else {
        // Créer un nouvel élément pour les fichiers non trouvés
        const newUploadItem: UploadItem = {
          file: new File([], file.name),
          progress: file.state.progress || 0,
          status: this.mapStateToStatus(file.state.state),
          retryCount: 0,
          id: this.generateId()
        };
        this.uploadQueue.push(newUploadItem);
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
  }
  
  isDeleting(urlFile: string): boolean {
    return this.deletingFiles.has(urlFile);
  }

  // Tracker pour les uploads réussis
  private hasSuccessfulUploads = false;

  close(): void {
    // Vérifier s'il y a eu des modifications de médias
    const hasMediaChanges = this.shouldResetFiles || this.hasSuccessfulUploads;
    
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
    
    // Upload par batch pour éviter de surcharger le store
    const batchSize = 3;
    let currentIndex = 0;
    
    const uploadBatch = () => {
      const batch = this.files.slice(currentIndex, currentIndex + batchSize);
      
      batch.forEach((file) => {
        this._store.dispatch(new UploadFilesAction.UploadFiles({
          file: file,
          contentID: this.data.room._id,
          contentType: FileUploadContentType.FOR_ROOM_FILE,
          contentRoomType: ContentUploadRoomType.FOR_ROOM
        }));
      });
      
      currentIndex += batchSize;
      
      if (currentIndex < this.files.length) {
        setTimeout(() => uploadBatch(), 500);
      }
    };
    
    uploadBatch();
  }

  removeFromQueue(uploadItem: UploadItem): void {
    const index = this.uploadQueue.findIndex(item => item.id === uploadItem.id);
    if (index >= 0) {
      this.uploadQueue.splice(index, 1);
      // Utiliser l'ID unique plutôt que le nom pour éviter les conflits
      this.files = this.files.filter((file, fileIndex) => {
        const fileUploadItem = this.uploadQueue.find(item => item.file === file);
        return fileUploadItem?.id !== uploadItem.id;
      });
    }
  }

  retryUpload(uploadItem: UploadItem): void {
    // Empêcher les tentatives multiples simultanées
    if (uploadItem.status === 'retrying') {
      return;
    }
    
    uploadItem.retryCount++;
    uploadItem.status = 'retrying';

    timer(2000).pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(() => {
      this._store.dispatch(new UploadFilesAction.UploadFiles({
        file: uploadItem.file,
        contentID: this.data.room._id,
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
      }));
    });
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
