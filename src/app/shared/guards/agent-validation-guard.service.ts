import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgentValidationGuard implements CanActivate {
  constructor(
    private router: Router,
    private http: HttpClient,
    private store: Store
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    // Attendre un peu pour éviter les conflits avec les redirections de connexion
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const user = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    if (!user || user.userType !== 'AGENT') {
      return true; // Not an agent, allow access
    }

    // Allow access to agent-specific pages
    const currentUrl = this.router.url;
    const allowedPaths = [
      '/app/agent/complete-profile',
      '/app/agent/pending-approval',
      '/app/auth/logout'
    ];

    if (allowedPaths.some(path => currentUrl.startsWith(path))) {
      return true;
    }
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      
      if (!response) {
        this.router.navigateByUrl('/app/agent/complete-profile', { replaceUrl: true });
        return false;
      }
      
      const agentProfile = response.data || response;

      if (!agentProfile || !agentProfile.isProfileCompleted) {
        this.router.navigateByUrl('/app/agent/complete-profile', { replaceUrl: true });
        return false;
      }

      if (agentProfile.status === 'PENDING' || agentProfile.status === 'ADMIN_REVIEW') {
        this.router.navigateByUrl('/app/agent/pending-approval', { replaceUrl: true });
        return false;
      }

      if (agentProfile.status === 'REJECTED') {
        this.router.navigateByUrl('/app/agent/pending-approval', { replaceUrl: true });
        return false;
      }

      if (agentProfile.status === 'APPROVED') {
        return true; // Approved, allow access
      }

      // Default: redirect to profile completion
      this.router.navigateByUrl('/app/agent/complete-profile', { replaceUrl: true });
      return false;
    } catch (error) {
      console.error('Error checking agent validation:', error);
      this.router.navigateByUrl('/app/agent/complete-profile', { replaceUrl: true });
      return false;
    }
  }
}