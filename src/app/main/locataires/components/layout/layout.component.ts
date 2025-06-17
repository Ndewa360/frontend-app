import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { HistoryLocationPaymentModel, LocataireModel, LocationModel, RoomModel } from 'src/app/shared/store';

@Component({
  selector: 'layout-locataire',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LayoutComponent {
  @Input() locataire: LocataireModel;
  @Input() room:RoomModel;
  @Input()  historyLocationPayments: HistoryLocationPaymentModel[] = [];
  @Input() location: LocationModel
  @Output() onOpenAssignedRoom:EventEmitter<boolean> = new EventEmitter<boolean>();
}
