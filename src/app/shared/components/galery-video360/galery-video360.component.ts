import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'galery-video360',
  templateUrl: './galery-video360.component.html',
  styleUrls: ['./galery-video360.component.css']
})
export class GaleryVideo360Component {
  @Input() urlList:string[]=[]
    @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>()
  

    deleteFile(url)
    {
      this.onDeleteFileEvent.emit(url)
    }

}
