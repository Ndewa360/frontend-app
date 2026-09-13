import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabsModule } from 'carbon-components-angular';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'app-app-layout-horizontal',
  templateUrl: './app-layout-horizontal.component.html',
  styleUrls: ['./app-layout-horizontal.component.scss'],
  standalone: true,
  imports: [FlexModule, TabsModule, RouterOutlet]
})
export class AppLayoutHorizontalComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
