import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
  selectedAgent: AgentApplication | null = null;
  isLoading = false;
  showRejectModal = false;
  rejectionReason = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPendingAgents();
  }

  async loadPendingAgents(): Promise<void> {
    this.isLoading = true;
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/pending`).toPromise();
      console.log('Réponse API agents pending:', response);
      this.pendingAgents = response.data || response || [];
      console.log('Agents en attente chargés:', this.pendingAgents.length);
    } catch (error) {
      console.error('Erreur lors du chargement des agents en attente:', error);
      this.pendingAgents = [];
    } finally {
      this.isLoading = false;
    }
  }

  viewAgent(agent: AgentApplication): void {
    this.selectedAgent = agent;
  }

  async approveAgent(agent: AgentApplication): Promise<void> {
    try {
      await this.http.patch(`${environment.apiUrl}/agents/${agent.userId._id}/admin-approve`, {
        adminId: 'current-admin-id' // Get from auth service
      }).toPromise();
      
      await this.loadPendingAgents();
      this.selectedAgent = null;
    } catch (error) {
      console.error('Error approving agent:', error);
    }
  }

  openRejectModal(agent: AgentApplication): void {
    this.selectedAgent = agent;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  async rejectAgent(): Promise<void> {
    if (!this.selectedAgent || !this.rejectionReason.trim()) return;

    try {
      await this.http.patch(`${environment.apiUrl}/agents/${this.selectedAgent.userId._id}/reject`, {
        adminId: 'current-admin-id', // Get from auth service
        reason: this.rejectionReason
      }).toPromise();
      
      await this.loadPendingAgents();
      this.closeRejectModal();
    } catch (error) {
      console.error('Error rejecting agent:', error);
    }
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAgent = null;
    this.rejectionReason = '';
  }

  openDocument(url: string): void {
    window.open(url, '_blank');
  }
}