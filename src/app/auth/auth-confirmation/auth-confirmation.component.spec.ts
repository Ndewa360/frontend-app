import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthConfirmationComponent } from './auth-confirmation.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AuthConfirmationComponent', () => {
  let fixture: ComponentFixture<AuthConfirmationComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AuthConfirmationComponent, { standalone: true });
    fixture = TestBed.createComponent(AuthConfirmationComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
