import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileLayoutComponent } from './layout/mobile-layout.component';
import { AuthGuard } from '../shared/guard';

const routes: Routes = [
  {
    path: '',
    component: MobileLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'search',
        pathMatch: 'full'
      },
      {
        path: 'search',
        loadChildren: () => import('./modules/search/mobile-search.module').then(m => m.MobileSearchModule)
      },
      {
        path: 'auth',
        loadChildren: () => import('./modules/auth/mobile-auth.module').then(m => m.MobileAuthModule)
      },
      {
        path: 'properties',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/properties/mobile-properties.module').then(m => m.MobilePropertiesModule)
      },
      {
        path: 'contracts',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/contracts/mobile-contracts.module').then(m => m.MobileContractsModule)
      },
      {
        path: 'billing',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/billing/mobile-billing.module').then(m => m.MobileBillingModule)
      },
      {
        path: 'profile',
        canActivate: [AuthGuard],
        loadChildren: () => import('./modules/profile/mobile-profile.module').then(m => m.MobileProfileModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileRoutingModule { }
