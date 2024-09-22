import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { TableModel, TableHeaderItem, TableItem, TableRowSize } from 'carbon-components-angular';
import { getDummyModel } from 'src/@youpez/data/dummy';
import { LocataireModel, LocataireState, RoomState } from 'src/app/shared/store';

function getRandomArbitrary(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Component({
  selector: 'app-locataire-property-list',
  templateUrl: './locataire-property-list.component.html',
  styleUrls: ['./locataire-property-list.component.scss']
})
export class LocatairePropertyListComponent implements OnInit, OnChanges {
  @Input() public propertyId = null;
  public model = null;
  public searchModel
  public size:TableRowSize = 'md'
  public offset = {x: -9, y: 0}
  public batchText = ''



  constructor(private _store:Store) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['propertyId'].currentValue) 
    {
      this._store.select(LocataireState.selectStateLocataireByPropertyId(changes['propertyId'].currentValue)).subscribe((data)=>{
        this.model = this.generateLocataireDataModel(data)
      })
    }
      
  }

  ngOnInit(): void {
    

  }

  generateLocataireDataModel(locataireList:LocataireModel[])
  { 
    let  model= new TableModel()
     model.header = [
      new TableHeaderItem({
        data: "Nom",
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: "Tél",
        className: "items-center"
      }),
      new TableHeaderItem({
        data: "Email",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Bien occupé",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Actions",
        className: "items-center",
      })
    ]
     model.data = locataireList.map((locataire)=> {
      return ([
        new TableItem({data: locataire.fullName}),
        new TableItem({data: locataire.phoneNumber}),
        new TableItem({data: locataire.email}),
        new TableItem({data: locataire.room}),
        new TableItem({data: ""})
      ])
    });
    return model;
  }

}
