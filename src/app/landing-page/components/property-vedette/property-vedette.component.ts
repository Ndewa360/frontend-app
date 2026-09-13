import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'property-vedette',
  templateUrl: './property-vedette.component.html',
  styleUrls: ['./property-vedette.component.css'],
  standalone: true,
  imports: [FlexModule, TranslatePipe]
})
export class PropertyVedetteComponent {

}
