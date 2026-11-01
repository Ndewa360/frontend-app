import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutDividedAltComponent } from './app-layout-divided-alt.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppLayoutDividedAltComponent', () => {
  let fixture: ComponentFixture<AppLayoutDividedAltComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutDividedAltComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutDividedAltComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
