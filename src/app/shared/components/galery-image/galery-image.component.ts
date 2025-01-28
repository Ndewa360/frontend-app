import { Component, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation,EventEmitter, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { UploadFilesState } from '../../store/files-upload';
import { Observable } from 'rxjs';

@Component({
  selector: 'galery-image',
  templateUrl: './galery-image.component.html',
  styleUrls: ['./galery-image.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class GaleryImageComponent implements OnChanges, OnInit{
  @Input() urlList:string[]=[ ]
  @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>()
  @Select(UploadFilesState.selectStateLoading) waittingResponse$:Observable<boolean>
  waittingResponse=false;
  urlsQuadricUrlList:string[][]=[];
  constructor() {
    
  }
  ngOnInit(): void {
    this.waittingResponse$.subscribe((value)=>{
      this.waittingResponse=value;
    })
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

  deleteFile(urlItem)
  {
    this.onDeleteFileEvent.emit(urlItem)
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


