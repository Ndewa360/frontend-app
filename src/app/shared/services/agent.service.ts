import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    AgentProfile,
    AgentStats,
    CreateAgentRequest,
    UpdateAgentProfileRequest,
    ValidateAgentRequest,
    AgentStatus
} from '../models/agent.model';

@Injectable({
    providedIn: 'root'
})
export class AgentService {
    private readonly apiUrl = `${environment.apiUrl}/agents`;

    constructor(private http: HttpClient) {}

    // Inscription d'un nouvel agent
    registerAgent(agentData: CreateAgentRequest, verificationDocument: File): Observable<any> {
        const formData = new FormData();
        
        // Ajouter les données de l'agent
        Object.keys(agentData).forEach(key => {
            const value = agentData[key as keyof CreateAgentRequest];
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(item => formData.append(`${key}[]`, item));
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        // Ajouter le document
        formData.append('verificationDocument', verificationDocument);

        return this.http.post(`${this.apiUrl}/register`, formData);
    }

    // Récupérer le profil de l'agent connecté
    getMyProfile(): Observable<{ data: { profile: AgentProfile; stats: AgentStats } }> {
        return this.http.get<{ data: { profile: AgentProfile; stats: AgentStats } }>(`${this.apiUrl}/profile`);
    }

    // Mettre à jour le profil de l'agent
    updateMyProfile(updateData: UpdateAgentProfileRequest): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, updateData);
    }

    // Récupérer les statistiques de l'agent
    getMyStats(): Observable<{ data: AgentStats }> {
        return this.http.get<{ data: AgentStats }>(`${this.apiUrl}/stats`);
    }

    // Routes Admin
    getPendingAgents(): Observable<{ data: AgentProfile[] }> {
        return this.http.get<{ data: AgentProfile[] }>(`${this.apiUrl}/pending`);
    }

    getAllAgents(page: number = 1, limit: number = 10, status?: AgentStatus): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get(`${this.apiUrl}`, { params });
    }

    validateAgent(agentId: string, validateData: ValidateAgentRequest): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${agentId}/validate`, validateData);
    }

    getAgentById(agentId: string): Observable<{ data: { profile: AgentProfile; stats: AgentStats } }> {
        return this.http.get<{ data: { profile: AgentProfile; stats: AgentStats } }>(`${this.apiUrl}/${agentId}`);
    }

    suspendAgent(agentId: string, suspendData: { suspendedUntil: string; reason: string }): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${agentId}/suspend`, suspendData);
    }

    uploadAdditionalDocument(agentId: string, document: File, documentData: { type: string; description?: string }): Observable<any> {
        const formData = new FormData();
        formData.append('document', document);
        formData.append('type', documentData.type);
        if (documentData.description) {
            formData.append('description', documentData.description);
        }

        return this.http.post(`${this.apiUrl}/${agentId}/documents`, formData);
    }

    // Méthodes utilitaires
    getStatusLabel(status: AgentStatus): string {
        const labels = {
            [AgentStatus.PENDING]: 'En attente',
            [AgentStatus.CERTIFIED]: 'Certifié',
            [AgentStatus.PROBATION]: 'Période d\'essai',
            [AgentStatus.SUSPENDED]: 'Suspendu',
            [AgentStatus.TRUSTED]: 'Agent de confiance'
        };
        return labels[status] || status;
    }

    getStatusColor(status: AgentStatus): string {
        const colors = {
            [AgentStatus.PENDING]: 'warning',
            [AgentStatus.CERTIFIED]: 'success',
            [AgentStatus.PROBATION]: 'info',
            [AgentStatus.SUSPENDED]: 'danger',
            [AgentStatus.TRUSTED]: 'primary'
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