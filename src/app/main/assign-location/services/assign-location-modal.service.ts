import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AssignLocationComponent } from '../assign-location/assign-location.component';
import { PropertyModel, RoomModel, LocataireModel } from 'src/app/shared/store';

export interface AssignLocationModalData {
  propertyId?: string;
  roomId?: string;
  locataireId?: string;
  assistant?: boolean;
  returnUrl?: string;
  property?: PropertyModel;
  roomSelected?: RoomModel;
  locataireSelected?: LocataireModel;
}

export interface AssignLocationModalResult {
  success: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AssignLocationModalService {

  constructor(private dialog: MatDialog) { }

  /**
   * Ouvre le modal d'assignation de locataire
   * @param data Données pour pré-remplir le modal
   * @returns Observable du résultat du modal
   */
  openAssignLocationModal(data: AssignLocationModalData): Observable<AssignLocationModalResult> {
    const dialogRef: MatDialogRef<AssignLocationComponent, AssignLocationModalResult> = this.dialog.open(
      AssignLocationComponent,
      {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'assign-location-modal-container',
        disableClose: false,
        hasBackdrop: true,
        backdropClass: 'assign-location-modal-backdrop',
        data: data
      }
    );

    return dialogRef.afterClosed();
  }

  /**
   * Ferme tous les modals d'assignation ouverts
   */
  closeAllAssignLocationModals(): void {
    this.dialog.closeAll();
  }
}
