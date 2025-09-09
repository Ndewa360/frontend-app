import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { UserProfileState } from 'src/app/shared/store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pending-approval',
  templateUrl: './pending-approval.component.html',
  styleUrls: ['./pending-approval.component.scss']
})
export class PendingApprovalComponent implements OnInit {
  agentProfile: any = null;
  isLoading = true;

  constructor(
    private http: HttpClient,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.loadAgentProfile();
  }

  async loadAgentProfile(): Promise<void> {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      this.agentProfile = response.data || response;
    } catch (error) {
      console.error('Error loading agent profile:', error);
    } finally {
      this.isLoading = false;
    }
  }
}