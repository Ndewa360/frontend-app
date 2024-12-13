import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin/admin.component';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'src/app/shared/shared.module';
import { UsersListComponent } from './components/users-list/users-list.component';


@NgModule({
  declarations: [
    AdminComponent,
    UsersListComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    CommonModule,
    SharedModule,
    NgxPrintModule
  ]
})
export class AdminModule { }
