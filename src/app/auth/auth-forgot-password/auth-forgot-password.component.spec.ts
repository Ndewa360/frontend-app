import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthForgotPasswordComponent } from './auth-forgot-password.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AuthForgotPasswordComponent', () => {
  let fixture: ComponentFixture<AuthForgotPasswordComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthForgotPasswordComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthForgotPasswordComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
