import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Composants
import { ContractTemplatesListComponent } from './contract-templates-list/contract-templates-list.component';
import { ContractTemplateEditorComponent } from './contract-template-editor/contract-template-editor.component';
import { ContractTemplateViewComponent } from './contract-template-view/contract-template-view.component';
import { DuplicateTemplateModalComponent } from './components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
import { TemplateSelectionModalComponent } from './components/template-selection-modal/template-selection-modal.component';
import { ContractTemplatesDashboardComponent } from './contract-templates-dashboard/contract-templates-dashboard.component';

// Modules partagés
import { SharedModule } from '../../shared/shared.module';

// Routes
const routes: Routes = [
  {
    path: '',
    component: ContractTemplatesDashboardComponent
  },
  {
    path: 'list',
    component: ContractTemplatesListComponent
  },
  {
    path: 'create',
    component: ContractTemplateEditorComponent
  },
  {
    path: 'edit/:id',
    component: ContractTemplateEditorComponent
  },
  {
    path: 'view/:id',
    component: ContractTemplateViewComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    EditorModule,
    NgScrollbarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ContractTemplatesListComponent,
    ContractTemplateEditorComponent,
    ContractTemplateViewComponent,
    ContractTemplatesDashboardComponent,
    DuplicateTemplateModalComponent,
    DeleteConfirmationModalComponent,
    TemplateSelectionModalComponent
  ],
  exports: [
    ContractTemplatesListComponent,
    ContractTemplateEditorComponent,
    ContractTemplateViewComponent
  ]
})
export class ContractTemplatesModule { }
