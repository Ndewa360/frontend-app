import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'chart-nombre-locataire',
  templateUrl: './chart-nombre-locataire.component.html',
  styleUrls: ['./chart-nombre-locataire.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class ChartNombreLocataireComponent {
  @Input() nbreLocataireTotal: number = 0;
  @Input() nbreLocataireActif: number = 0;
}
