import { Component,Input,ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './app-progress-bar.component.html',
  styleUrls: ['./app-progress-bar.component.css'],
  encapsulation:ViewEncapsulation.None

})
export class AppProgressBarComponent {
  @Input() progressValue:number=0;
  @Input() progressName :string=""
  @Input() progressState:'PENDING' | 'IN_PROGRESS' | 'DONE'='PENDING'
}
