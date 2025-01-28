import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadFilesState } from '../../store/files-upload';
import { Select } from '@ngxs/store';

@Component({
  selector: 'galery-video',
  templateUrl: './galery-video.component.html',
  styleUrls: ['./galery-video.component.css']
})
export class GaleryVideoComponent implements OnInit {
  @Input() urlList:string[]=[ ]
  urlsQuadricUrlList:string[][]=[];
  @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>()
    @Select(UploadFilesState.selectStateLoading) waittingResponse$:Observable<boolean>
    waittingResponse=false;
  
  constructor() {
    
  }

  ngOnInit(): void {
    this.waittingResponse$.subscribe((value)=>{
      this.waittingResponse=value;
    })
  }

  deleteFile(urlItem)
  {
    this.onDeleteFileEvent.emit(urlItem)
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['urlList'])
    {
      this.urlsQuadricUrlList = this.urlList.reduce((acc: string[][], url: string, index: number) => {
        if (index % 4 === 0) {
          acc.push([]);
        }
        acc[acc.length - 1].push(url);
        return acc;
      }, []);

    }
  }

  getColoneSizeArray()
  {
    let sortArray = this.urlsQuadricUrlList.map((l)=>l.length).sort();
    return  Array.from(Array(sortArray[sortArray.length-1]).keys())
  }

  getElementOfColone(index)
  {
    let arr = []
    for(let i=0;i<this.urlsQuadricUrlList.length;i++)
    {
      if(this.urlsQuadricUrlList[i][index]) arr.push(this.urlsQuadricUrlList[i][index])
    }
    return arr
  }

}
