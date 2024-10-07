import {Component, OnInit, Input, ViewEncapsulation} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'youpez-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AppHeaderComponent implements OnInit {

  @Input() bordered: boolean = true

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router
  ) {
  }

  ngOnInit(): void {
  }

  shoulShowBackToBtn()
  {
    return this._router.url!="/app/properties/list"
    
  }

  backToProperty()
  {

  }
}
