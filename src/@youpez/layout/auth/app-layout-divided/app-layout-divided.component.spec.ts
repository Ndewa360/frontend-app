import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutDividedComponent } from './app-layout-divided.component';
import { configureSmokeTest } from '../../../../testing/component-smoke';

describe('AppLayoutDividedComponent', () => {
  let fixture: ComponentFixture<AppLayoutDividedComponent>;

  beforeEach(async () => {
    await configureSmokeTest(AppLayoutDividedComponent, { standalone: true });
    fixture = TestBed.createComponent(AppLayoutDividedComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
