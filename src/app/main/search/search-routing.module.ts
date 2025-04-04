import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPageComponent } from './search-page/search-page.component';
import { SearchPageDataResolver, SearchRoomDataResolver } from 'src/app/shared/resolvers';
import { RoomPageOverviewComponent } from './components/room-page-overview/room-page-overview.component';
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';

const routes: Routes = [
  {
    path: '',
    // component: LayoutComponent,
    component: LandingLayoutComponent,
    children: [
      {
        path: 'index',
        component:SearchPageComponent,
        resolve: {
          data: SearchPageDataResolver
        }
      },
      {
        path: 'room/:roomID',
        component:RoomPageOverviewComponent,
        resolve: {
          dataRoomItem: SearchRoomDataResolver,
          dataRoomList: SearchPageDataResolver
        },
        runGuardsAndResolvers: "always",
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
