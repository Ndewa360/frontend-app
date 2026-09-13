import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { IbmIconComponent } from '../../../../@youpez/components/ibm-icon/ibm-icon.component';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'app-landing-alt',
  templateUrl: './landing-alt.component.html',
  styleUrls: ['./landing-alt.component.scss'],
  standalone: true,
  imports: [FlexModule, IbmIconComponent, ButtonModule]
})
export class LandingAltComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}