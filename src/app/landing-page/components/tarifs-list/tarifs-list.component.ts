import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'carbon-components-angular/button';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'tarifs-list',
  templateUrl: './tarifs-list.component.html',
  styleUrls: ['./tarifs-list.component.css'],
  standalone: true,
  imports: [FlexModule, ButtonModule, RouterLink, TranslatePipe]
})
export class TarifsListComponent {

}
