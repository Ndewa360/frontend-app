import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentProfile, AgentStats, AgentStatus } from '../models/agent.model';

@Injectable({
    providedIn: 'root'
})
export class AgentService {
    private readonly apiUrl = `${environment.apiUrl}/agents`;

    constructor(private http: HttpClient) {}

    /** Profil et statistiques de l'agent connecté (GET /agents/me). */
    getMyProfile(): Observable<{ data: { profile: AgentProfile; stats: AgentStats } }> {
        return this.http.get<{ data: { profile: AgentProfile; stats: AgentStats } }>(`${this.apiUrl}/me`);
    }

    // ─── Affichage (tableau de bord agent) ───────────────────────────────

    getStatusLabel(status: AgentStatus): string {
        const labels = {
            [AgentStatus.PENDING]: 'En attente',
            [AgentStatus.ADMIN_REVIEW]: 'En cours de vérification',
            [AgentStatus.APPROVED]: 'Certifié',
            [AgentStatus.REJECTED]: 'Refusé',
            [AgentStatus.SUSPENDED]: 'Suspendu'
        };
        return labels[status] || status;
    }

    getStatusColor(status: AgentStatus): string {
        const colors = {
            [AgentStatus.PENDING]: 'warning',
            [AgentStatus.ADMIN_REVIEW]: 'info',
            [AgentStatus.APPROVED]: 'success',
            [AgentStatus.REJECTED]: 'danger',
            [AgentStatus.SUSPENDED]: 'danger'
        };
        return colors[status] || 'secondary';
    }

    getValidationRateColor(rate: number): string {
        if (rate >= 80) return 'success';
        if (rate >= 60) return 'warning';
        return 'danger';
    }

    getRatingStars(rating: number): string[] {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('star');
        }

        if (hasHalfStar) {
            stars.push('star_half');
        }

        while (stars.length < 5) {
            stars.push('star_border');
        }

        return stars;
    }
}