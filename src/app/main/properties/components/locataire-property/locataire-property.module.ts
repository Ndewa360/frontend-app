import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AgGridModule} from '@ag-grid-community/angular'
import {SharedModule} from "src/app/shared/shared.module"
import {LayoutModule} from "src/app/layout/layout.module"
import {ChartsModule} from 'src/@youpez'
import { LocatairePropertyListComponent } from './locataire-property-list/locataire-property-list.component';
import { LocatairePropertyTableComponent } from './locataire-property-table/locataire-property-table.component';



@NgModule({
  declarations: [LocatairePropertyListComponent, LocatairePropertyTableComponent],
  imports: [
    CommonModule,
    LayoutModule,
    SharedModule,
    ChartsModule,
    AgGridModule,
  ],
  exports:[LocatairePropertyListComponent, LocatairePropertyTableComponent]
})
export class LocatairePropertyModule { }
