import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe } from '@angular/common';

type AgentTab = 'ADMIN_REVIEW' | 'APPROVED' | 'REJECTED';

interface AgentApplication {
  _id: string;
  userId: any;
  businessName: string;
  businessAddress: string;
  businessDescription: string;
  verificationType: string;
  verificationNumber: string;
  verificationDocumentUrl: string;
  professionalCardUrl?: string;
  businessLicenseUrl?: string;
  status: AgentTab | string;
  createdAt: string;
  updatedAt?: string;
  adminApprovedAt?: string | null;
  adminApprovedBy?: string | null;
  /** Nom de l'administrateur qui a approuvé ou refusé (calculé par le serveur). */
  decidedByName?: string | null;
  rejectionReason?: string;
}

interface AgentDocument { labelKey: string; url: string; isImage: boolean; }

/**
 * Validation des agents : demandes à examiner, approuvées et refusées
 * (GET /agents/admin/list, paginé côté serveur), avec l'historique de la
 * décision et les pièces justificatives visibles dans la même vue.
 */
@Component({
  selector: 'app-agent-management',
  templateUrl: './agent-management.component.html',
  styleUrls: ['./agent-management.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, TranslateModule]
})
export class AgentManagementComponent implements OnInit {
  trackByFn = trackByFn;

  readonly tabs: AgentTab[] = ['ADMIN_REVIEW', 'APPROVED', 'REJECTED'];
  selectedTab: AgentTab = 'ADMIN_REVIEW';

  agents: AgentApplication[] = [];
  counts: Record<string, number> = {};
  page = 1;
  readonly limit = 20;
  total = 0;
  totalPages = 1;
  searchTerm = '';

  selectedAgent: AgentApplication | null = null;
  isLoading = false;

  agentToApprove: AgentApplication | null = null;
  isApproving = false;

  showRejectModal = false;
  rejectionReason = '';
  isRejecting = false;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    try {
      let params = new HttpParams().set('status', this.selectedTab).set('page', this.page).set('limit', this.limit);
      if (this.searchTerm.trim()) params = params.set('search', this.searchTerm.trim());
      const response: any = await firstValueFrom(this.http.get(`${environment.apiUrl}/agents/admin/list`, { params }));
      const data = response?.data || {};
      this.agents = data.data || [];
      this.counts = data.counts || {};
      this.total = data.total || 0;
      this.totalPages = Math.max(1, data.totalPages || 1);
      if (this.selectedAgent) {
        this.selectedAgent = this.agents.find((a) => a._id === this.selectedAgent!._id) || null;
      }
    } catch {
      this.agents = [];
      this.toastr.error(this.translate.instant('ADMIN.AGENTS.LOAD_ERROR'));
    } finally {
      this.isLoading = false;
    }
  }

  onTabChange(tab: AgentTab): void {
    if (tab === this.selectedTab) return;
    this.selectedTab = tab;
    this.page = 1;
    this.selectedAgent = null;
    this.load();
  }

  onSearch(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  viewAgent(agent: AgentApplication): void { this.selectedAgent = agent; }

  initial(agent: AgentApplication): string {
    return String(agent.businessName || agent.userId?.name || '?').charAt(0).toUpperCase();
  }

  /** Pièces justificatives fournies (les images sont prévisualisées). */
  documents(agent: AgentApplication): AgentDocument[] {
    const docs: Array<[string, string | undefined]> = [
      ['ADMIN.AGENTS.DOC_IDENTITY', agent.verificationDocumentUrl],
      ['ADMIN.AGENTS.DOC_PRO_CARD', agent.professionalCardUrl],
      ['ADMIN.AGENTS.DOC_LICENSE', agent.businessLicenseUrl],
    ];
    return docs
      .filter(([, url]) => !!url)
      .map(([labelKey, url]) => ({ labelKey, url: url!, isImage: /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url!) }));
  }

  verificationTypeKey(type: string): string {
    return `ADMIN.AGENTS.VERIFICATION_TYPES.${type || 'NATIONAL_ID'}`;
  }

  openApproveModal(agent: AgentApplication): void { this.agentToApprove = agent; }

  closeApproveModal(): void {
    if (!this.isApproving) this.agentToApprove = null;
  }

  async confirmApprove(): Promise<void> {
    if (!this.agentToApprove || this.isApproving) return;
    this.isApproving = true;
    try {
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/agents/${this.agentToApprove.userId._id}/admin-approve`, {}));
      this.toastr.success(this.translate.instant('ADMIN.AGENTS.APPROVED_TOAST'));
      this.selectedAgent = null;
      await this.load();
    } catch {
      this.toastr.error(this.translate.instant('ADMIN.AGENTS.APPROVE_ERROR'));
    } finally {
      this.isApproving = false;
      this.agentToApprove = null;
    }
  }

  openRejectModal(agent: AgentApplication): void {
    this.selectedAgent = agent;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  async rejectAgent(): Promise<void> {
    if (!this.selectedAgent || !this.rejectionReason.trim() || this.isRejecting) {
      this.toastr.warning(this.translate.instant('ADMIN.AGENTS.REJECT_REASON_REQUIRED'));
      return;
    }
    this.isRejecting = true;
    try {
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/agents/${this.selectedAgent.userId._id}/reject`, {
        reason: this.rejectionReason.trim()
      }));
      this.toastr.success(this.translate.instant('ADMIN.AGENTS.REJECTED_TOAST'));
      this.closeRejectModal();
      await this.load();
    } catch {
      this.toastr.error(this.translate.instant('ADMIN.AGENTS.REJECT_ERROR'));
    } finally {
      this.isRejecting = false;
    }
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAgent = null;
    this.rejectionReason = '';
  }

  openDocument(url: string): void { window.open(url, '_blank', 'noopener,noreferrer'); }

  async refreshData(): Promise<void> {
    await this.load();
    this.toastr.success(this.translate.instant('ADMIN.AGENTS.REFRESHED'));
  }
}
