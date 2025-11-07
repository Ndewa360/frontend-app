import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { TeamComponent } from './components/team/team.component';
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';

const routes: Routes = [
  {
    path: '',
    component: LandingLayoutComponent,
    children:[
      {
        path: 'team',
        component: TeamComponent,
        pathMatch: 'full'
      },
      {
        path: '**',
        component: HomeComponent,
        pathMatch: 'full'
      },      
      // {
      //   path: '**',
      //   redirectTo: 'home',
      //   pathMatch: 'full'
      // }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingPageRoutingModule { }
