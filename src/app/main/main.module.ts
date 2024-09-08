import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'

import {SharedModule} from "../shared/shared.module"
import {LayoutModule} from "../layout/layout.module"
import {ChartsModule} from '../../@youpez'
import {MainRoutingModule} from './main-routing.module'


import {FaqComponent} from './application/faq/faq.component'
import {ManualComponent} from './application/manual/manual.component'
import {SupportComponent} from './application/support/support.component'
import {ChangelogComponent} from './application/changelog/changelog.component'
import {WelcomeComponent} from './welcome/welcome.component'
import {GettingStartedComponent} from './application/getting-started/getting-started.component'


@NgModule({
  declarations: [
    ChangelogComponent,
    FaqComponent,
    GettingStartedComponent,
    ManualComponent,
    SupportComponent,
    WelcomeComponent,
    // ListPropertyComponent,
    // ShowPropertyComponent,
    // AddPropertyComponent,
    // PropertyRoomComponent,
    // PropertyFinanceComponent,
    // PropertyLocataireComponent,
    // AddPropertyRoomComponent,
    // AddPropertyLocataireComponent,
    // FinancialHistoryComponent,
    // ShowRoomComponent
    
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    LayoutModule,
    SharedModule,
    ChartsModule,
    // AgGridModule.withComponents([]),
    // LocatairePropertyModule
  ]
})
export class MainModule {
}
