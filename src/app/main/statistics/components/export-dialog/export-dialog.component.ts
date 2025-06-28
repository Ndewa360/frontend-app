import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExportService, ExportOptions } from '../../services/export.service';

export interface ExportDialogData {
  title: string;
  data: any;
  dataType: 'room' | 'tenant' | 'recapitulation';
}

@Component({
  selector: 'app-export-dialog',
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.css']
})
export class ExportDialogComponent implements OnInit {
  exportForm: FormGroup;
  isExporting: boolean = false;

  formatOptions = [
    { value: 'csv', label: 'CSV', description: 'Fichier de valeurs séparées par des virgules', icon: 'document' },
    { value: 'excel', label: 'Excel', description: 'Fichier Microsoft Excel (bientôt disponible)', icon: 'document', disabled: true },
    { value: 'pdf', label: 'PDF', description: 'Document PDF (bientôt disponible)', icon: 'document', disabled: true }
  ];

  constructor(
    private fb: FormBuilder,
    private exportService: ExportService,
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.setDefaultValues();
  }

  private createForm(): void {
    this.exportForm = this.fb.group({
      title: [this.data.title, Validators.required],
      filename: ['', Validators.required],
      format: ['csv', Validators.required],
      includeCharts: [false],
      includeData: [true]
    });
  }

  private setDefaultValues(): void {
    const defaultFilename = this.exportService.generateFilename(
      this.getFilenamePrefix(),
      'csv'
    );
    
    this.exportForm.patchValue({
      filename: defaultFilename
    });
  }

  private getFilenamePrefix(): string {
    switch (this.data.dataType) {
      case 'room':
        return 'statistiques_chambres';
      case 'tenant':
        return 'statistiques_locataires';
      case 'recapitulation':
        return 'recapitulation_paiements';
      default:
        return 'export_statistiques';
    }
  }

  selectFormat(format: string): void {
    this.exportForm.patchValue({ format });
    this.onFormatChange();
  }

  onFormatChange(): void {
    const format = this.exportForm.get('format')?.value;
    const currentFilename = this.exportForm.get('filename')?.value;

    if (currentFilename) {
      // Update filename extension
      const baseFilename = currentFilename.replace(/\.(csv|xlsx|pdf)$/, '');
      const extension = format === 'excel' ? 'xlsx' : format;
      this.exportForm.patchValue({
        filename: `${baseFilename}.${extension}`
      });
    }
  }

  async onExport(): Promise<void> {
    if (this.exportForm.invalid || this.isExporting) {
      return;
    }

    this.isExporting = true;

    try {
      const formValue = this.exportForm.value;
      const exportOptions: ExportOptions = {
        title: formValue.title,
        filename: formValue.filename.replace(/\.(csv|xlsx|pdf)$/, ''), // Remove extension
        format: formValue.format,
        includeCharts: formValue.includeCharts,
        includeData: formValue.includeData
      };

      // Validate options
      if (!this.exportService.validateExportOptions(exportOptions)) {
        throw new Error('Options d\'export invalides');
      }

      // Perform export based on data type
      switch (this.data.dataType) {
        case 'room':
          await this.exportService.exportRoomStatistics(this.data.data, exportOptions);
          break;
        case 'tenant':
          await this.exportService.exportTenantStatistics(this.data.data, exportOptions);
          break;
        case 'recapitulation':
          await this.exportService.exportPaymentRecapitulation(this.data.data, exportOptions);
          break;
        default:
          throw new Error('Type de données non supporté');
      }

      // Close dialog on success
      this.dialogRef.close({ success: true, options: exportOptions });

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      // Handle error (could show a toast or error message)
    } finally {
      this.isExporting = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  isFormatDisabled(format: string): boolean {
    const option = this.formatOptions.find(opt => opt.value === format);
    return option?.disabled || false;
  }

  getFormatDescription(format: string): string {
    const option = this.formatOptions.find(opt => opt.value === format);
    return option?.description || '';
  }
}
