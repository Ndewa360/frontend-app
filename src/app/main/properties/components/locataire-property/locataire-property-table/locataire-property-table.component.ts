import { Component, Input, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngxs/store';
import { TableHeaderItem, TableItem, TableModel, TableRowSize } from 'carbon-components-angular';
import { getDummyModel } from 'src/@youpez/data/dummy';
import { RoomState } from 'src/app/shared/store';


class CustomHeaderItem extends TableHeaderItem {
  // used for custom sorting
  override compare(one: TableItem, two: TableItem) {
    const stringOne = (one.data.name || one.data.surname || one.data).toLowerCase()
    const stringTwo = (two.data.name || two.data.surname || two.data).toLowerCase()

    if (stringOne > stringTwo) {
      return 1
    }
    else if (stringOne < stringTwo) {
      return -1
    }
    else {
      return 0
    }
  }
}

function sort(model, index: number) {
  if (model.header[index].sorted) {
    // if already sorted flip sorting direction
    model.header[index].ascending = model.header[index].descending
  }
  model.sort(index)
}

@Component({
  selector: 'app-locataire-property-table',
  templateUrl: './locataire-property-table.component.html',
  styleUrls: ['./locataire-property-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocatairePropertyTableComponent implements OnInit {

  @Input() model = new TableModel()
  @Input() size:TableRowSize = "md"
  @Input() showSelectionColumn = true
  @Input() enableSingleSelect = false
  @Input() striped = false
  @Input() sortable = true
  @Input() isDataGrid = false
  @Input() noData = false
  @Input() stickyHeader = false
  @Input() skeleton = false

  @ViewChild("totalHeaderTemplate", {static: true}) totalHeaderTemplate: TemplateRef<any>
  @ViewChild("actionTemplate", {static: true}) actionTemplate: TemplateRef<any>
  @ViewChild("propertyTemplate", {static: true}) propertyTemplate: TemplateRef<any>

  constructor(
    private _store:Store
  ){}
  ngOnInit() {
    // this.model.header[3]= new CustomHeaderItem({
    //   data: this.model.header[3].data,
    //   template: this.totalHeaderTemplate,
    //   className: "items-center"
    // })
    this.updateDataAfterChanges()
  }

  updateDataAfterChanges()
  {
    this.model.data.map(data => {      
      data[3] = new TableItem({
        data: data[3].data,
        template: this.propertyTemplate,
        className: "items-center"
      })
   
      data[4] = new TableItem({
        data: data[4].data,
        template: this.actionTemplate,
        className: "items-center"
      })
      return data
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes["model"]) this.updateDataAfterChanges()
    if (changes['sortable']) {
      for (let column of this.model.header) {
        column.sortable = changes['sortable'].currentValue
      }
    }
  }

  onRowClick(index: number) {

  }

  getRoomById(roomId)
  {
    return this._store.select(RoomState.selectStateRoom(roomId))
  }

  simpleSort(index: number) {
    sort(this.model, index)
  }

}
