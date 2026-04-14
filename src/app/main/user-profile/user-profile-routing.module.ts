import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { MonthlyReportsComponent } from './components/monthly-reports/monthly-reports.component';

const routes: Routes = [
  {
    path: '',
    component: UserProfileComponent
  },
  {
    path: 'rapports-mensuels',
    component: MonthlyReportsComponent,
    data: { breadcrumb: 'Rapports Mensuels' }
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
