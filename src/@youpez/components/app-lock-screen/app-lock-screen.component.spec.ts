import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLockScreenComponent } from './app-lock-screen.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppLockScreenComponent', () => {
  let fixture: ComponentFixture<AppLockScreenComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLockScreenComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLockScreenComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
