import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { SearchPageDataResolver, SearchRoomDataResolver } from 'src/app/shared/resolvers';
import { RoomPageOverviewComponent } from './components/room-page-overview/room-page-overview.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
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
