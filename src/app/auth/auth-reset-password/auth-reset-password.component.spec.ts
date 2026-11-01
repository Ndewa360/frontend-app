import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthResetPasswordComponent } from './auth-reset-password.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AuthResetPasswordComponent', () => {
  let fixture: ComponentFixture<AuthResetPasswordComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthResetPasswordComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthResetPasswordComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
