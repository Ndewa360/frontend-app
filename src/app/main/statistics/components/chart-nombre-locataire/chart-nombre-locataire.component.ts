import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'chart-nombre-locataire',
  templateUrl: './chart-nombre-locataire.component.html',
  styleUrls: ['./chart-nombre-locataire.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class ChartNombreLocataireComponent implements OnInit{
  
  @Input() nbreLocataireTotal:number=100;
  @Input() nbreLocataireActif:number=50;

  ngOnInit(): void {
  }


}
