import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthWelcomeScreenComponent } from './auth-welcome-screen.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AuthWelcomeScreenComponent', () => {
  let fixture: ComponentFixture<AuthWelcomeScreenComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthWelcomeScreenComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthWelcomeScreenComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
