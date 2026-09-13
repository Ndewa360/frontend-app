import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'how-its-work',
  templateUrl: './how-its-work.component.html',
  styleUrls: ['./how-its-work.component.css'],
  standalone: true,
  imports: [FlexModule, TranslatePipe]
})
export class HowItsWorkComponent {

}
