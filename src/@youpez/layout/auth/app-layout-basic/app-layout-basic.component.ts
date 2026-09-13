import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'app-app-layout-basic',
  templateUrl: './app-layout-basic.component.html',
  styleUrls: ['./app-layout-basic.component.scss'],
  standalone: true,
  imports: [NgScrollbar, FlexModule, RouterOutlet]
})
export class AppLayoutBasicComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
