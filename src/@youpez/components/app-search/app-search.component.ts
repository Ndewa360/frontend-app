import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { SkeletonModule } from 'carbon-components-angular';
import { NgIf, isPlatformBrowser } from '@angular/common';
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
export class AppSearchComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('window:keyup', ['$event']) keyEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  @ViewChild('searchElement') searchElement: ElementRef;
  @Output() close = new EventEmitter();

  public loading: boolean = true;

  // [ngClass.lt-md] => [class.app-search__result--xs]="ltMd" (matchMedia natif).
  // L'API ngClass legacy de flex-layout crashe sur Angular 17 (addClass absente).
  public ltMd = false;
  private mqlLtMd?: MediaQueryList;
  private readonly onLtMdChange = (e: MediaQueryListEvent) => { this.ltMd = e.matches; };

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const mql = window.matchMedia('(max-width: 959.98px)');
      this.ltMd = mql.matches;
      mql.addEventListener('change', this.onLtMdChange);
      this.mqlLtMd = mql;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchElement.nativeElement.focus();
    }, 200);
    setTimeout(() => {
      this.loading = false;
    }, 700);
  }

  ngOnDestroy(): void {
    this.mqlLtMd?.removeEventListener('change', this.onLtMdChange);
  }

  onClose() {
    this.close.next(true);
  }

}