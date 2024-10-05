import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  SharedModule],
  exports: [RouterModule,]
})
export class StatisticsRoutingModule { }
