import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CountUpDirective } from '../../../shared/directives/counter-up/counter-up.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal/scroll-reveal.directive';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'show-number',
  templateUrl: './show-number.component.html',
  styleUrls: ['./show-number.component.css'],
  standalone: true,
  imports: [FlexModule, ScrollRevealDirective, CountUpDirective, TranslatePipe]
})
export class ShowNumberComponent {

}
