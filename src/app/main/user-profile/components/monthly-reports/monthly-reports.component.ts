import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit } from '@angular/core';
import { MonthlyReportService, MonthlyReportSummary } from './monthly-reports.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';

const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

@Component({
  selector: 'app-monthly-reports',
  templateUrl: './monthly-reports.component.html',
  styleUrls: ['./monthly-reports.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ExtendedModule, DatePipe]
})
export class MonthlyReportsComponent implements OnInit {
  trackByFn = trackByFn;

  reports: MonthlyReportSummary[] = [];
  loading = true;
  error = false;

  constructor(
    private reportService: MonthlyReportService,
    private languageUrlService: LanguageUrlService
  ) {}

  ngOnInit(): void {
    this.reportService.getMyReports().subscribe({
      next: (res) => {
        this.reports = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  getMonthName(month: number): string {
    return MONTHS_FR[month] || '';
  }

  getStatusLabel(status: string): string {
    const map = { SENT: 'Envoyé', GENERATED: 'Généré', PENDING: 'En attente', FAILED: 'Échec', SKIPPED: 'Ignoré' };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map = { SENT: 'badge-green', GENERATED: 'badge-blue', PENDING: 'badge-yellow', FAILED: 'badge-red', SKIPPED: 'badge-gray' };
    return map[status] || 'badge-gray';
  }

  downloadPdf(report: MonthlyReportSummary): void {
    if (report.pdfUrl) window.open(report.pdfUrl, '_blank');
  }

  navigateToDashboard(): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    window.location.href = `/${lang}/app/properties/home`;
  }
}
