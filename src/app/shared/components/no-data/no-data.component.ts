import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-no-data-list',
  templateUrl: './no-data.component.html',
  styleUrls: ['./no-data.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgIf, TranslatePipe]
})
export class NoDataComponent implements OnInit {

  @Input() textDescription:string='';
  @Input() isTextDescriptionForFilter:boolean=false;
  
  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
  }

}
