import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPrintModule} from 'ngx-print';
import { BiilingRoutingModule } from './biiling-routing.module';
import { ShowBiilingComponent } from './components/show-biiling/show-biiling.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ShowBiilingComponent
  ],
  imports: [
    CommonModule,
    BiilingRoutingModule,
    SharedModule,
    NgxPrintModule
  ]
})
export class BiilingModule { }
