import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthWelcomeScreenComponent } from '../auth-welcome-screen/auth-welcome-screen.component';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'app-app-layout-divided-alt',
  templateUrl: './app-layout-divided-alt.component.html',
  styleUrls: ['./app-layout-divided-alt.component.scss'],
  standalone: true,
  imports: [NgScrollbar, FlexModule, ExtendedModule, AuthWelcomeScreenComponent, RouterOutlet]
})
export class AppLayoutDividedAltComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
