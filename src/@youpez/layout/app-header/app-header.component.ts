import {Component, OnInit, Input, ViewEncapsulation} from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { IbmIconComponent } from '../../components/ibm-icon/ibm-icon.component';
import { AppBreadcrumbComponent } from '../../components/app-breadcrumb/app-breadcrumb.component';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'youpez-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgClass, ExtendedModule, AppBreadcrumbComponent, NgIf, RouterLinkActive, RouterLink, IbmIconComponent]
})
export class AppHeaderComponent implements OnInit {

  @Input() bordered: boolean = true;

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
  }

  ngOnInit(): void {
  }

  shoulShowBackToBtn()
  {
    return this._router.url!='/app/properties/home' || this._router.url.indexOf('rooms')<-1;
    
  }

  backToProperty()
  {

  }
}
