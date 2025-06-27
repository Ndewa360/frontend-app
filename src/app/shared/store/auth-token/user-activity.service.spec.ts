import { TestBed } from '@angular/core/testing';
import { UserActivityService, UserActivityState } from './user-activity.service';

describe('UserActivityService', () => {
  let service: UserActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with ACTIVE state', () => {
    expect(service.isUserActive()).toBeTruthy();
    expect(service.isUserInactive()).toBeFalsy();
    expect(service.isUserCriticallyInactive()).toBeFalsy();
  });

  it('should start monitoring when called', () => {
    service.startMonitoring();
    
    service.getActivityState().subscribe(state => {
      expect(state).toBe(UserActivityState.ACTIVE);
    });
  });

  it('should record activity and reset to ACTIVE state', () => {
    service.startMonitoring();
    service.recordActivity();
    
    expect(service.isUserActive()).toBeTruthy();
  });

  it('should stop monitoring when called', () => {
    service.startMonitoring();
    service.stopMonitoring();
    
    // Après arrêt, le service ne devrait plus surveiller
    expect(service.isUserActive()).toBeTruthy(); // État par défaut
  });

  it('should update configuration', () => {
    const newConfig = {
      inactivityTimeout: 10 * 60 * 1000, // 10 minutes
      criticalInactivityTimeout: 20 * 60 * 1000 // 20 minutes
    };
    
    service.updateConfig(newConfig);
    const config = service.getConfig();
    
    expect(config.inactivityTimeout).toBe(newConfig.inactivityTimeout);
    expect(config.criticalInactivityTimeout).toBe(newConfig.criticalInactivityTimeout);
  });
});
