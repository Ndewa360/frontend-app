import {Component, OnInit, Input} from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'youpez-logo',
  templateUrl: './app-logo.component.html',
  styleUrls: ['./app-logo.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class AppLogoComponent implements OnInit {

  @Input() type: string = 'white';
  @Input() logoWidth: string = '';

  constructor() {
  }

  ngOnInit(): void {
  }

}
