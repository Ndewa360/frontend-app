import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { NgScrollbarModule } from 'ngx-scrollbar';

// Composants
import { ContractTemplatesListComponent } from './contract-templates-list/contract-templates-list.component';
import { ContractTemplateEditorComponent } from './contract-template-editor/contract-template-editor.component';
import { ContractTemplateViewComponent } from './contract-template-view/contract-template-view.component';
import { DuplicateTemplateModalComponent } from './components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from './components/delete-confirmation-modal/delete-confirmation-modal.component';
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
  declarations: [
    ContractTemplatesListComponent,
    ContractTemplateEditorComponent,
    ContractTemplateViewComponent,
    ContractTemplatesDashboardComponent,
    DuplicateTemplateModalComponent,
    DeleteConfirmationModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    EditorModule,
    NgScrollbarModule
  ],
  exports: [
    ContractTemplatesListComponent,
    ContractTemplateEditorComponent,
    ContractTemplateViewComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ContractTemplatesModule { }
