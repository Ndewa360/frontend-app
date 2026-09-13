import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthWelcomeScreenComponent } from '../auth-welcome-screen/auth-welcome-screen.component';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { FlexModule } from '@angular/flex-layout/flex';

@Component({
  selector: 'app-app-layout-divided-full',
  templateUrl: './app-layout-divided-full.component.html',
  styleUrls: ['./app-layout-divided-full.component.scss'],
  standalone: true,
  imports: [FlexModule, ExtendedModule, AuthWelcomeScreenComponent, RouterOutlet]
})
export class AppLayoutDividedFullComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
