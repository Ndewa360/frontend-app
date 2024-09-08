import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-no-data-list',
  templateUrl: './no-data.component.html',
  styleUrls: ['./no-data.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class NoDataComponent implements OnInit {

  @Input() textDescription:string=""
  constructor() { }

  ngOnInit(): void {
  }

}
