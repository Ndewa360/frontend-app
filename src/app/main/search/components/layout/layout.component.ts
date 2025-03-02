import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { filter, tap } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements AfterViewInit{
  @ViewChild(NgScrollbar,  { static: true }) scrollable: NgScrollbar;

  constructor(private router: Router) {
    
  }
  ngAfterViewInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => !!this.scrollable),
      tap((event: NavigationEnd) => this.scrollable.scrollTo({ top: 0, duration: 500 }))
    ).subscribe((e)=>{
      //console.log(e, "Event end");
    });
  }
  
}
