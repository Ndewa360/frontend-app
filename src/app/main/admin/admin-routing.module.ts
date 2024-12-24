import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { LoadingAdminDataResolver } from 'src/app/shared/resolvers/loading-admin-data';
import { UsersListComponent } from './components/users-list/users-list.component';
import { CountryCityComponent } from './components/country-city/country-city.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,   
    resolve : {
      getAllUser: LoadingAdminDataResolver
    },     
    children:[
       {
        path: 'users',
        component: UsersListComponent
       },
       {
        path: 'country',
        component: CountryCityComponent
       },
       {
        path: '**',
        redirectTo: 'users'
       }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
