import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';
import { silentHttp } from '../http/http-error-context';

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
      // Sonde de fond au démarrage : l'appelant n'a rien demandé, l'échec est
      // silencieux (le journal de l'intercepteur reste alimenté).
      const response: any = await this.http
        .get(`${environment.apiUrl}/agents/${user._id}`, { context: silentHttp() })
        .toPromise();

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
      // Une coupure réseau ne doit pas faire passer un profil complété pour
      // « incomplet » : on conserve le dernier statut connu. `canAccessProperties()`
      // reste bloquant tant que le statut n'a jamais pu être lu (fail-closed).
      this.agentStatusSubject.next(this.agentStatusSubject.value);
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