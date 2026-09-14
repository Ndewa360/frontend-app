import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LandingPageRoutingModule } from './landing-page-routing.module';
import { HomeComponent } from './components/home/home.component';
import { TeamComponent } from './components/team/team.component';
import { LandingAltComponent } from './components/landing-alt/landing-alt.component';
import { AboutComponent } from './components/about/about.component';
import { FindAndManageComponentComponent } from './components/find-and-manage-component/find-and-manage-component.component';
import { SharedModule } from '../shared/shared.module';
import { FindLocationFormComponent } from './components/find-location-form/find-location-form.component';
import { ContactComponent } from './components/contact/contact.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsComponent } from './components/terms/terms.component';
import { CookiesComponent } from './components/cookies/cookies.component';
import { MentionsLegalesComponent } from './components/mentions-legales/mentions-legales.component';
import { RemboursementComponent } from './components/remboursement/remboursement.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    LandingPageRoutingModule,
    HomeComponent,
    TeamComponent,
    LandingAltComponent,
    AboutComponent,
    FindAndManageComponentComponent,
    FindLocationFormComponent,
    ContactComponent,
    PrivacyPolicyComponent,
    TermsComponent,
    CookiesComponent,
    MentionsLegalesComponent,
    RemboursementComponent
  ]
})
export class LandingPageModule { }
