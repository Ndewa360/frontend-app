import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

// Angular Material (optionnel)
// import { MatButtonModule } from '@angular/material/button';

// Modules partagés
import { SharedModule } from '../../shared/shared.module';

// Routing
import { AgentRoutingModule } from './agent-routing.module';

// Components
import { AgentDashboardComponent } from './agent-dashboard/agent-dashboard.component';
import { AgentProfileComponent } from './agent-profile/agent-profile.component';
import { AgentPropertiesComponent } from './agent-properties/agent-properties.component';
import { AgentStatsComponent } from './agent-stats/agent-stats.component';
import { AgentProfileCompletionComponent } from './agent-profile-completion/agent-profile-completion.component';
import { PendingApprovalComponent } from './pending-approval/pending-approval.component';

@NgModule({
  declarations: [
    AgentDashboardComponent,
    AgentProfileComponent,
    AgentPropertiesComponent,
    AgentStatsComponent,
    AgentProfileCompletionComponent,
    PendingApprovalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,
    AgentRoutingModule,
    SharedModule,
    
    // Pas de modules Carbon nécessaires
  ],
  exports: []
})
export class AgentModule { }