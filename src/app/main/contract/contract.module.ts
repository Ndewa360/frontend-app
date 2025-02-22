import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContractRoutingModule } from './contract-routing.module';
import { ShowContractComponent } from './components/show-contract/show-contract.component';
import { SharedModule } from "../../shared/shared.module";
import {NgxExtendedPdfViewerModule} from "ngx-extended-pdf-viewer";

@NgModule({
  declarations: [
    ShowContractComponent
  ],
  imports: [
    CommonModule,
    ContractRoutingModule,
    SharedModule,
    // NgxE
    NgxExtendedPdfViewerModule
],
  exports : [
    ShowContractComponent
  ]
})
export class ContractModule { }
