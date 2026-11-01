import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLoginComponent } from './auth-login.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AuthLoginComponent', () => {
  let fixture: ComponentFixture<AuthLoginComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthLoginComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthLoginComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
