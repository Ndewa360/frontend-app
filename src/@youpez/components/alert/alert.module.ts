import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { YoupezAlertComponent } from './alert.component';

@NgModule({
    declarations: [
        YoupezAlertComponent
    ],
    imports     : [
        CommonModule,
        MatButtonModule,
        MatIconModule
    ],
    exports     : [
        YoupezAlertComponent
    ]
})
export class YoupezAlertModule
{
}
