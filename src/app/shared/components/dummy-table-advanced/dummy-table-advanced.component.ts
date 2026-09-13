import {Component, OnInit} from '@angular/core';
import {getDummyModel} from '../../../../@youpez/data/dummy';
import { TableRowSize, TableModule } from 'carbon-components-angular';
import { DummyTableRichComponent } from '../dummy-table-rich/dummy-table-rich.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dummy-table-advanced',
  templateUrl: './dummy-table-advanced.component.html',
  styleUrls: ['./dummy-table-advanced.component.scss'],
  standalone: true,
  imports: [TableModule, FormsModule, DummyTableRichComponent]
})
export class DummyTableAdvancedComponent implements OnInit {

  public model = getDummyModel();
  public searchModel;
  public size:TableRowSize = 'md';
  public offset = {x: -9, y: 0};
  public batchText = '';

  constructor() {
  }

  ngOnInit(): void {
  }

}
