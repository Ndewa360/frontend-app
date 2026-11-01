import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppThemeSettingsComponent } from './app-theme-settings.component';
import { configureSmokeTest } from '../../../testing/component-smoke';

describe('AppThemeSettingsComponent', () => {
  let fixture: ComponentFixture<AppThemeSettingsComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppThemeSettingsComponent, { standalone: true });
    fixture = TestBed.createComponent(AppThemeSettingsComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
