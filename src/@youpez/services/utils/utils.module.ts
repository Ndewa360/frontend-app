import { NgModule } from '@angular/core';
import { YoupezUtilsService } from '@youpez/services/utils/utils.service';

@NgModule({
    providers: [
        YoupezUtilsService
    ]
})
export class YoupezUtilsModule
{
    /**
     * Constructor
     */
    constructor(private _youpezUtilsService: YoupezUtilsService)
    {
    }
}
