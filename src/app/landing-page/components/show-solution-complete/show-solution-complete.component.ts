import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'show-solution-complete',
  templateUrl: './show-solution-complete.component.html',
  styleUrls: ['./show-solution-complete.component.css'],
  standalone: true,
  imports: [FlexModule, TranslatePipe]
})
export class ShowSolutionCompleteComponent {

}
