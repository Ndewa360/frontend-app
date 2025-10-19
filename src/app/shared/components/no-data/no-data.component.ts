import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-no-data-list',
  templateUrl: './no-data.component.html',
  styleUrls: ['./no-data.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class NoDataComponent implements OnInit {

  @Input() textDescription:string=""
  @Input() isTextDescriptionForFilter:boolean=false
  
  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
  }

}
