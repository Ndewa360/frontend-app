import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NoDataComponent } from '../no-data/no-data.component';
import { GaleryVideo360ItemComponent } from '../galery-video360-item/galery-video360-item.component';
import { NgIf, NgFor } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'galery-video360',
  templateUrl: './galery-video360.component.html',
  styleUrls: ['./galery-video360.component.css'],
  standalone: true,
  imports: [NgScrollbar, NgIf, NgFor, GaleryVideo360ItemComponent, NoDataComponent]
})
export class GaleryVideo360Component {
  @Input() urlList:string[]=[];
    @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>();
  

    deleteFile(url)
    {
      this.onDeleteFileEvent.emit(url);
    }

}
