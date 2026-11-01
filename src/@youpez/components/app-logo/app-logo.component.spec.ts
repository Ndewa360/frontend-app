import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLogoComponent } from './app-logo.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppLogoComponent', () => {
  let fixture: ComponentFixture<AppLogoComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLogoComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLogoComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
