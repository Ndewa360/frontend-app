import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'youpez-menu-header',
  templateUrl: './app-menu-header.component.html',
  styleUrls: ['./app-menu-header.component.css'],
  standalone: true,
  imports: [NgIf]
})
export class AppMenuHeaderComponent implements OnInit {

  @Input() groupName: string = '';
  @Input() opened: boolean = true;

  @Output() toggle: EventEmitter<any> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  onToggle() {
    this.toggle.next(true);
  }

}
