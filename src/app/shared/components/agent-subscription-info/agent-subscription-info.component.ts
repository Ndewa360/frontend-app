import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState } from '../../store/user-profile/user-profile.state';
import { SubscriptionLimitState } from '../../store/subscription-limit/subscription-limit.state';
import { SubscriptionStatus } from '../../store/subscription-limit/subscription-limit.model';

@Component({
  selector: 'app-agent-subscription-info',
  template: `
    <div class="agent-subscription-card" *ngIf="isAgent$ | async">
      <div class="card-header">
        <h3 class="card-title">
          <i class="icon-briefcase"></i>
          Plan Agent Immobilier
        </h3>
        <span class="plan-badge free">GRATUIT</span>
      </div>
      
      <div class="card-content">
        <div class="limits-grid">
          <div class="limit-item">
            <div class="limit-icon">🏢</div>
            <div class="limit-info">
              <span class="limit-label">Biens gérés</span>
              <span class="limit-value">
                {{ (subscriptionStatus$ | async)?.propertyCount || 0 }} / 5
              </span>
            </div>
          </div>
          
          <div class="limit-item">
            <div class="limit-icon">🏠</div>
            <div class="limit-info">
              <span class="limit-label">Unités par bien</span>
              <span class="limit-value">
                Max {{ (subscriptionStatus$ | async)?.unitsPerPropertyLimit || 10 }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="agent-benefits">
          <h4>Avantages Agent</h4>
          <ul>
            <li>✅ Gestion de 5 biens maximum</li>
            <li>✅ 10 unités par bien</li>
            <li>✅ Création de comptes propriétaires</li>
            <li>✅ Interface simplifiée</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agent-subscription-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      color: white;
      margin-bottom: 20px;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .card-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .plan-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .limits-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .limit-item {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 8px;
    }
    
    .limit-icon {
      font-size: 24px;
      margin-right: 12px;
    }
    
    .limit-info {
      display: flex;
      flex-direction: column;
    }
    
    .limit-label {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .limit-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .agent-benefits h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    
    .agent-benefits ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
    }
    
    .agent-benefits li {
      margin-bottom: 5px;
    }
  `]
})
export class AgentSubscriptionInfoComponent implements OnInit {
  isAgent$: Observable<boolean>;
  subscriptionStatus$: Observable<SubscriptionStatus | null>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.isAgent$ = this.store.select(state => 
      state.userProfile?.userProfile?.userType === 'AGENT'
    );
    
    this.subscriptionStatus$ = this.store.select(SubscriptionLimitState.selectSubscriptionStatus);
  }
}