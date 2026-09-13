import { Component,Input,ViewEncapsulation } from '@angular/core';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './app-progress-bar.component.html',
  styleUrls: ['./app-progress-bar.component.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgClass, ExtendedModule]
})
export class AppProgressBarComponent {
  @Input() progressValue:number=0;
  @Input() progressName :string='';
  @Input() progressState:'PENDING' | 'IN_PROGRESS' | 'DONE'='PENDING';
}
