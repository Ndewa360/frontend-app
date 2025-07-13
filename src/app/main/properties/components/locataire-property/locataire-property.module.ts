import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import {AgGridModule} from '@ag-grid-community/angular'
import {SharedModule} from "src/app/shared/shared.module"
import {LayoutModule} from "src/app/layout/layout.module"
import {ChartsModule} from 'src/@youpez'
import { LocatairePropertyListComponent } from './locataire-property-list/locataire-property-list.component';
import { LocatairePropertyTableComponent } from './locataire-property-table/locataire-property-table.component';
import { AssignLocationModule } from 'src/app/main/assign-location/assign-location.module';
import { UpdateLocataireComponent } from 'src/app/main/locataires/components/update-locataire/update-locataire.component';
import { AddLocataireComponent } from 'src/app/main/locataires/components/add-locataire/add-locataire.component';



@NgModule({
  declarations: [
    LocatairePropertyListComponent,
    LocatairePropertyTableComponent,
    UpdateLocataireComponent,
    AddLocataireComponent
  ],
  imports: [
    CommonModule,
    // LayoutModule,
    SharedModule,
    ChartsModule,
    AgGridModule,
    MatDialogModule,
    AssignLocationModule
  ],
  exports:[
    LocatairePropertyListComponent,
    LocatairePropertyTableComponent,
    UpdateLocataireComponent,
    AddLocataireComponent
  ]
})
export class LocatairePropertyModule { }
