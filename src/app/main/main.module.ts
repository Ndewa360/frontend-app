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
import { AddPropertyComponent } from './properties/add-property/add-property.component'
import { AddPropertyLocataireComponent } from './properties/components/add-property-locataire/add-property-locataire.component'
import { AddPropertyRoomComponent } from './properties/components/add-property-room/add-property-room.component'
import { FinancialHistoryComponent } from './properties/components/financial-history/financial-history.component'
import { PropertyFinanceComponent } from './properties/components/property-finance/property-finance.component'
import { PropertyLocataireComponent } from './properties/components/property-locataire/property-locataire.component'
import { PropertyRoomComponent } from './properties/components/property-room/property-room.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { ShowPropertyComponent } from './properties/show-property/show-property.component'
import { LocatairePropertyModule } from './properties/components/locataire-property/locataire-property.module'
import { AgGridModule } from '@ag-grid-community/angular';
import { UpdatePropertyComponent } from './properties/components/update-property/update-property.component';
import { SeeLocationsComponent } from './properties/components/see-locations/see-locations.component';
import { AssignLocationComponent } from './properties/components/assign-location/assign-location.component';
import { AssignLocationFormComponent } from './properties/components/assign-location-form/assign-location-form.component';
import { AssignLocationStepperComponent } from './properties/components/assign-location-stepper/assign-location-stepper.component';
import { AssignLocationListClientComponent } from './properties/components/assign-location-list-client/assign-location-list-client.component';
import { RemoveLocataireRoomComponent } from './properties/components/remove-locataire-room/remove-locataire-room.component'


@NgModule({
  declarations: [
    ChangelogComponent,
    FaqComponent,
    GettingStartedComponent,
    ManualComponent,
    SupportComponent,
    WelcomeComponent,
    ListPropertyComponent,
    ShowPropertyComponent,
    AddPropertyComponent,
    PropertyRoomComponent,
    PropertyFinanceComponent,
    PropertyLocataireComponent,
    AddPropertyRoomComponent,
    AddPropertyLocataireComponent,
    FinancialHistoryComponent,
    UpdatePropertyComponent,
    SeeLocationsComponent,
    AssignLocationComponent,
    AssignLocationFormComponent,
    AssignLocationStepperComponent,
    AssignLocationListClientComponent,
    RemoveLocataireRoomComponent,
    
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    LayoutModule,
    SharedModule,
    ChartsModule,
    
    AgGridModule,
    LocatairePropertyModule
  ]
})
export class MainModule {
}
