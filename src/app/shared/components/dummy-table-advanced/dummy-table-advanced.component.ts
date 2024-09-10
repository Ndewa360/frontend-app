import {Component, OnInit} from '@angular/core'
import {getDummyModel} from "../../../../@youpez/data/dummy"
import { TableRowSize } from 'carbon-components-angular'

@Component({
  selector: 'app-dummy-table-advanced',
  templateUrl: './dummy-table-advanced.component.html',
  styleUrls: ['./dummy-table-advanced.component.scss']
})
export class DummyTableAdvancedComponent implements OnInit {

  public model = getDummyModel()
  public searchModel
  public size:TableRowSize = 'md'
  public offset = {x: -9, y: 0}
  public batchText = ''

  constructor() {
  }

  ngOnInit(): void {
  }

}
