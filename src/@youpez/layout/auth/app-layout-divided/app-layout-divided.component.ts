import {Component, OnInit, Input} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthWelcomeScreenComponent } from '../auth-welcome-screen/auth-welcome-screen.component';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'app-layout-divided',
  templateUrl: './app-layout-divided.component.html',
  styleUrls: ['./app-layout-divided.component.scss'],
  standalone: true,
  imports: [NgScrollbar, FlexModule, ExtendedModule, AuthWelcomeScreenComponent, RouterOutlet]
})
export class AppLayoutDividedComponent implements OnInit {

  @Input() layoutStyle: string = 'middle';
  public layoutClass: string = 'app-layout-divided-middle';

  constructor() {
  }

  ngOnInit(): void {

    if (this.layoutStyle === 'middle') {
      this.layoutClass = 'app-layout-divided-middle';
    }
    else if (this.layoutStyle === 'alone') {
      this.layoutClass = 'app-layout-divided-alone';
    }
    else if (this.layoutStyle === 'full') {
      this.layoutClass = 'app-layout-divided-full';
    }

  }

}
