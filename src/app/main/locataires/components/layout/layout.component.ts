import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { HistoryLocationPaymentModel, LocataireModel, LocationModel, RoomModel } from 'src/app/shared/store';



@Component({
  selector: 'layout-locataire',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LayoutComponent {
  @Input() locataire: LocataireModel=null;
  @Input() room:RoomModel=null;
  @Input()  historyLocationPayments: HistoryLocationPaymentModel[] = [];
  @Input() location: LocationModel=null
  @Output() onOpenAssignedRoom:EventEmitter<boolean> = new EventEmitter<boolean>();

  
  openAssignedRoom(event) {
    this.onOpenAssignedRoom.emit(event);
  }

}
