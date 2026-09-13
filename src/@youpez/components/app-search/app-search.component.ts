import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  HostListener
} from '@angular/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { SkeletonModule } from 'carbon-components-angular';
import { NgIf } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';
import { FlexModule } from '@angular/flex-layout/flex';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { IbmIconComponent } from '../ibm-icon/ibm-icon.component';

@Component({
  selector: 'youpez-search',
  templateUrl: './app-search.component.html',
  styleUrls: ['./app-search.component.scss'],
  standalone: true,
  imports: [IbmIconComponent, ExtendedModule, FlexModule, NgScrollbar, NgIf, SkeletonModule, ButtonModule]
})
export class AppSearchComponent implements OnInit, AfterViewInit {

  @HostListener('window:keyup', ['$event']) keyEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  @ViewChild('searchElement') searchElement: ElementRef;
  @Output() close = new EventEmitter();

  public loading: boolean = true;

  constructor() {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchElement.nativeElement.focus();
    }, 200);
    setTimeout(() => {
      this.loading = false;
    }, 700);
  }

  onClose() {
    this.close.next(true);
  }

}
