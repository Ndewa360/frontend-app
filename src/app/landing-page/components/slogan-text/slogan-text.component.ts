import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'slogan-text',
  templateUrl: './slogan-text.component.html',
  styleUrls: ['./slogan-text.component.css'],
  standalone: true,
  imports: [FlexModule, TranslatePipe]
})
export class SloganTextComponent {

}
