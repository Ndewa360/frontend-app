import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'galery-image',
  templateUrl: './galery-image.component.html',
  styleUrls: ['./galery-image.component.css'],
})
export class GaleryImageComponent implements OnChanges{
  @Input() urlList:string[]=[ ]
  urlsQuadricUrlList:string[][]=[];
  constructor() {
    
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


