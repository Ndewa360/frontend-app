import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthTokenState } from '../../store/auth-token/auth-token.state';
import { RefreshTokenService } from '../../store/auth-token/refresh-token.service';
import { UserActivityService, UserActivityState, UserActivityStatus } from '../../store/auth-token/user-activity.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-debug-token-panel',
  template: `
    <div class="debug-panel" *ngIf="showPanel">
      <div class="debug-header">
        <h3>🔧 Debug Token Panel</h3>
        <button (click)="togglePanel()" class="close-btn">×</button>
      </div>
      
      <div class="debug-content">
        <!-- Token Info -->
        <div class="section">
          <h4>📊 Token Status</h4>
          <div class="info-grid">
            <div>Access Token: <span [class]="hasAccessToken ? 'success' : 'error'">{{ hasAccessToken ? '✅' : '❌' }}</span></div>
            <div>Refresh Token: <span [class]="hasRefreshToken ? 'success' : 'error'">{{ hasRefreshToken ? '✅' : '❌' }}</span></div>
            <div>Token Expiration: {{ tokenExpiration | date:'medium' }}</div>
          </div>
        </div>

        <!-- Activity Status -->
        <div class="section">
          <h4>👤 Activité Utilisateur</h4>
          <div class="info-grid">
            <div>État: <span [class]="getActivityStateClass()">{{ getActivityStateLabel() }}</span></div>
            <div>Dernière activité: {{ (activityStatus$ | async)?.lastActivity | date:'HH:mm:ss' }}</div>
            <div>Inactif dans: {{ formatTime((activityStatus$ | async)?.timeUntilInactive) }}</div>
            <div>Déconnexion dans: {{ formatTime((activityStatus$ | async)?.timeUntilCritical) }}</div>
          </div>
          <div class="activity-info" [ngClass]="getActivityStateClass()">
            {{ getActivityMessage() }}
          </div>
        </div>

        <!-- Test Actions -->
        <div class="section">
          <h4>🧪 Test Actions</h4>
          <div class="button-grid">
            <button (click)="testRefreshToken()" class="test-btn">🔄 Test Refresh Token</button>
            <button (click)="recordActivity()" class="test-btn">👆 Record Activity</button>
            <button (click)="simulateInactivity()" class="test-btn">😴 Simulate Inactivity</button>
            <button (click)="simulateCriticalInactivity()" class="test-btn">💀 Simulate Critical</button>
            <button (click)="resetActivity()" class="test-btn">🔄 Reset Activity</button>
            <button (click)="openMonitoringDashboard()" class="test-btn monitoring-btn">📊 Monitoring Dashboard</button>
          </div>
        </div>

        <!-- Logs -->
        <div class="section">
          <h4>📝 Recent Logs</h4>
          <div class="logs">
            <div *ngFor="let log of recentLogs" [class]="'log-' + log.type">
              {{ log.timestamp | date:'HH:mm:ss' }} - {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Button -->
    <button *ngIf="!showPanel" (click)="togglePanel()" class="debug-toggle">🔧</button>
  `,
  styles: [`
    .debug-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      overflow-y: auto;
    }

    .debug-header {
      background: #007bff;
      color: white;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .debug-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    }

    .debug-content {
      padding: 15px;
    }

    .section {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .section h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }

    .info-grid {
      display: grid;
      gap: 5px;
      font-size: 12px;
    }

    .button-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .test-btn {
      padding: 8px 12px;
      border: 1px solid #007bff;
      background: white;
      color: #007bff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }

    .test-btn:hover {
      background: #007bff;
      color: white;
    }

    .monitoring-btn {
      background: #28a745 !important;
      color: white !important;
      font-weight: bold;
    }

    .monitoring-btn:hover {
      background: #218838 !important;
    }

    .success { color: #28a745; }
    .error { color: #dc3545; }
    .warning { color: #ffc107; }

    .logs {
      max-height: 150px;
      overflow-y: auto;
      font-size: 11px;
      background: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
    }

    .log-info { color: #007bff; }
    .log-success { color: #28a745; }
    .log-error { color: #dc3545; }
    .log-warning { color: #ffc107; }

    .activity-info {
      margin-top: 8px;
      padding: 8px;
      border-radius: 4px;
      font-size: 11px;
      font-style: italic;
    }

    .activity-info.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .activity-info.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .activity-info.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .debug-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
  `]
})
export class DebugTokenPanelComponent implements OnInit, OnDestroy {
  showPanel = false;
  hasAccessToken = false;
  hasRefreshToken = false;
  tokenExpiration: Date | null = null;
  activityState: UserActivityState = UserActivityState.ACTIVE;
  activityStatus$: Observable<UserActivityStatus>;
  recentLogs: Array<{timestamp: Date, message: string, type: string}> = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.activityStatus$ = this.userActivityService.getActivityStatus();
  }

  ngOnInit() {
    // Surveiller l'état des tokens
    this.store.select(AuthTokenState.selectStateToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        this.hasAccessToken = !!token?.accessToken;
        this.hasRefreshToken = !!token?.refreshToken;
      });

    // Surveiller l'expiration du token séparément
    this.store.select(AuthTokenState.selectTokenExpiration)
      .pipe(takeUntil(this.destroy$))
      .subscribe(expiration => {
        this.tokenExpiration = expiration ? new Date(expiration * 1000) : null;
      });

    // Surveiller l'état d'activité
    this.userActivityService.getActivityState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.activityState = state;
        this.addLog(`Activity state changed to: ${state}`, 'info');
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePanel() {
    this.showPanel = !this.showPanel;
  }

  testRefreshToken() {
    this.addLog('Testing refresh token...', 'info');
    this.refreshTokenService.refreshAccessToken().subscribe({
      next: (result) => {
        this.addLog('✅ Refresh token test successful', 'success');
        this.toastr.success('Refresh token test successful!');
      },
      error: (error) => {
        this.addLog(`❌ Refresh token test failed: ${error.message}`, 'error');
        this.toastr.error('Refresh token test failed!');
      }
    });
  }

  recordActivity() {
    this.userActivityService.recordActivity();
    this.addLog('👆 Activity recorded manually', 'info');
    this.toastr.info('Activity recorded!');
  }

  simulateInactivity() {
    // Simuler l'inactivité en modifiant la configuration temporairement
    this.userActivityService.updateConfig({
      inactivityTimeout: 1000, // 1 seconde
      criticalInactivityTimeout: 30 * 60 * 1000 // 30 minutes
    });
    this.addLog('😴 Simulation d\'inactivité activée (1 seconde)', 'warning');
    this.toastr.warning(
      '⚠️ Test d\'inactivité activé ! Vous serez déconnecté dans 1 seconde pour tester le système.',
      'Debug - Test Inactivité',
      { timeOut: 8000 }
    );
  }

  simulateCriticalInactivity() {
    this.userActivityService.updateConfig({
      inactivityTimeout: 1000, // 1 seconde
      criticalInactivityTimeout: 2000 // 2 secondes
    });
    this.addLog('💀 Simulation d\'inactivité critique activée (2 secondes)', 'error');
    this.toastr.error(
      '🚨 Test d\'inactivité critique ! Déconnexion forcée dans 2 secondes pour tester la sécurité.',
      'Debug - Test Critique',
      { timeOut: 10000 }
    );
  }

  resetActivity() {
    this.userActivityService.updateConfig({
      inactivityTimeout: 15 * 60 * 1000, // 15 minutes
      criticalInactivityTimeout: 30 * 60 * 1000 // 30 minutes
    });
    this.userActivityService.recordActivity();
    this.addLog('🔄 Activity monitoring reset to normal', 'success');
    this.toastr.success('Activity monitoring reset!');
  }

  openMonitoringDashboard() {
    // Ouvrir le dashboard de monitoring dans un nouvel onglet ou naviguer vers la page
    this.router.navigate(['/admin/monitoring/dashboard']);
    this.addLog('📊 Opening monitoring dashboard', 'info');
    this.toastr.info('Ouverture du dashboard de monitoring...', 'Debug');
  }

  // openMonitoringDashboard() {
  //   // Ouvrir le dashboard de monitoring dans un nouvel onglet ou naviguer vers la page
  //   this.router.navigate(['/monitoring/dashboard']);
  //   this.addLog('📊 Opening monitoring dashboard', 'info');
  //   this.toastr.info('Ouverture du dashboard de monitoring...', 'Debug');
  // }

  getActivityStateClass(): string {
    switch (this.activityState) {
      case UserActivityState.ACTIVE: return 'success';
      case UserActivityState.INACTIVE: return 'warning';
      case UserActivityState.CRITICAL_INACTIVE: return 'error';
      default: return '';
    }
  }

  getActivityStateLabel(): string {
    switch (this.activityState) {
      case UserActivityState.ACTIVE: return '🟢 Actif';
      case UserActivityState.INACTIVE: return '🟡 Inactif';
      case UserActivityState.CRITICAL_INACTIVE: return '🔴 Critique';
      default: return '❓ Inconnu';
    }
  }

  getActivityMessage(): string {
    switch (this.activityState) {
      case UserActivityState.ACTIVE:
        return '✅ Votre session est active et sécurisée';
      case UserActivityState.INACTIVE:
        return '⏰ Session suspendue - Reconnexion requise pour continuer';
      case UserActivityState.CRITICAL_INACTIVE:
        return '🔒 Session fermée pour sécurité - Reconnexion obligatoire';
      default:
        return 'État d\'activité en cours de détermination...';
    }
  }

  formatTime(milliseconds: number | undefined): string {
    if (!milliseconds || milliseconds <= 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private addLog(message: string, type: string) {
    this.recentLogs.unshift({
      timestamp: new Date(),
      message,
      type
    });
    
    // Garder seulement les 10 derniers logs
    if (this.recentLogs.length > 10) {
      this.recentLogs = this.recentLogs.slice(0, 10);
    }
  }
}
