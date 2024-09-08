import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitialLoadingDataResolver } from './shared/resolvers';
import { AuthGuard } from './shared/guard';

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
		path: 'auth',
		loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
	  },
	  {
		path: '**',
		redirectTo: '/auth/signin',
		pathMatch: 'full',
	  },
];

@NgModule({
	imports: [RouterModule.forRoot(routes, {})],
	exports: [RouterModule]
})
export class AppRoutingModule { }
