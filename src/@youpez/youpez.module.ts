import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';


import {NgScrollbarModule} from 'ngx-scrollbar';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {A11yModule} from '@angular/cdk/a11y';

import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';



import {ResizableModule} from 'angular-resizable-element';
import {FlexLayoutModule} from '@angular/flex-layout';

import {AppSidenavComponent} from './components/app-sidenav/app-sidenav/app-sidenav.component';
import {AppSidenavContainerComponent} from './components/app-sidenav/app-sidenav-container/app-sidenav-container.component';

import {
  GridModule,
  ListModule,
  TabsModule,
  TilesModule,
  InputModule,
  ButtonModule,
  TagModule,
  BreadcrumbModule,
  CheckboxModule,
  ComboBoxModule,
  AccordionModule,
  TableModule,
  ToggleModule,
  DatePickerModule,
  SearchModule as SearchModuleComponent,
  ProgressBarModule,
  ContentSwitcherModule,
  SkeletonModule,
  DialogModule,
  LinkModule,
  // NotificationModule,
  RadioModule,
  PaginationModule,
  SelectModule,
  SliderModule,
  NumberModule,
  FileUploaderModule, 
  ModalModule,
  LoadingModule,
  ProgressIndicatorModule,
  StructuredListModule,
  CodeSnippetModule
} from 'carbon-components-angular';

import {AppMenuComponent} from './components/app-menu/app-menu/app-menu.component';
import {AppMenuHeaderComponent} from './components/app-menu/app-menu-header/app-menu-header.component';
import {AppMenuItemComponent} from './components/app-menu/app-menu-item/app-menu-item.component';
import {AppHeaderComponent} from './layout/app-header/app-header.component';
import {AppHeaderTitleComponent} from './layout/app-header/app-header-title/app-header-title.component';
import {AppHeaderToolsComponent} from './layout/app-header/app-header-tools/app-header-tools.component';
import {AppThemeSettingsComponent} from './layout/app-theme-settings/app-theme-settings.component';
import {AppLayoutHeaderComponent} from './layout/app-layout-header/app-layout-header.component';
import {AppSearchComponent} from './components/app-search/app-search.component';

import {AppLayoutDividedComponent} from './layout/auth/app-layout-divided/app-layout-divided.component';
import {AppLayoutDividedAltComponent} from './layout/auth/app-layout-divided-alt/app-layout-divided-alt.component';
import {AuthWelcomeScreenComponent} from './layout/auth/auth-welcome-screen/auth-welcome-screen.component';
import {AppLayoutDividedFullComponent} from './layout/auth/app-layout-divided-full/app-layout-divided-full.component';
import {AppLayoutBasicComponent} from './layout/auth/app-layout-basic/app-layout-basic.component';
import {AppLockScreenComponent} from './components/app-lock-screen/app-lock-screen.component';
import {AppContentSimpleComponent} from './components/app-content/app-content-simple/app-content-simple.component';
import {SafePipe} from './pipes/safe';
import {AppLogoComponent} from './components/app-logo/app-logo.component';
import {AppBreadcrumbComponent} from './components/app-breadcrumb/app-breadcrumb.component';
import { IbmIconModule } from './components/ibm-icon/ibm-icon.module';
// import { MarkdownModule } from 'ngx-markdown';
import {NgbDropdownModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {MatCardModule} from '@angular/material/card';
import { YoupezAlertComponent } from './components/alert';
import { AppLoaderComponent } from './components/app-loader/app-loader.component';
import { AppProgressBarComponent } from './components/app-progress-bar/app-progress-bar.component';
import { LandingFooterComponent } from './layout/landing/landing-footer/landing-footer.component';
import { LandingHeaderComponent } from './layout/landing/landing-header/landing-header.component';
import { LandingHeaderProfilDataComponent } from './layout/landing/landing-header-profil-data/landing-header-profil-data.component';
import { LandingLayoutComponent } from './layout/landing/landing-layout/landing-layout.component';


// import { NgxMatIntlTelInputComponent } from "ngx-mat-intl-tel-input"


const MainModules = [  
  MatCardModule,
  RouterModule,
  NgbDropdownModule,
  NgbTooltipModule,
  ResizableModule,
  TranslateModule,
  // BemModule.config({
  //   separators: ['__', '--', '-'], // el / mod / val separators
  //   modCase: 'kebab', // case of modifiers names
  //   ignoreValues: false // cast mod values to booleans
  // }),
  IbmIconModule,
  FlexLayoutModule,
  DragDropModule,
  A11yModule,
  MatDialogModule,
  MatIconModule
  // NgxMatIntlTelInputComponent,
  // ChartsModule retiré : les composants `youpez-echarts` (et echarts,
  // ~1,5 Mo) ne sont utilisés nulle part dans l'application. L'importer ici
  // tirait tout echarts dans le bundle initial via SharedModule (→ app.module).
];

const CarbonModules = [
  GridModule,
  ListModule,
  TabsModule,
  TilesModule,
  InputModule,
  ButtonModule,
  TagModule,
  BreadcrumbModule,
  CheckboxModule,
  ComboBoxModule,
  AccordionModule,
  TableModule,
  ToggleModule,
  DatePickerModule,
  SearchModuleComponent,
  ContentSwitcherModule,
  SkeletonModule,
  DialogModule,
  LinkModule,
  // NotificationModule,
  RadioModule,
  PaginationModule,
  SelectModule,
  SliderModule,
  NumberModule,
  FileUploaderModule,
  ModalModule,
  LoadingModule,
  ProgressBarModule,
  ProgressIndicatorModule,

  StructuredListModule,
  CodeSnippetModule,
  InputModule
];

const Components = [
  AppSidenavComponent,
  AppSidenavContainerComponent,
  AppMenuComponent,
  AppMenuHeaderComponent,
  AppMenuItemComponent,
  AppHeaderComponent,
  AppHeaderTitleComponent,
  AppHeaderToolsComponent,
  AppThemeSettingsComponent,
  AppLayoutHeaderComponent,
  AppSearchComponent,
  AppLayoutDividedComponent,
  AppLayoutDividedAltComponent,
  AuthWelcomeScreenComponent,
  AppLayoutDividedFullComponent,
  AppLayoutBasicComponent,
  AppLockScreenComponent,
  AppContentSimpleComponent,
  AppLogoComponent,
  AppBreadcrumbComponent,
  YoupezAlertComponent,
  AppLoaderComponent,
  AppProgressBarComponent,

  LandingFooterComponent,
  LandingHeaderComponent,
  LandingHeaderProfilDataComponent,
  LandingLayoutComponent
];

const Pipes = [
  SafePipe
];

@NgModule({
  imports: [
    CommonModule,
    ...MainModules,
    ...CarbonModules,
    NgScrollbarModule,
    ...Components,
    ...Pipes
  ],
  exports: [
    ...Components,
    ...MainModules,
    ...CarbonModules,
    ...Pipes,
    NgScrollbarModule
    // MarkdownModule
  ]
})
export class YoupezModule {
  constructor() {
   
  } 
}
