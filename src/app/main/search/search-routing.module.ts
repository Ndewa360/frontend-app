import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPageDataResolver, SearchRoomDataResolver } from 'src/app/shared/resolvers';
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';
import { SearchPageComponent } from './search-page';

const routes: Routes = [
  {
    path: '',
    // component: LayoutComponent,
    component: LandingLayoutComponent,
    children: [
      {
        path: 'index',
        component: SearchPageComponent,
        resolve: {
          data: SearchPageDataResolver
        }
      }      
    ]
  },
  {
    path: '**',
    redirectTo: 'index',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes,)],
  exports: [RouterModule]
})
export class SearchRoutingModule { }
