import {Injectable, Inject, HostListener} from '@angular/core'
import {Subscription} from "rxjs"
import {BehaviorSubject, Subject, Observable} from 'rxjs'
import {EventManager} from '@angular/platform-browser'
import {MediaChange} from '@angular/flex-layout'
import {MediaObserver} from '@angular/flex-layout'
import * as _ from "lodash"
import { InjectionToken } from '@angular/core';
import { WindowRefService } from './window-ref.service'


@Injectable({
  providedIn: 'root'
})
export class AppBreakpointService {

  private activeMediaQueryWatcher: Subscription
  private activeMediaQuery = ""
  private activatedMqAlias = ""
  private breakpointIsGtSm = new BehaviorSubject<any>(true)
  private breakpoint = new BehaviorSubject<any>(true)
  private windowWidth = new BehaviorSubject<any>(null)
  private actualWindowWidth = null

  public $breakpointIsGtSm = this.breakpointIsGtSm.asObservable()
  public $breakpoint = this.breakpoint.asObservable()
  public $windowWidth = this.windowWidth.asObservable()

  constructor(public media: MediaObserver,
              private eventManager: EventManager,
              private windowRef: WindowRefService
            ) {
    // this.eventManager.addEventListener(this.windowRef.getNativeWindow().HTML, 'resize', this.onResize.bind(this))
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
    this.onResize();
  }

  init() {
    this.activeMediaQueryWatcher = this.media.asObservable().subscribe((change: MediaChange[]) => {
      let mediaChange = change[0]
      this.activatedMqAlias = mediaChange.mqAlias
      this.activeMediaQuery = mediaChange.mediaQuery
      this.checkMediaQuery()
      this.onResize()
    })
  }

  checkMediaQuery() {
    const alias = this.activatedMqAlias

    this.breakpoint.next(alias)

    if (alias == 'xs' ||
      alias == 'sm' ||
      alias == 'gt-xs') {
      this.breakpointIsGtSm.next(false)
    }
    else {
      this.breakpointIsGtSm.next(true)
    }
  }

  getWindowWidth() {
    return window.innerWidth
  }

  private onResize() {
    const currentWidth = this.getWindowWidth()

    if (currentWidth !== this.actualWindowWidth) {
      this.actualWindowWidth = currentWidth
      this.windowWidth.next(currentWidth)
    }
  }

}
