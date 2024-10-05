import { Component, Input } from '@angular/core';

@Component({
  selector: 'chart-nombre-room',
  templateUrl: './chart-nombre-room.component.html',
  styleUrls: ['./chart-nombre-room.component.css']
})
export class ChartNombreRoomComponent {
  @Input() nbreRoomTotal:number=100;
  @Input() nbreRoomActif:number=50;

  ngOnInit(): void {
  }
}
