import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgentDashboardComponent } from './agent-dashboard/agent-dashboard.component';
import { AgentProfileComponent } from './agent-profile/agent-profile.component';
import { AgentPropertiesComponent } from './agent-properties/agent-properties.component';
import { AgentStatsComponent } from './agent-stats/agent-stats.component';
import { AgentProfileCompletionComponent } from './agent-profile-completion/agent-profile-completion.component';
import { PendingApprovalComponent } from './pending-approval/pending-approval.component';

const routes: Routes = [
  {
    path: 'complete-profile',
    component: AgentProfileCompletionComponent,
    data: { title: 'Compléter mon profil agent' }
  },
  {
    path: 'pending-approval',
    component: PendingApprovalComponent,
    data: { title: 'En attente d\'approbation' }
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: AgentDashboardComponent,
    data: { title: 'Tableau de bord Agent' }
  },
  {
    path: 'profile',
    component: AgentProfileComponent,
    data: { title: 'Mon Profil Agent' }
  },
  {
    path: 'properties',
    component: AgentPropertiesComponent,
    data: { title: 'Mes Biens Gérés' }
  },
  {
    path: 'stats',
    component: AgentStatsComponent,
    data: { title: 'Mes Statistiques' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgentRoutingModule { }