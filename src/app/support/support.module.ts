import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home/home.component';

import { SupportRoutingModule } from './support-routing.module';
import { FaqComponent } from './faq/faq.component';
import { RequestComponent } from './request/request.component';
import { SharedModule } from '../shared/shared.module';
import { ChangelogComponent } from './changelog/changelog.component';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { SupportComponent } from './support/support.component';
import { ManualComponent } from './manual/manual.component';
import { LayoutComponent } from '../layout/default/layout.component';
// import { HeaderComponent } from '../layout/header/header/header.component';
import { AppLayoutHorizontalComponent } from '../layout/horizontal/app-layout-horizontal/app-layout-horizontal.component';
import { LayoutMiniSidebarComponent } from '../layout/menu/layout-mini-sidebar/layout-mini-sidebar.component';
import { LayoutSidebarComponent } from '../layout/menu/layout-sidebar/layout-sidebar.component';
import { LayoutModule } from '../layout/layout.module';
// import { WelcomeComponent } from './welcome/welcome.component';


@NgModule({
  declarations: [
    FaqComponent,
    RequestComponent,
    ChangelogComponent,
    GettingStartedComponent,
    SupportComponent,
    HomeComponent,
    ManualComponent,
    // WelcomeComponent
    // LayoutComponent,
    // AppLayoutHorizontalComponent,
    // LayoutMiniSidebarComponent,
    // LayoutSidebarComponent,
    // HeaderComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    LayoutModule,
    SupportRoutingModule
  ]
})
export class SupportModule { }
