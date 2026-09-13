import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EchartsComponent} from './echarts/echarts.component';
import {EchartsContainerComponent} from './echarts-container/echarts-container.component';


const Components = [
  EchartsComponent,
  EchartsContainerComponent
];

@NgModule({
  imports: [
    CommonModule,
    ...Components
  ],
  exports: [
    ...Components
  ]
})
export class ChartsModule {
}
