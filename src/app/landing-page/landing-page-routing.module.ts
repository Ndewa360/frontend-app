import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { TeamComponent } from './components/team/team.component';
import { LandingAltComponent } from './components/landing-alt/landing-alt.component';
import { AboutComponent } from './components/about/about.component';
import { LandingLayoutComponent } from 'src/@youpez/layout/landing/landing-layout/landing-layout.component';
import { ContactComponent } from './components/contact/contact.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsComponent } from './components/terms/terms.component';
import { CookiesComponent } from './components/cookies/cookies.component';
import { MentionsLegalesComponent } from './components/mentions-legales/mentions-legales.component';
import { RemboursementComponent } from './components/remboursement/remboursement.component';

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
        path: 'landing-alt',
        component: LandingAltComponent,
        pathMatch: 'full'
      },
      {
        path: 'about',
        component: AboutComponent,
        pathMatch: 'full'
      },
      {
        path: 'contact',
        component: ContactComponent,
        pathMatch: 'full'
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyComponent,
        pathMatch: 'full'
      },
      {
        path: 'terms',
        component: TermsComponent,
        pathMatch: 'full'
      },
      {
        path: 'cookies',
        component: CookiesComponent,
        pathMatch: 'full'
      },
      {
        path: 'mentions-legales',
        component: MentionsLegalesComponent,
        pathMatch: 'full'
      },
      {
        path: 'remboursement',
        component: RemboursementComponent,
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
