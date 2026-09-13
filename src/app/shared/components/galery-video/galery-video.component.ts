import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadFilesState } from '../../store/files-upload';
import { Select } from '@ngxs/store';
import { NoDataComponent } from '../no-data/no-data.component';
import { LoadingModule } from 'carbon-components-angular/loading';
import { NgIf, NgFor } from '@angular/common';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'galery-video',
  templateUrl: './galery-video.component.html',
  styleUrls: ['./galery-video.component.css'],
  standalone: true,
  imports: [NgScrollbar, NgIf, NgFor, LoadingModule, NoDataComponent]
})
export class GaleryVideoComponent implements OnInit, OnChanges {
  @Input() urlList:string[]=[ ];
  urlsQuadricUrlList:string[][]=[];
  @Output() onDeleteFileEvent:EventEmitter<string> = new EventEmitter<string>();
    @Select(UploadFilesState.selectStateLoading) waittingResponse$:Observable<boolean>;
    waittingResponse=false;
  
    constructor() {
    
    }

    ngOnInit(): void {
      this.waittingResponse$.subscribe((value) => {
        this.waittingResponse=value;
      });
    }

    deleteFile(urlItem)
    {
      this.onDeleteFileEvent.emit(urlItem);
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
      const sortArray = this.urlsQuadricUrlList.map((l) => l.length).sort();
      return  Array.from(Array(sortArray[sortArray.length-1]).keys());
    }

    getElementOfColone(index)
    {
      const arr = [];
      for(let i=0;i<this.urlsQuadricUrlList.length;i++)
      {
        if(this.urlsQuadricUrlList[i][index]) arr.push(this.urlsQuadricUrlList[i][index]);
      }
      return arr;
    }

}
