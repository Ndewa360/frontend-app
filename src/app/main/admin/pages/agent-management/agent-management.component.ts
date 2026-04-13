import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserProfileState } from 'src/app/shared/store/user-profile/user-profile.state';

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
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-agent-management',
  templateUrl: './agent-management.component.html',
  styleUrls: ['./agent-management.component.scss']
})
export class AgentManagementComponent implements OnInit {
  pendingAgents: AgentApplication[] = [];
  approvedAgents: AgentApplication[] = [];
  selectedAgent: AgentApplication | null = null;
  isLoading = false;
  showRejectModal = false;
  rejectionReason = '';
  selectedTab: 'pending' | 'approved' = 'pending';
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private store: Store,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadPendingAgents();
    this.loadApprovedAgents();
  }

  private get adminId(): string {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    return profile?._id || '';
  }

  async loadPendingAgents(): Promise<void> {
    this.isLoading = true;
    try {
      const response: any = await firstValueFrom(this.http.get(`${environment.apiUrl}/agents/pending`));
      this.pendingAgents = response.data || response || [];
    } catch {
      this.toastr.error('Erreur lors du chargement des agents en attente');
      this.pendingAgents = [];
    } finally {
      this.isLoading = false;
    }
  }

  async loadApprovedAgents(): Promise<void> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${environment.apiUrl}/agents?status=approved`));
      this.approvedAgents = response.data || response || [];
    } catch {
      this.approvedAgents = [];
    }
  }

  get filteredPendingAgents(): AgentApplication[] {
    if (!this.searchTerm) return this.pendingAgents;
    const term = this.searchTerm.toLowerCase();
    return this.pendingAgents.filter(a =>
      a.businessName?.toLowerCase().includes(term) ||
      a.userId?.name?.toLowerCase().includes(term) ||
      a.userId?.email?.toLowerCase().includes(term)
    );
  }

  get filteredApprovedAgents(): AgentApplication[] {
    if (!this.searchTerm) return this.approvedAgents;
    const term = this.searchTerm.toLowerCase();
    return this.approvedAgents.filter(a =>
      a.businessName?.toLowerCase().includes(term) ||
      a.userId?.name?.toLowerCase().includes(term) ||
      a.userId?.email?.toLowerCase().includes(term)
    );
  }

  get totalAgents(): number { return this.pendingAgents.length + this.approvedAgents.length; }
  get approvalRate(): number {
    if (this.totalAgents === 0) return 0;
    return Math.round((this.approvedAgents.length / this.totalAgents) * 100);
  }

  onTabChange(tab: 'pending' | 'approved'): void {
    this.selectedTab = tab;
    this.selectedAgent = null;
  }

  viewAgent(agent: AgentApplication): void { this.selectedAgent = agent; }

  async approveAgent(agent: AgentApplication): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/agents/${agent.userId._id}/admin-approve`, {
        adminId: this.adminId
      }));
      this.toastr.success(`Agent ${agent.businessName} approuvé avec succès`);
      await this.loadPendingAgents();
      await this.loadApprovedAgents();
      this.selectedAgent = null;
    } catch {
      this.toastr.error('Erreur lors de l\'approbation de l\'agent');
    }
  }

  openRejectModal(agent: AgentApplication): void {
    this.selectedAgent = agent;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  async rejectAgent(): Promise<void> {
    if (!this.selectedAgent || !this.rejectionReason.trim()) {
      this.toastr.warning('La raison du refus est requise');
      return;
    }
    try {
      await firstValueFrom(this.http.patch(`${environment.apiUrl}/agents/${this.selectedAgent.userId._id}/reject`, {
        adminId: this.adminId,
        reason: this.rejectionReason
      }));
      this.toastr.success('Agent refusé avec succès');
      await this.loadPendingAgents();
      this.closeRejectModal();
    } catch {
      this.toastr.error('Erreur lors du refus de l\'agent');
    }
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAgent = null;
    this.rejectionReason = '';
  }

  openDocument(url: string): void { window.open(url, '_blank'); }

  async refreshData(): Promise<void> {
    await Promise.all([this.loadPendingAgents(), this.loadApprovedAgents()]);
    this.toastr.success('Données actualisées');
  }
}
