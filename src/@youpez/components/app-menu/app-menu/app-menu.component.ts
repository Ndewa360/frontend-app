import {Component, OnInit, Input, ViewChildren, QueryList, ElementRef, Output, EventEmitter} from '@angular/core';
import {AppMenuItemComponent} from '../app-menu-item/app-menu-item.component';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { AppMenuHeaderComponent } from '../app-menu-header/app-menu-header.component';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'youpez-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css'],
  standalone: true,
  imports: [NgFor, AppMenuHeaderComponent, NgClass, ExtendedModule, AppMenuItemComponent]
})
export class AppMenuComponent implements OnInit {

  @ViewChildren('menuLevel') menuLevel: QueryList<AppMenuItemComponent>;
  @Input() menu: Array<any> = [];
  @Input() opened: boolean = true;

  @Output() groupToggle: EventEmitter<string> = new EventEmitter();

  constructor() {
  }

  ngOnInit() {
  }

  onToggle(event) {
    this.menuLevel.map((item) => {
      item.toggleParent(event);
    });
  }

  onGroupToggle(groupName) {
    this.groupToggle.next(groupName);
  }
}
