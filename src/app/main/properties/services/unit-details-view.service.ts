import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoomModel } from 'src/app/shared/store';

export type ViewMode = 'sidebar' | 'modal' | 'overlay';

export interface UnitDetailsViewState {
  isOpen: boolean;
  selectedRoom: RoomModel | null;
  viewMode: ViewMode;
}

@Injectable({
  providedIn: 'root'
})
export class UnitDetailsViewService {
  private viewStateSubject = new BehaviorSubject<UnitDetailsViewState>({
    isOpen: false,
    selectedRoom: null,
    viewMode: this.getInitialViewMode()
  });

  public viewState$: Observable<UnitDetailsViewState> = this.viewStateSubject.asObservable();

  constructor() {
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', () => {
      this.updateViewMode();
    });
  }

  private getInitialViewMode(): ViewMode {
    const width = window.innerWidth;
    
    if (width < 768) {
      return 'modal'; // Mobile : Modal plein écran
    } else if (width < 1024) {
      return 'overlay'; // Tablet : Overlay partiel
    } else {
      return 'sidebar'; // Desktop : Panneau latéral
    }
  }

  private updateViewMode(): void {
    const currentState = this.viewStateSubject.value;
    const newViewMode = this.getInitialViewMode();
    
    if (currentState.viewMode !== newViewMode) {
      this.viewStateSubject.next({
        ...currentState,
        viewMode: newViewMode
      });
    }
  }

  openUnitDetails(room: RoomModel): void {
    this.viewStateSubject.next({
      isOpen: true,
      selectedRoom: room,
      viewMode: this.getInitialViewMode()
    });
  }

  closeUnitDetails(): void {
    this.viewStateSubject.next({
      isOpen: false,
      selectedRoom: null,
      viewMode: this.viewStateSubject.value.viewMode
    });
  }

  selectRoom(room: RoomModel): void {
    const currentState = this.viewStateSubject.value;
    this.viewStateSubject.next({
      ...currentState,
      selectedRoom: room,
      isOpen: true
    });
  }

  getCurrentState(): UnitDetailsViewState {
    return this.viewStateSubject.value;
  }

  isOpen(): boolean {
    return this.viewStateSubject.value.isOpen;
  }

  getSelectedRoom(): RoomModel | null {
    return this.viewStateSubject.value.selectedRoom;
  }

  getViewMode(): ViewMode {
    return this.viewStateSubject.value.viewMode;
  }

  /**
   * Met à jour les données de l'unité sélectionnée
   */
  updateSelectedRoom(updatedRoom: RoomModel): void {
    const currentState = this.viewStateSubject.value;
    if (currentState.selectedRoom && currentState.selectedRoom._id === updatedRoom._id) {
      this.viewStateSubject.next({
        ...currentState,
        selectedRoom: updatedRoom
      });
    }
  }

  /**
   * Force la mise à jour de l'unité sélectionnée avec de nouvelles données
   */
  refreshSelectedRoom(room: RoomModel): void {
    const currentState = this.viewStateSubject.value;
    if (currentState.isOpen && currentState.selectedRoom?._id === room._id) {
      this.viewStateSubject.next({
        ...currentState,
        selectedRoom: room
      });
    }
  }
}
