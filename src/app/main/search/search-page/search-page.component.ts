import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlateformService } from 'src/app/shared/services/plateform/plateform.service';
import { RoomType } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit {
  constructor(
    private plateformService:PlateformService
  ){}
  
  ngOnInit(): void {}

  

}
