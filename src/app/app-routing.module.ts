import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitialLoadingDataResolver, PublicDataResolver } from './shared/resolvers';
import { AuthGuard } from './shared/guard';

import { LayoutComponent } from './layout/default/layout.component';
import { LoadingAdminDataResolver } from './shared/resolvers/loading-admin-data';


const routes: Routes = [
	// Routes avec langue
	{
		path: ':lang',
		children: [
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
				resolve:{
					"publicData": PublicDataResolver
				},
				data:{
					breadcrumb: 'Recherche'
				},
				loadChildren: () => import('./main/search/search.module').then(m => m.SearchModule)
			},
			{
				path: 'monitoring',
				canActivate: [AuthGuard],
				data: {
					breadcrumb: 'Monitoring'
				},
				resolve: {
					"initialData": InitialLoadingDataResolver
				},
				loadChildren: () => import('./monitoring/monitoring.module').then(m => m.MonitoringModule)
			},
			{
				path: 'support',
				resolve:{
					"publicData": PublicDataResolver
				},
				data:{
					breadcrumb: 'Support'
				},
				loadChildren: () => import('./support/support.module').then(m => m.SupportModule)
			},
			{
				path: 'fundraising',
				resolve:{
					"publicData": PublicDataResolver
				},
				data:{
					breadcrumb: 'Collecte de Fonds'
				},
				loadChildren: () => import('./fundraising/fundraising.module').then(m => m.FundraisingModule)
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
				loadChildren: () => import('./main/admin/admin.module').then(m => m.AdminModule)
			},
			{
				path: 'auth',
				loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
			},
			{
				path: 'payment',
				loadChildren: () => import('./public/payment/payment.module').then(m => m.PaymentModule)
			},
			{
				path: 'home',
				resolve:{
					"publicData": PublicDataResolver
				},
				loadChildren: () => import('./landing-page/landing-page.module').then(m => m.LandingPageModule)
			},
			{
				path: '',
				redirectTo: 'search/index',
				pathMatch: 'full'
			}
		]
	},
	{
		path: '',
		redirectTo: '/en/search/index',
		pathMatch: 'full'
	},
	{
		path: 'app',
		redirectTo: '/en/app'
	},
	{
		path: 'search',
		redirectTo: '/en/search'
	},
	{
		path: 'support',
		redirectTo: '/en/support'
	},
	{
		path: 'fundraising',
		redirectTo: '/en/fundraising'
	},
	{
		path: 'admin',
		redirectTo: '/en/admin'
	},
	{
		path: 'auth',
		redirectTo: '/en/auth'
	},
	{
		path: 'home',
		redirectTo: '/en/home'
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
		anchorScrolling: 'enabled',
		scrollOffset: [0, 64],
		useHash: false
	})],
	exports: [RouterModule]
})
export class AppRoutingModule { }
