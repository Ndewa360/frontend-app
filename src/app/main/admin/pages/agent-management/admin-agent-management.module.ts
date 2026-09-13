import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';
import { AgentManagementComponent } from './agent-management.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    RouterModule,
    SharedModule,
    AgentManagementComponent
  ]
})
export class AdminAgentManagementModule { }