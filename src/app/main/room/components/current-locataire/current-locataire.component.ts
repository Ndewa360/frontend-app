import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { ShowContractComponent } from 'src/app/main/contract/components/show-contract/show-contract.component';
import { UpdateLocataireComponent } from 'src/app/main/locataires/components/update-locataire/update-locataire.component';
import { ModernContractTerminationModalComponent } from 'src/app/main/properties/components/modern-contract-termination-modal/modern-contract-termination-modal.component';
import { LocataireModel, LocataireState, LocationModel, RoomModel } from 'src/app/shared/store';

@Component({
  selector: 'current-locataire',
  templateUrl: './current-locataire.component.html',
  styleUrls: ['./current-locataire.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CurrentLocataireComponent implements OnInit {
  
  @Input() room:RoomModel;
  @Output() onOpenAssignedRoom:EventEmitter<boolean> = new EventEmitter<boolean>();
  isAssignedOpened = false;
  @Input() locataire:LocataireModel;
  @Input() location:LocationModel;

  constructor(
    private _store:Store,
    private dialog: MatDialog,
    private router: Router

  ) {}

  ngOnInit(): void {
    // this._store.select(LocataireState.selectStateLocataire(this.room.locataire)).subscribe((locataire)=>{
    //   this.locataire = locataire;
    // })
    console.log(this.room, this.locataire, this.location);
  }
  
  onClose(event) {
    this.isAssignedOpened = false;
    this.onOpenAssignedRoom.emit(this.isAssignedOpened);
  }

  openEditAddLocataire()
  {
    // Naviguer vers l'assistant d'assignation avec la chambre pré-sélectionnée
    this.router.navigate(['/app/assign-location'], {
      queryParams: {
        propertyId: this.room?.property?._id,
        roomId: this.room?._id,
        assistant: true,
        returnUrl: this.router.url
      }
    });
  }

  rompreLocation()
  {
    this.dialog.open(ModernContractTerminationModalComponent, {
      width: '100%',
      maxWidth: '900px',
      disableClose: true,
      data:{
        location: this.location,
        tenant: this.locataire,
        room: this.room
      }
    })
  }

  updateLocataire() 
  {
    this.dialog.open(UpdateLocataireComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '100%',
      data:{
        locataire:this.locataire
      }
    })
  }

  seeContract()
  {
    this.dialog.open(ShowContractComponent, {
      viewContainerRef:null,
      disableClose: true,
      role: 'alertdialog',
      width: '100%',
      data:{
        location:this.location
      }
    })
  }
}
