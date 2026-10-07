import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { filter, take, timeout } from 'rxjs/operators';
import { UserProfileState } from '../store/user-profile/user-profile.state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AgentValidationGuard implements CanActivate {
  /** Attente maximale quand un chargement de profil est déjà en cours. */
  private static readonly PROFILE_WAIT_MS = 300;

  constructor(
    private router: Router,
    private http: HttpClient,
    private store: Store
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const user = await this.resolveUser();
    
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
      this.router.navigateByUrl('/app/agent/complete-profile', { replaceUrl: true });
      return false;
    }
  }

  /**
   * Profil courant, sans délai artificiel.
   *
   * L'ancienne version dormait 100 ms « pour éviter les conflits de
   * redirection ». Ce délai était fixe et inutile : les resolvers ne
   * s'exécutent qu'après les guards (router.mjs, `resolveData` sur
   * `canActivateChecks`), donc sur un premier accès le profil n'est de toute
   * façon pas encore là — attendre ne changeait pas l'issue, seulement la
   * latence de chaque entrée dans `/:lang/app/*`.
   *
   * On ne patiente plus que lorsqu'un chargement est réellement en cours
   * (`LOADING`) : sinon il n'y a rien à attendre. `timeout` garantit qu'on ne
   * ralentit jamais la navigation au-delà de `PROFILE_WAIT_MS`.
   */
  private async resolveUser(): Promise<any> {
    const snapshot = () => this.store.selectSnapshot(UserProfileState.selectStateUserProfile);

    const status: string | undefined = this.store.selectSnapshot(
      (state: any) => state.userprofile?.initLoadingState
    );

    if (status !== 'LOADING') {
      return snapshot();
    }

    try {
      await this.store
        .select((state: any) => state.userprofile?.initLoadingState)
        .pipe(
          filter((s: string) => s === 'LOADED' || s === 'ERROR'),
          take(1),
          timeout(AgentValidationGuard.PROFILE_WAIT_MS)
        )
        .toPromise();
    } catch {
      // Expiration : on repart avec l'état actuel plutôt que de bloquer la route.
    }

    return snapshot();
  }
}