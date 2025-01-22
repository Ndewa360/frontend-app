import { Component, Input } from '@angular/core';

@Component({
  selector: 'galery-video360',
  templateUrl: './galery-video360.component.html',
  styleUrls: ['./galery-video360.component.css']
})
export class GaleryVideo360Component {
  @Input() urlList:string[]=[]



}
