import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitialLoadingDataResolver } from './shared/resolvers';
import { AuthGuard } from './shared/guard';
import { LayoutComponent } from './layout/default/layout.component';
import { LoadingAdminDataResolver } from './shared/resolvers/loading-admin-data';
import { IonicModule } from '@ionic/angular';

const routes: Routes = [
	{
		path: 'app',
		canActivate:[AuthGuard],
		data:{
			breadcrumb: 'Acceuil'
		},
		resolve:{
			"initialData":InitialLoadingDataResolver
		},
		loadChildren: () => import('./main/main.module').then(m => m.MainModule)
	},
	{
		path: 'search',
		// canActivate:[AuthGuard],
		data:{
			breadcrumb: 'Acceuil'
		},
		loadChildren: () => import('./main/search/search.module').then(m => m.SearchModule)
	},
	{
		path: 'admin',
		canActivate:[AuthGuard],
		component: LayoutComponent,		
		data:{
			breadcrumb: 'Acceuil'
		},
		resolve:{
			"initialData":LoadingAdminDataResolver
		},
		loadChildren: () => import('./main/admin/admin.module').then(m => m.AdminModule),
	},
	{
		path: 'auth',
		loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
	  },
	  {
		path: '',
		loadChildren: () => import('./landing-page/landing-page.module').then(m => m.LandingPageModule)
	  }
	//   {
	// 	path: '**',
	// 	redirectTo: '/search/index',
	// 	pathMatch: 'full',
	//   },
];

@NgModule({
	imports: [
		IonicModule.forRoot(),
		RouterModule.forRoot(routes, {
		anchorScrolling: 'enabled',
		scrollOffset: [0, 64],
	})],
	exports: [RouterModule]
})
export class AppRoutingModule { }
