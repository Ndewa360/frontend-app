import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgentStatusService {
  private agentStatusSubject = new BehaviorSubject<string | null>(null);
  public agentStatus$ = this.agentStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private store: Store
  ) {
    // Initialiser le statut au démarrage
    this.initializeAgentStatus();
  }

  private async initializeAgentStatus(): Promise<void> {
    // Attendre que le profil utilisateur soit chargé
    setTimeout(() => {
      this.checkAgentStatus();
    }, 1000);
  }

  async checkAgentStatus(): Promise<void> {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    if (!user || user.userType !== 'AGENT') {
      this.agentStatusSubject.next('NOT_AGENT');
      return;
    }

    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      
      if (!response) {
        this.agentStatusSubject.next('INCOMPLETE');
        return;
      }
      
      const agentProfile = response.data || response;

      if (!agentProfile || !agentProfile.isProfileCompleted) {
        this.agentStatusSubject.next('INCOMPLETE');
      } else {
        this.agentStatusSubject.next(agentProfile.status);
      }
    } catch (error) {
      console.error('Error checking agent status:', error);
      this.agentStatusSubject.next('INCOMPLETE');
    }
  }

  isAgentApproved(): boolean {
    return this.agentStatusSubject.value === 'APPROVED';
  }

  isAgent(): boolean {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    return user?.userType === 'AGENT';
  }

  canAccessProperties(): boolean {
    return !this.isAgent() || this.isAgentApproved();
  }
}