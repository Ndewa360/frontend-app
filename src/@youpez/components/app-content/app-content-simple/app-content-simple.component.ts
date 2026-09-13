import {Component, OnInit, Input} from '@angular/core';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'youpez-content-simple',
  templateUrl: './app-content-simple.component.html',
  styleUrls: ['./app-content-simple.component.scss'],
  standalone: true,
  imports: [NgScrollbar]
})
export class AppContentSimpleComponent implements OnInit {

  @Input() mainTitle: string = '';

  constructor() {
  }

  ngOnInit(): void {
  }

}
