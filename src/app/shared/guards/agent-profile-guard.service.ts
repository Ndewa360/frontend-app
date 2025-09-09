import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgentProfileGuard implements CanActivate {
  constructor(
    private router: Router,
    private http: HttpClient,
    private store: Store
  ) {}

  async canActivate(): Promise<boolean> {
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    if (!user || user.userType !== 'AGENT') {
      return true; // Not an agent, allow access
    }

    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      const agentProfile = response.data || response;

      if (!agentProfile) {
        // No agent profile, redirect to completion
        this.router.navigate(['/app/agent/complete-profile']);
        return false;
      }

      if (!agentProfile.isProfileCompleted) {
        // Profile not completed, redirect to completion
        this.router.navigate(['/app/agent/complete-profile']);
        return false;
      }

      if (agentProfile.status === 'PENDING' || agentProfile.status === 'ADMIN_REVIEW') {
        // Pending approval, redirect to waiting page
        this.router.navigate(['/app/agent/pending-approval']);
        return false;
      }

      if (agentProfile.status === 'REJECTED') {
        // Rejected, redirect to rejection page
        this.router.navigate(['/app/agent/pending-approval']);
        return false;
      }

      if (agentProfile.status === 'APPROVED') {
        return true; // Approved, allow access
      }

      return false;
    } catch (error) {
      console.error('Error checking agent profile:', error);
      this.router.navigate(['/app/agent/complete-profile']);
      return false;
    }
  }
}