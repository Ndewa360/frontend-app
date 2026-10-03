import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InitialLoadingDataResolver, PublicDataResolver } from './shared/resolvers';
import { AuthGuard } from './shared/guard';
import { SelectivePreloadingStrategy } from './shared/services/preloading/selective-preloading-strategy';

import { LoadingAdminDataResolver } from './shared/resolvers/loading-admin-data';
import { Error404Component } from './main/errors/error404/error404.component';

/** Détecte la langue sauvegardée ou du navigateur — SSR-safe */
function getBrowserLang(): string {
  // SSR : localStorage et navigator ne sont pas disponibles côté serveur
  if (typeof window === 'undefined') return 'fr';
  try {
    const saved = localStorage.getItem('selectedLanguage');
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {}
  try {
    const browser = (navigator.language || '').split('-')[0].toLowerCase();
    return browser === 'fr' ? 'fr' : 'en';
  } catch {}
  return 'fr';
}


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
				data:{
					breadcrumb: 'Acceuil',
					preload: false
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
				path: 'onboarding',
				data: { breadcrumb: 'Inscription' },
				loadChildren: () => import('./onboarding/onboarding.module').then(m => m.OnboardingModule)
			},
			{
				path: '',
				redirectTo: 'home',
				pathMatch: 'full'
			},
			{
				path: '**',
				component: Error404Component
			}
		]
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: getBrowserLang() + '/home'
	},
	{
		path: 'app',
		redirectTo: getBrowserLang() + '/app'
	},
	{
		path: 'search',
		redirectTo: getBrowserLang() + '/search'
	},
	{
		path: 'onboarding',
		redirectTo: getBrowserLang() + '/onboarding'
	},
	{
		path: 'support',
		redirectTo: getBrowserLang() + '/support'
	},
	{
		path: 'fundraising',
		redirectTo: getBrowserLang() + '/fundraising'
	},
	{
		path: 'admin',
		redirectTo: getBrowserLang() + '/admin'
	},
	{
		path: 'auth',
		redirectTo: getBrowserLang() + '/auth'
	},
	{
		path: 'home',
		redirectTo: getBrowserLang() + '/home'
	},
	{
		path: '**',
		component: Error404Component
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			preloadingStrategy: SelectivePreloadingStrategy,
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64],
    useHash: false,
    initialNavigation: 'enabledBlocking'
})],
	exports: [RouterModule]
})
export class AppRoutingModule { }
