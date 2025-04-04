import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LandingPageRoutingModule } from './landing-page-routing.module';
import { HomeComponent } from './components/home/home.component';
import { BaniereSlideComponent } from './components/baniere-slide/baniere-slide.component';
import { FindAndManageComponentComponent } from './components/find-and-manage-component/find-and-manage-component.component';
import { SharedModule } from '../shared/shared.module';
import { FindLocationFormComponent } from './components/find-location-form/find-location-form.component';
import { ShowSolutionCompleteComponent } from './components/show-solution-complete/show-solution-complete.component';
import { ShowNumberComponent } from './components/show-number/show-number.component';
import { HowItsWorkComponent } from './components/how-its-work/how-its-work.component';
import { PropertyVedetteComponent } from './components/property-vedette/property-vedette.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { TarifsListComponent } from './components/tarifs-list/tarifs-list.component';
import { SloganTextComponent } from './components/slogan-text/slogan-text.component';


@NgModule({
  declarations: [
    HomeComponent,
    BaniereSlideComponent,
    FindAndManageComponentComponent,
    FindLocationFormComponent,
    ShowSolutionCompleteComponent,
    ShowNumberComponent,
    HowItsWorkComponent,
    PropertyVedetteComponent,
    ContactUsComponent,
    TarifsListComponent,
    SloganTextComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    LandingPageRoutingModule
  ]
})
export class LandingPageModule { }
