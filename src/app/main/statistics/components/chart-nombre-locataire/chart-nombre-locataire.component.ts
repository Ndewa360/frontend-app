import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ChartPieNomnbreComponent } from '../chart-pie-nomnbre/chart-pie-nomnbre.component';

@Component({
  selector: 'chart-nombre-locataire',
  templateUrl: './chart-nombre-locataire.component.html',
  styleUrls: ['./chart-nombre-locataire.component.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [ChartPieNomnbreComponent]
})
export class ChartNombreLocataireComponent {
  @Input() nbreLocataireTotal: number = 0;
  @Input() nbreLocataireActif: number = 0;
}
