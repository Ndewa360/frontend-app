import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

// Carbon Components
import { ButtonModule, GridModule, IconModule, ProgressIndicatorModule, TagModule, TilesModule } from 'carbon-components-angular';

// Layout
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';

// Components
import { FundraisingPageComponent } from './fundraising-page/fundraising-page.component';
import { ImageModalComponent } from './image-modal/image-modal.component';

// Services
import { FundraisingService } from './services/fundraising.service';

@NgModule({
  declarations: [
    FundraisingPageComponent,
    ImageModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    TranslateModule,
    RouterModule.forChild([
      {
        path: '',
        component: LandingLayoutComponent,
        children: [
          {
            path: '',
            component: FundraisingPageComponent
          }
        ]
      }
    ]),
    // Material
    MatDialogModule,
    // Carbon Components
    ButtonModule,
    GridModule,
    IconModule,
    ProgressIndicatorModule,
    TagModule,
    TilesModule
  ],
  providers: [
    FundraisingService
  ]
})
export class FundraisingModule { }