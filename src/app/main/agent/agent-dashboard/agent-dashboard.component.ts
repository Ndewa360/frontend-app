import { Component, OnInit } from '@angular/core';
import { AgentService } from '../../../shared/services/agent.service';
import { AgentProfile, AgentStats, AgentStatus } from '../../../shared/models/agent.model';
import { NotificationService } from 'carbon-components-angular';

@Component({
  selector: 'app-agent-dashboard',
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.scss']
})
export class AgentDashboardComponent implements OnInit {
  agentProfile: AgentProfile | null = null;
  agentStats: AgentStats | null = null;
  loading = true;
  error: string | null = null;

  // Données pour les graphiques
  chartData: any = null;
  
  // Status enum pour le template
  AgentStatus = AgentStatus;

  constructor(
    private agentService: AgentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.agentService.getMyProfile().subscribe({
      next: (response) => {
        this.agentProfile = response.data.profile;
        this.agentStats = response.data.stats;
        this.prepareChartData();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        this.notificationService.showNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger les données du tableau de bord'
        });
      }
    });
  }

  prepareChartData(): void {
    if (!this.agentStats) return;

    this.chartData = {
      propertiesChart: {
        datasets: [{
          data: [
            this.agentStats.totalPropertiesValidated,
            this.agentStats.totalPropertiesRejected,
            this.agentStats.totalPropertiesManaged - this.agentStats.totalPropertiesValidated - this.agentStats.totalPropertiesRejected
          ],
          backgroundColor: ['#42be65', '#da1e28', '#f1c21b'],
          borderWidth: 0
        }],
        labels: ['Validés', 'Rejetés', 'En attente']
      }
    };
  }

  getStatusBadgeType(status: AgentStatus): string {
    return this.agentService.getStatusColor(status);
  }

  getStatusLabel(status: AgentStatus): string {
    return this.agentService.getStatusLabel(status);
  }

  getValidationRateColor(rate: number): string {
    return this.agentService.getValidationRateColor(rate);
  }

  getRatingStars(rating: number): string[] {
    return this.agentService.getRatingStars(rating);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Actions rapides
  navigateToProperties(): void {
    // Navigation vers la liste des biens
  }

  navigateToProfile(): void {
    // Navigation vers le profil
  }

  navigateToStats(): void {
    // Navigation vers les statistiques détaillées
  }
}