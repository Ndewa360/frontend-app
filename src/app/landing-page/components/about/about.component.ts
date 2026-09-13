import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { IbmIconComponent } from '../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [
    FlexModule,
    IbmIconComponent,
    ButtonModule
  ]
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}