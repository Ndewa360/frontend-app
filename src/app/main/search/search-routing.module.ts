import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchPageComponent, SearchPageRedesignedComponent } from './search-page';
import { SearchPageDataResolver, SearchRoomDataResolver } from 'src/app/shared/resolvers';
import { RoomPageOverviewComponent } from './components/room-page-overview/room-page-overview.component';
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';
import { ModernSearchComponent } from './components/modern-search/modern-search.component';

const routes: Routes = [
  {
    path: '',
    // component: LayoutComponent,
    component: LandingLayoutComponent,
    children: [
      {
        path: 'index',
        component: ModernSearchComponent,
        resolve: {
          data: SearchPageDataResolver
        }
      },
      {
        path: 'redesigned',
        component: SearchPageRedesignedComponent,
        resolve: {
          data: SearchPageDataResolver
        }
      },
      {
        path: 'legacy',
        component: SearchPageComponent,
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
        // runGuardsAndResolvers: "always",
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
