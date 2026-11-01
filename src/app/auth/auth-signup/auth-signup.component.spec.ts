import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthSignupComponent } from './auth-signup.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AuthSignupComponent', () => {
  let fixture: ComponentFixture<AuthSignupComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthSignupComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthSignupComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
