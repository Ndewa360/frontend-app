import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileState } from 'src/app/shared/store';
import { MonthlyReportService, MonthlyReportSummary } from './monthly-reports.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

@Component({
  selector: 'app-monthly-reports',
  templateUrl: './monthly-reports.component.html',
  styleUrls: ['./monthly-reports.component.scss']
})
export class MonthlyReportsComponent implements OnInit {
  reports: MonthlyReportSummary[] = [];
  loading = true;
  error = false;

  constructor(
    private store: Store,
    private reportService: MonthlyReportService,
    private languageUrlService: LanguageUrlService,
  ) {}

  ngOnInit(): void {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    if (!user?._id) { this.loading = false; return; }

    this.reportService.getMyReports(user._id).subscribe({
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
