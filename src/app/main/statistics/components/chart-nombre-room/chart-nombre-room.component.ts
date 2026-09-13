import { Component, Input } from '@angular/core';
import { ChartPieNomnbreComponent } from '../chart-pie-nomnbre/chart-pie-nomnbre.component';

@Component({
  selector: 'chart-nombre-room',
  templateUrl: './chart-nombre-room.component.html',
  styleUrls: ['./chart-nombre-room.component.css'],
  standalone: true,
  imports: [ChartPieNomnbreComponent]
})
export class ChartNombreRoomComponent {
  @Input() nbreRoomTotal: number = 0;
  @Input() nbreRoomActif: number = 0;
}
